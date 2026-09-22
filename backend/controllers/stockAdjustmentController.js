const StockAdjustment = require("../models/StockAdjustment");
const StockItem = require("../models/StockItem");
const InventoryMovement = require("../models/InventoryMovement");
const mongoose = require("mongoose");
const roundStock = require("../utils/roundStock");

const getStockAdjustments = async (req, res) => {
    try {
        const adjustments = await StockAdjustment.find({
            restaurant: req.restaurantId,
        })
            .populate("stockItem", "name stockUnit currentStock category")
            .sort({ createdAt: -1 });

        res.status(200).json(adjustments);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch stock adjustments",
            error: error.message,
        });
    }
};

const createStockAdjustment = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const { stockItem: stockItemId, newStock, reason, notes } = req.body;

        const stockItem = await StockItem.findOne({
            _id: stockItemId,
            restaurant: req.restaurantId,
        }).session(session);

        if (!stockItem || !stockItem.isActive) {
            await session.abortTransaction();

            return res.status(404).json({
                message: "Stock item not found or inactive",
            });
        }

        const previousStock = stockItem.currentStock;
        const roundedNewStock = roundStock(newStock);
        const quantityChange = roundStock(roundedNewStock - previousStock);

        const createdAdjustments = await StockAdjustment.create(
            [
                {
                    restaurant: req.restaurantId,
                    stockItem: stockItem._id,
                    previousStock,
                    newStock: roundedNewStock,
                    quantityChange,
                    unit: stockItem.stockUnit,
                    reason,
                    adjustedBy: req.body.adjustedBy || null,
                    notes: notes || "",
                },
            ],
            { session }
        );

        const adjustment = createdAdjustments[0];

        stockItem.currentStock = roundedNewStock;
        await stockItem.save({ session });

        const createdMovements = await InventoryMovement.create(
            [
                {
                    restaurant: req.restaurantId,
                    stockItem: stockItem._id,
                    movementType: "manual_adjustment",
                    quantityChange,
                    unit: stockItem.stockUnit,
                    previousStock,
                    newStock: roundedNewStock,
                    sourceType: "StockAdjustment",
                    sourceId: adjustment._id,
                    performedBy: adjustment.adjustedBy || null,
                    notes: `Stock adjustment: ${reason}${notes ? ` - ${notes}` : ""}`,
                },
            ],
            { session }
        );

        const movement = createdMovements[0];

        await session.commitTransaction();

        const populatedAdjustment = await StockAdjustment.findById(adjustment._id)
            .populate("stockItem", "name stockUnit currentStock category");

        res.status(201).json({
            adjustment: populatedAdjustment,
            movementCreated: movement,
        });
    } catch (error) {
        await session.abortTransaction();

        res.status(400).json({
            message: "Failed to create stock adjustment",
            error: error.message,
        });
    } finally {
        session.endSession();
    }
};

module.exports = {
    getStockAdjustments,
    createStockAdjustment,
};