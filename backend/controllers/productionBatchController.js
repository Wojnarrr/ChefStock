const ProductionBatch = require("../models/ProductionBatch");
const Recipe = require("../models/Recipe");
const StockItem = require("../models/StockItem");
const InventoryMovement = require("../models/InventoryMovement");

const convertRecipeUsageToStockUnit = require("../utils/convertRecipeUsageToStockUnit");
const roundStock = require("../utils/roundStock");

const getProductionBatches = async (req, res) => {
    try {
        const batches = await ProductionBatch.find()
            .populate("itemsProduced.recipe", "name outputUnit portionsPerOutput")
            .sort({ productionDate: -1 });

        res.status(200).json(batches);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch production batches",
            error: error.message,
        });
    }
};

const getProductionBatchById = async (req, res) => {
    try {
        const batch = await ProductionBatch.findById(req.params.id).populate(
            "itemsProduced.recipe",
            "name outputUnit portionsPerOutput"
        );

        if (!batch) {
            return res.status(404).json({ message: "Production batch not found" });
        }

        res.status(200).json(batch);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch production batch",
            error: error.message,
        });
    }
};

const createProductionBatch = async (req, res) => {
    try {
        const { itemsProduced } = req.body;

        if (!itemsProduced || itemsProduced.length === 0) {
            return res.status(400).json({
                message: "Production batch must include at least one produced item.",
            });
        }

        const deductionsToApply = [];
        const stockWarnings = [];

        for (const producedItem of itemsProduced) {
            const recipe = await Recipe.findById(producedItem.recipe).populate(
                "ingredients.stockItem"
            );

            if (!recipe || !recipe.isActive) {
                return res.status(404).json({
                    message: "Recipe not found or inactive",
                    recipe: producedItem.recipe,
                });
            }

            for (const ingredient of recipe.ingredients) {
                const stockItem = ingredient.stockItem;

                if (!stockItem || !stockItem.isActive) {
                    return res.status(404).json({
                        message: "Recipe contains inactive or missing stock item",
                    });
                }

                const recipeUsageQuantity =
                    ingredient.quantity * producedItem.quantityProduced;

                const stockUnitDeduction = convertRecipeUsageToStockUnit(
                    stockItem,
                    recipeUsageQuantity
                );

                if (stockItem.currentStock < stockUnitDeduction) {
                    stockWarnings.push({
                        stockItem: stockItem.name,
                        currentStock: stockItem.currentStock,
                        requiredStock: stockUnitDeduction,
                        unit: stockItem.stockUnit,
                        message: `${stockItem.name} stock may be incorrect. App stock is ${stockItem.currentStock} ${stockItem.stockUnit}, but production needs ${stockUnitDeduction} ${stockItem.stockUnit}.`,
                    });
                }

                deductionsToApply.push({
                    stockItem,
                    recipeName: recipe.name,
                    recipeUsageQuantity,
                    recipeUsageUnit: ingredient.unit,
                    stockUnitDeduction,
                    stockUnit: stockItem.stockUnit,
                });
            }
        }

        const productionBatch = await ProductionBatch.create(req.body);

        const movementRecords = [];

        for (const deduction of deductionsToApply) {
            const stockItem = await StockItem.findById(deduction.stockItem._id);

            const previousStock = stockItem.currentStock;
            const newStock = roundStock(previousStock - deduction.stockUnitDeduction);

            stockItem.currentStock = newStock;
            await stockItem.save();

            const movement = await InventoryMovement.create({
                stockItem: stockItem._id,
                movementType: "production_usage",
                quantityChange: roundStock(-deduction.stockUnitDeduction),
                unit: deduction.stockUnit,
                previousStock,
                newStock,
                sourceType: "ProductionBatch",
                sourceId: productionBatch._id,
                performedBy: productionBatch.producedBy || null,
                notes: `Estimated usage for ${deduction.recipeName}: ${deduction.recipeUsageQuantity}${deduction.recipeUsageUnit}`,
            });

            movementRecords.push(movement);
        }

        const populatedBatch = await ProductionBatch.findById(productionBatch._id)
            .populate("itemsProduced.recipe", "name outputUnit portionsPerOutput");

        res.status(201).json({
            productionBatch: populatedBatch,
            movementsCreated: movementRecords,
            stockWarnings,
        });
    } catch (error) {
        res.status(400).json({
            message: "Failed to create production batch",
            error: error.message,
        });
    }
};

module.exports = {
    getProductionBatches,
    getProductionBatchById,
    createProductionBatch,
};