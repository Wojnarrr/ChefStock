const PrepTask = require("../models/PrepTask");
const mongoose = require("mongoose");
const PrepBatch = require("../models/PrepBatch");
const Recipe = require("../models/Recipe");
const StockItem = require("../models/StockItem");
const InventoryMovement = require("../models/InventoryMovement");
const convertRecipeUsageToStockUnit = require("../utils/convertRecipeUsageToStockUnit");
const roundStock = require("../utils/roundStock");

const getPrepTasks = async (req, res) => {
    try {
        // Open tasks always, finished ones only from the last 2 weeks.
        const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

        const prepTasks = await PrepTask.find({
            restaurant: req.restaurantId,
            $or: [{ status: { $ne: "done" } }, { completedAt: { $gte: twoWeeksAgo } }],
        })

        res.status(200).json(prepTasks);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch prep tasks",
            error: error.message,
        });
    }
};

const createPrepTask = async (req, res) => {
    try {
        const prepTask = await PrepTask.create({
            ...req.body,
            restaurant: req.restaurantId,
        });

        const populatedPrepTask = await PrepTask.findById(prepTask._id).populate(
            "linkedRecipe",
            "name outputUnit outputQuantity"
        );

        res.status(201).json(populatedPrepTask);
    } catch (error) {
        res.status(400).json({
            message: "Failed to create prep task",
            error: error.message,
        });
    }
};
const completePrepTask = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const prepTask = await PrepTask.findOne({
            _id: req.params.id,
            restaurant: req.restaurantId,
        }).session(session);

        if (!prepTask) {
            await session.abortTransaction();
            return res.status(404).json({ message: "Prep task not found" });
        }

        if (prepTask.status === "done") {
            await session.abortTransaction();
            return res.status(400).json({
                message: "Prep task is already marked done",
            });
        }

        // Case 1: plain checklist item — no recipe, no stock effect
        if (!prepTask.linkedRecipe) {
            prepTask.status = "done";
            prepTask.completedAt = new Date();
            await prepTask.save({ session });

            await session.commitTransaction();

            return res.status(200).json({
                prepTask,
                prepBatch: null,
                movementsCreated: [],
                stockWarnings: [],
            });
        }

        // Case 2: recipe-linked task — scale ingredients and move stock
        const recipe = await Recipe.findOne({
            _id: prepTask.linkedRecipe,
            restaurant: req.restaurantId,
        })
            .populate("ingredients.stockItem")
            .populate("outputStockItem")
            .session(session);

        if (!recipe || !recipe.isActive) {
            await session.abortTransaction();
            return res.status(404).json({ message: "Linked recipe not found or inactive" });
        }

        const scaleFactor = prepTask.targetQuantity / recipe.outputQuantity;
        const stockWarnings = [];
        const deductionsToApply = [];

        for (const ingredient of recipe.ingredients) {
            const stockItem = ingredient.stockItem;

            if (!stockItem || !stockItem.isActive) {
                await session.abortTransaction();
                return res.status(404).json({
                    message: "Recipe contains inactive or missing stock item",
                });
            }

            const recipeUsageQuantity = ingredient.quantity * scaleFactor;
            const stockUnitDeduction = roundStock(
                convertRecipeUsageToStockUnit(stockItem, recipeUsageQuantity)
            );

            if (stockItem.currentStock < stockUnitDeduction) {
                stockWarnings.push({
                    stockItem: stockItem.name,
                    currentStock: stockItem.currentStock,
                    requiredStock: stockUnitDeduction,
                    unit: stockItem.stockUnit,
                    message: `${stockItem.name} stock may be incorrect. App stock is ${stockItem.currentStock} ${stockItem.stockUnit}, but this task needs ${stockUnitDeduction} ${stockItem.stockUnit}.`,
                });
            }

            deductionsToApply.push({
                stockItem,
                stockUnitDeduction,
                stockUnit: stockItem.stockUnit,
            });
        }

        const outputItem = recipe.outputStockItem;

        if (!outputItem || !outputItem.isActive) {
            await session.abortTransaction();
            return res.status(404).json({
                message: "Recipe output stock item not found or inactive",
            });
        }

        const createdPrepBatches = await PrepBatch.create(
            [
                {
                    restaurant: req.restaurantId,
                    prepDate: new Date(),
                    prepType: "recipe_based",
                    outputStockItem: outputItem._id,
                    outputQuantity: prepTask.targetQuantity,
                    outputUnit: recipe.outputUnit,
                    inputs: deductionsToApply.map((deduction) => ({
                        stockItem: deduction.stockItem._id,
                        quantityUsed: deduction.stockUnitDeduction,
                        unit: deduction.stockUnit,
                    })),
                    notes: `Auto-generated from prep task: ${prepTask.taskName}`,
                },
            ],
            { session }
        );

        const prepBatch = createdPrepBatches[0];
        const movementRecords = [];

        for (const deduction of deductionsToApply) {
            const stockItem = await StockItem.findOne({
                _id: deduction.stockItem._id,
                restaurant: req.restaurantId,
            }).session(session);

            const previousStock = stockItem.currentStock;
            const newStock = roundStock(previousStock - deduction.stockUnitDeduction);

            stockItem.currentStock = newStock;
            await stockItem.save({ session });

            const createdMovements = await InventoryMovement.create(
                [
                    {
                        restaurant: req.restaurantId,
                        stockItem: stockItem._id,
                        movementType: "prep_input",
                        quantityChange: roundStock(-deduction.stockUnitDeduction),
                        unit: deduction.stockUnit,
                        previousStock,
                        newStock,
                        sourceType: "PrepBatch",
                        sourceId: prepBatch._id,
                        performedBy: null,
                        notes: `Used for prep task: ${prepTask.taskName}`,
                    },
                ],
                { session }
            );

            movementRecords.push(createdMovements[0]);
        }

        const outputStockItem = await StockItem.findOne({
            _id: outputItem._id,
            restaurant: req.restaurantId,
        }).session(session);
        const previousOutputStock = outputStockItem.currentStock;
        const roundedTargetQuantity = roundStock(prepTask.targetQuantity);
        const newOutputStock = roundStock(previousOutputStock + roundedTargetQuantity);

        outputStockItem.currentStock = newOutputStock;
        await outputStockItem.save({ session });

        const createdOutputMovements = await InventoryMovement.create(
            [
                {
                    restaurant: req.restaurantId,
                    stockItem: outputStockItem._id,
                    movementType: "prep_output",
                    quantityChange: roundedTargetQuantity,
                    unit: recipe.outputUnit,
                    previousStock: previousOutputStock,
                    newStock: newOutputStock,
                    sourceType: "PrepBatch",
                    sourceId: prepBatch._id,
                    performedBy: null,
                    notes: `Prep task completed: ${prepTask.taskName}`,
                },
            ],
            { session }
        );

        movementRecords.push(createdOutputMovements[0]);

        prepTask.status = "done";
        prepTask.completedAt = new Date();
        prepTask.linkedPrepBatch = prepBatch._id;
        await prepTask.save({ session });

        await session.commitTransaction();

        const populatedTask = await PrepTask.findById(prepTask._id).populate(
            "linkedRecipe",
            "name outputUnit outputQuantity"
        );

        res.status(200).json({
            prepTask: populatedTask,
            prepBatch,
            movementsCreated: movementRecords,
            stockWarnings,
        });
    } catch (error) {
        await session.abortTransaction();

        res.status(400).json({
            message: "Failed to complete prep task",
            error: error.message,
        });
    } finally {
        session.endSession();
    }
};

module.exports = {
    getPrepTasks,
    createPrepTask,
    completePrepTask,
};