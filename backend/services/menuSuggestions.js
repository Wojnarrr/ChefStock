// Guesses which recipe a Flipdish item is made from, and how many portions it
// uses, just from the names. Pure functions: no database, easy to test.
//
//   "Margherita"                          -> Margherita tray, 1 portion (a slice)
//   "Focaccia with Mozzarella - Half Tray" -> Focaccia with Mozzarella tray, 4 of 8
//   "Coca-Cola Zero"                       -> no recipe (drinks are extras, not recipes)
//
// It's only a suggestion: the owner checks it on the Menu page.

// Words that say nothing about WHICH pizza it is.
const FILLER_WORDS = new Set([
    "pizza", "tray", "slice", "half", "full", "whole", "the", "with", "and", "of", "a", "al", "di",
]);

// "Ham & Mushroom - Half Tray" -> Set { "ham", "mushroom" }
const meaningfulWords = (name) =>
    new Set(
        name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[̀-ͯ]/g, "") // é -> e
            .split(/[^a-z0-9]+/)
            .filter((word) => word && !FILLER_WORDS.has(word))
    );

const isSubset = (small, big) => [...small].every((word) => big.has(word));

// How well an item name fits a recipe name: 3 = same words, 2 = the item has
// every word of the recipe and more, 1 = the recipe has every word of the item.
const matchScore = (itemWords, recipeWords) => {
    if (itemWords.size === 0 || recipeWords.size === 0) return 0;
    if (itemWords.size === recipeWords.size && isSubset(itemWords, recipeWords)) return 3;
    if (isSubset(recipeWords, itemWords)) return 2;
    if (isSubset(itemWords, recipeWords)) return 1;
    return 0;
};

// recipes: production recipes, each { _id, name, portionsPerOutput }
const suggestRecipe = (itemName, recipes) => {
    const itemWords = meaningfulWords(itemName);
    let best = null;
    let bestScore = 0;
    let tie = false;

    for (const recipe of recipes) {
        const score = matchScore(itemWords, meaningfulWords(recipe.name));
        if (score > bestScore) {
            best = recipe;
            bestScore = score;
            tie = false;
        } else if (score === bestScore && score > 0) {
            tie = true; // two recipes fit equally well: don't guess
        }
    }

    return tie ? null : best;
};

// Slice (or no size) = 1 portion, half tray = half, full tray = all of it.
const suggestPortions = (itemName, recipe) => {
    const name = itemName.toLowerCase();
    const perTray = recipe?.portionsPerOutput || null;

    if (perTray && /\bhalf\b/.test(name)) return perTray / 2;
    if (perTray && /\b(full|whole)\b|\btray\b/.test(name)) return perTray;
    return 1;
};

const suggestForItem = (itemName, recipes) => {
    const recipe = suggestRecipe(itemName, recipes);
    if (!recipe) return null;
    return { recipeId: recipe._id, recipeName: recipe.name, portions: suggestPortions(itemName, recipe) };
};

module.exports = { suggestForItem, suggestRecipe, suggestPortions, meaningfulWords };
