const StockAdjustment = require("../models/StockAdjustment");
const StockItem = require("../models/StockItem");
const InventoryMovement = require("../models/InventoryMovement");
const roundStock = require("../utils/roundStock");

const getStockAdjustments = async (req, res) => {
    try {
        const adjustments = await StockAdjustment.find()
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
    try {
        const { stockItem: stockItemId, newStock, reason, notes } = req.body;

        const stockItem = await StockItem.findById(stockItemId);

        if (!stockItem || !stockItem.isActive) {
            return res.status(404).json({
                message: "Stock item not found or inactive",
            });
        }

        const previousStock = stockItem.currentStock;
        const roundedNewStock = roundStock(newStock);
        const quantityChange = roundStock(roundedNewStock - previousStock);

        const adjustment = await StockAdjustment.create({
            stockItem: stockItem._id,
            previousStock,
            newStock: roundedNewStock,
            quantityChange,
            unit: stockItem.stockUnit,
            reason,
            adjustedBy: req.body.adjustedBy || null,
            notes: notes || "",
        });

        stockItem.currentStock = roundedNewStock;
        await stockItem.save();

        const movement = await InventoryMovement.create({
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
        });

        const populatedAdjustment = await StockAdjustment.findById(adjustment._id)
            .populate("stockItem", "name stockUnit currentStock category");

        res.status(201).json({
            adjustment: populatedAdjustment,
            movementCreated: movement,
        });
    } catch (error) {
        res.status(400).json({
            message: "Failed to create stock adjustment",
            error: error.message,
        });
    }
};

module.exports = {
    getStockAdjustments,
    createStockAdjustment,
};