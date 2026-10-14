const convertRecipeUsageToStockUnit = require("./convertRecipeUsageToStockUnit");

// A prepared item can be made from another prepared item (dough -> ...).
// This stops the calculation if a recipe ever uses its own output by mistake.
const MAX_DEPTH = 5;

// Works out what recipes cost, using the latest delivery prices.
//
// Pass in ALL of the restaurant's active recipes (with ingredients.stockItem
// populated). Everything after that is plain calculation with no database
// calls, so costing a whole menu takes one query instead of hundreds.
//
// Every result is { cost, missing }: `missing` lists ingredients without a
// price, so a total is never quietly too low.
const createCostCalculator = (recipes) => {
    // Which prep recipe makes each prepared stock item? (stock item id -> recipe)
    const prepRecipeFor = new Map();

    for (const recipe of recipes) {
        if (recipe.recipeType === "prep" && recipe.outputStockItem) {
            const outputId = recipe.outputStockItem._id ?? recipe.outputStockItem;
            prepRecipeFor.set(String(outputId), recipe);
        }
    }

    // Price of ONE stock unit (one case, one container...) of an item.
    const getCostPerStockUnit = (stockItem, depth) => {
        // 1. Bought in: the price from the latest delivery.
        if (stockItem.lastUnitCost != null) {
            return { cost: stockItem.lastUnitCost, missing: [] };
        }

        // 2. Made in house: what its prep recipe costs, divided by how much it makes.
        const prepRecipe = prepRecipeFor.get(String(stockItem._id));

        if (prepRecipe && prepRecipe.outputQuantity) {
            if (depth >= MAX_DEPTH) {
                return { cost: 0, missing: [`${stockItem.name} (recipe uses itself)`] };
            }

            const batch = getRecipeCost(prepRecipe, depth + 1);
            return { cost: batch.cost / prepRecipe.outputQuantity, missing: batch.missing };
        }

        // 3. No price and no recipe: we can't know.
        return { cost: 0, missing: [stockItem.name] };
    };

    // Cost of the ingredients exactly as written in the recipe:
    // for a production recipe that's ONE output (one tray),
    // for a prep recipe it's one batch (outputQuantity of the prepared item).
    const getRecipeCost = (recipe, depth = 0) => {
        let cost = 0;
        const missing = [];

        for (const ingredient of recipe.ingredients) {
            // Optional extras aren't part of the standard cost.
            if (ingredient.isOptional) continue;

            const stockItem = ingredient.stockItem;

            if (!stockItem || !stockItem.name) {
                missing.push("Unknown ingredient");
                continue;
            }

            const price = getCostPerStockUnit(stockItem, depth);
            missing.push(...price.missing);

            try {
                // Same conversion stock deduction uses, e.g. 450 g -> 0.045 of a 10 kg case.
                const stockUnitsUsed = convertRecipeUsageToStockUnit(stockItem, ingredient.quantity);
                cost += price.cost * stockUnitsUsed;
            } catch {
                missing.push(`${stockItem.name} (can't convert ${stockItem.recipeUnit} to ${stockItem.stockUnit})`);
            }
        }

        // new Set(...) removes duplicates, e.g. basil missing from two sub-recipes.
        return { cost, missing: [...new Set(missing)] };
    };

    // Cost of one portion (one slice) of a production recipe.
    const getCostPerPortion = (recipe) => {
        const { cost, missing } = getRecipeCost(recipe);
        const portions = recipe.portionsPerOutput || 1;
        return { cost: cost / portions, missing };
    };

    return {
        getRecipeCost: (recipe) => getRecipeCost(recipe),
        getCostPerPortion,
        getCostPerStockUnit: (stockItem) => getCostPerStockUnit(stockItem, 0),
    };
};

module.exports = createCostCalculator;