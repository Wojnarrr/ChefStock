const PrepBatch = require("../models/PrepBatch");
const StockItem = require("../models/StockItem");
const InventoryMovement = require("../models/InventoryMovement");

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
    try {
        const { inputs, outputStockItem, outputQuantity } = req.body;

        if (!inputs || inputs.length === 0) {
            return res.status(400).json({
                message: "Prep batch must include at least one input item.",
            });
        }

        const movementRecords = [];

        // 1. Check all input stock first before changing anything
        for (const input of inputs) {
            const stockItem = await StockItem.findById(input.stockItem);

            if (!stockItem || !stockItem.isActive) {
                return res.status(404).json({
                    message: "Input stock item not found or inactive",
                    stockItem: input.stockItem,
                });
            }

            if (stockItem.currentStock < input.quantityUsed) {
                return res.status(400).json({
                    message: `Not enough stock for ${stockItem.name}`,
                    currentStock: stockItem.currentStock,
                    requestedQuantity: input.quantityUsed,
                    unit: stockItem.stockUnit,
                });
            }
        }

        const outputItem = await StockItem.findById(outputStockItem);

        if (!outputItem || !outputItem.isActive) {
            return res.status(404).json({
                message: "Output stock item not found or inactive",
                stockItem: outputStockItem,
            });
        }

        // 2. Save prep batch
        const prepBatch = await PrepBatch.create(req.body);

        // 3. Deduct input stock and create prep_input movements
        for (const input of prepBatch.inputs) {
            const stockItem = await StockItem.findById(input.stockItem);

            const previousStock = stockItem.currentStock;
            const newStock = previousStock - input.quantityUsed;

            stockItem.currentStock = newStock;
            await stockItem.save();

            const movement = await InventoryMovement.create({
                stockItem: stockItem._id,
                movementType: "prep_input",
                quantityChange: -input.quantityUsed,
                unit: input.unit,
                previousStock,
                newStock,
                sourceType: "PrepBatch",
                sourceId: prepBatch._id,
                performedBy: prepBatch.preparedBy || null,
                notes: "Stock used as prep input",
            });

            movementRecords.push(movement);
        }

        // 4. Increase output stock and create prep_output movement
        const previousOutputStock = outputItem.currentStock;
        const newOutputStock = previousOutputStock + outputQuantity;

        outputItem.currentStock = newOutputStock;
        await outputItem.save();

        const outputMovement = await InventoryMovement.create({
            stockItem: outputItem._id,
            movementType: "prep_output",
            quantityChange: outputQuantity,
            unit: req.body.outputUnit,
            previousStock: previousOutputStock,
            newStock: newOutputStock,
            sourceType: "PrepBatch",
            sourceId: prepBatch._id,
            performedBy: prepBatch.preparedBy || null,
            notes: "Prepared stock output created",
        });

        movementRecords.push(outputMovement);

        const populatedPrepBatch = await PrepBatch.findById(prepBatch._id)
            .populate("outputStockItem", "name stockUnit currentStock")
            .populate("inputs.stockItem", "name stockUnit currentStock");

        res.status(201).json({
            prepBatch: populatedPrepBatch,
            movementsCreated: movementRecords,
        });
    } catch (error) {
        res.status(400).json({
            message: "Failed to create prep batch",
            error: error.message,
        });
    }
};

module.exports = {
    getPrepBatches,
    getPrepBatchById,
    createPrepBatch,
};