const StockItem = require("../models/StockItem");
const InventoryMovement = require("../models/InventoryMovement");
const DeliveryRecord = require("../models/DeliveryRecord");
const PrepBatch = require("../models/PrepBatch");
const ProductionBatch = require("../models/ProductionBatch");
const StockAdjustment = require("../models/StockAdjustment");

const getDashboardSummary = async (req, res) => {
    try {
        const totalActiveStockItems = await StockItem.countDocuments({
            isActive: true,
        });

        const lowStockItems = await StockItem.find({
            isActive: true,
            $expr: { $lte: ["$currentStock", "$minStockLevel"] },
        })
            .populate("preferredSupplier", "name deliveryDays notes")
            .sort({ currentStock: 1 });

        const negativeStockItems = await StockItem.find({
            isActive: true,
            currentStock: { $lt: 0 },
        }).sort({ currentStock: 1 });

        const recentMovements = await InventoryMovement.find()
            .populate("stockItem", "name stockUnit category")
            .sort({ createdAt: -1 })
            .limit(10);

        const recentDeliveries = await DeliveryRecord.find()
            .populate("supplier", "name")
            .populate("items.stockItem", "name stockUnit")
            .sort({ createdAt: -1 })
            .limit(5);

        const recentPrepBatches = await PrepBatch.find()
            .populate("outputStockItem", "name stockUnit")
            .populate("inputs.stockItem", "name stockUnit")
            .sort({ createdAt: -1 })
            .limit(5);

        const recentProductionBatches = await ProductionBatch.find()
            .populate("itemsProduced.recipe", "name outputUnit")
            .sort({ createdAt: -1 })
            .limit(5);

        const recentStockAdjustments = await StockAdjustment.find()
            .populate("stockItem", "name stockUnit category")
            .sort({ createdAt: -1 })
            .limit(5);

        res.status(200).json({
            counts: {
                totalActiveStockItems,
                lowStockItemsCount: lowStockItems.length,
                negativeStockItemsCount: negativeStockItems.length,
                recentMovementsCount: recentMovements.length,
            },
            lowStockItems,
            negativeStockItems,
            recentMovements,
            recentDeliveries,
            recentPrepBatches,
            recentProductionBatches,
            recentStockAdjustments,
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch dashboard summary",
            error: error.message,
        });
    }
};

module.exports = {
    getDashboardSummary,
};