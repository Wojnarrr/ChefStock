const mongoose = require("mongoose");
const PrepBatch = require("../models/PrepBatch");
const StockItem = require("../models/StockItem");
const InventoryMovement = require("../models/InventoryMovement");
const roundStock = require("../utils/roundStock");
const getPrepBatches = async (req, res) => {
    try {
        const prepBatches = await PrepBatch.find()
            .populate("outputStockItem", "name stockUnit currentStock")
            .populate("inputs.stockItem", "name stockUnit currentStock")
            .sort({ prepDate: -1 });

        res.status(200).json(prepBatches);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch prep batches",
            error: error.message,
        });
    }
};

const getPrepBatchById = async (req, res) => {
    try {
        const prepBatch = await PrepBatch.findById(req.params.id)
            .populate("outputStockItem", "name stockUnit currentStock")
            .populate("inputs.stockItem", "name stockUnit currentStock");

        if (!prepBatch) {
            return res.status(404).json({ message: "Prep batch not found" });
        }

        res.status(200).json(prepBatch);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch prep batch",
            error: error.message,
        });
    }
};

const createPrepBatch = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const { inputs, outputStockItem, outputQuantity } = req.body;

        if (!inputs || inputs.length === 0) {
            await session.abortTransaction();

            return res.status(400).json({
                message: "Prep batch must include at least one input item.",
            });
        }

        const inputStockItemsById = new Map();

        // 1. Validate all input stock first
        for (const input of inputs) {
            const stockItem = await StockItem.findById(input.stockItem).session(
                session
            );

            if (!stockItem || !stockItem.isActive) {
                await session.abortTransaction();

                return res.status(404).json({
                    message: "Input stock item not found or inactive",
                    stockItem: input.stockItem,
                });
            }

            inputStockItemsById.set(String(stockItem._id), stockItem);
        }

        const outputItem = await StockItem.findById(outputStockItem).session(
            session
        );

        if (!outputItem || !outputItem.isActive) {
            await session.abortTransaction();

            return res.status(404).json({
                message: "Output stock item not found or inactive",
                stockItem: outputStockItem,
            });
        }

        // 2. Save prep batch
        const createdPrepBatches = await PrepBatch.create([req.body], {
            session,
        });

        const prepBatch = createdPrepBatches[0];

        const movementRecords = [];

        // 3. Deduct input stock and create prep_input movements
        for (const input of prepBatch.inputs) {
            const stockItem = inputStockItemsById.get(String(input.stockItem));

            const previousStock = stockItem.currentStock;
            const newStock = roundStock(previousStock - input.quantityUsed);

            stockItem.currentStock = newStock;
            await stockItem.save({ session });

            const createdMovements = await InventoryMovement.create(
                [
                    {
                        stockItem: stockItem._id,
                        movementType: "prep_input",
                        quantityChange: roundStock(-input.quantityUsed),
                        unit: input.unit,
                        previousStock,
                        newStock,
                        sourceType: "PrepBatch",
                        sourceId: prepBatch._id,
                        performedBy: prepBatch.preparedBy || null,
                        notes: "Stock used as prep input",
                    },
                ],
                { session }
            );

            movementRecords.push(createdMovements[0]);
        }

        // 4. Increase output stock and create prep_output movement
        const previousOutputStock = outputItem.currentStock;
        const roundedOutputQuantity = roundStock(outputQuantity);
        const newOutputStock = roundStock(previousOutputStock + roundedOutputQuantity);

        outputItem.currentStock = newOutputStock;
        await outputItem.save({ session });

        const createdOutputMovements = await InventoryMovement.create(
            [
                {
                    stockItem: outputItem._id,
                    movementType: "prep_output",
                    quantityChange: roundedOutputQuantity,
                    unit: req.body.outputUnit,
                    previousStock: previousOutputStock,
                    newStock: newOutputStock,
                    sourceType: "PrepBatch",
                    sourceId: prepBatch._id,
                    performedBy: prepBatch.preparedBy || null,
                    notes: "Prepared stock output created",
                },
            ],
            { session }
        );

        movementRecords.push(createdOutputMovements[0]);

        await session.commitTransaction();

        const populatedPrepBatch = await PrepBatch.findById(prepBatch._id)
            .populate("outputStockItem", "name stockUnit currentStock")
            .populate("inputs.stockItem", "name stockUnit currentStock");

        res.status(201).json({
            prepBatch: populatedPrepBatch,
            movementsCreated: movementRecords,
        });
    } catch (error) {
        await session.abortTransaction();

        res.status(400).json({
            message: "Failed to create prep batch",
            error: error.message,
        });
    } finally {
        session.endSession();
    }
};

module.exports = {
    getPrepBatches,
    getPrepBatchById,
    createPrepBatch,
};