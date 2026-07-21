const convertRecipeUsageToStockUnit = (stockItem, recipeQuantity) => {
    if (stockItem.stockUnit === stockItem.recipeUnit) {
        return recipeQuantity;
    }

    if (stockItem.unitsPerStockUnit) {
        return recipeQuantity / stockItem.unitsPerStockUnit;
    }

    if (stockItem.estimatedUnitsPerStockUnit) {
        return recipeQuantity / stockItem.estimatedUnitsPerStockUnit;
    }

    throw new Error(
        `Cannot convert ${stockItem.name} from ${stockItem.recipeUnit} to ${stockItem.stockUnit}`
    );
};

module.exports = convertRecipeUsageToStockUnit;