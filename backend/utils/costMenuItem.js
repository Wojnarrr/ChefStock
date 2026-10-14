const convertRecipeUsageToStockUnit = require("./convertRecipeUsageToStockUnit");

// Works out the cost, profit and food cost % of one menu item.
//
// - menuItem: with extras.stockItem populated
// - calculator: from createCostCalculator(recipes)
// - recipesById: Map of recipe id -> recipe (with ingredients populated)
// - vatRate: the restaurant's VAT %, or null if not set
const costMenuItem = (menuItem, calculator, recipesById, vatRate) => {
    let cost = 0;
    const missing = [];

    // 1. The recipe portions, if it has a recipe: cost of one portion x portions.
    if (menuItem.recipe) {
        const recipeId = String(menuItem.recipe._id ?? menuItem.recipe);
        const recipe = recipesById.get(recipeId);

        if (recipe) {
            const perPortion = calculator.getCostPerPortion(recipe);
            cost += perPortion.cost * menuItem.portions;
            missing.push(...perPortion.missing);
        } else {
            missing.push("Recipe (deleted or inactive)");
        }
    }

    // 2. Extras like boxes, priced the same way as recipe ingredients.
    for (const extra of menuItem.extras) {
        const stockItem = extra.stockItem;

        if (!stockItem || !stockItem.name) {
            missing.push("Unknown extra");
            continue;
        }

        const price = calculator.getCostPerStockUnit(stockItem);
        missing.push(...price.missing);

        try {
            cost += price.cost * convertRecipeUsageToStockUnit(stockItem, extra.quantity);
        } catch {
            missing.push(`${stockItem.name} (can't convert ${stockItem.recipeUnit} to ${stockItem.stockUnit})`);
        }
    }

    // 3. Food cost % is worked out on the price WITHOUT VAT, because the VAT
    //    The item's own rate wins; otherwise the restaurant's.
    const effectiveVatRate = menuItem.vatRate ?? vatRate;
    const vatRateSet = effectiveVatRate !== null && effectiveVatRate !== undefined;
    const priceExVat = vatRateSet ? menuItem.sellPrice / (1 + effectiveVatRate / 100) : menuItem.sellPrice;
    const foodCostPercent = priceExVat > 0 ? (cost / priceExVat) * 100 : null;

    return {
        cost,
        priceExVat,
        grossProfit: priceExVat - cost,
        foodCostPercent,
        missing: [...new Set(missing)],
        isComplete: missing.length === 0,
        vatRate: vatRateSet ? effectiveVatRate : null,    };
};

module.exports = costMenuItem;