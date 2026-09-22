const StockItem = require("../models/StockItem");

const addStockStatus = (stockItem) => {
    const item = stockItem.toObject ? stockItem.toObject() : stockItem;

    if (item.currentStock < 0) {
        item.stockStatus = "negative";
    } else if (item.currentStock <= item.minStockLevel) {
        item.stockStatus = "low";
    } else {
        item.stockStatus = "ok";
    }

    return item;
};

const getStockItems = async (req, res) => {
    try {
        const stockItems = await StockItem.find({
            isActive: true,
            restaurant: req.restaurantId,
        })
            .populate("preferredSupplier", "name deliveryDays notes")
            .sort({ name: 1 });

        res.status(200).json(stockItems.map(addStockStatus));
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch stock items",
            error: error.message,
        });
    }
};

const getStockItemById = async (req, res) => {
    try {
        const stockItem = await StockItem.findOne({
            _id: req.params.id,
            restaurant: req.restaurantId,
        }).populate("preferredSupplier", "name deliveryDays notes");

        if (!stockItem || !stockItem.isActive) {
            return res.status(404).json({ message: "Stock item not found" });
        }

        res.status(200).json(addStockStatus(stockItem));
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch stock item",
            error: error.message,
        });
    }
};

const createStockItem = async (req, res) => {
    try {
        const stockItem = await StockItem.create({
            ...req.body,
            restaurant: req.restaurantId,
        });

        const populatedStockItem = await StockItem.findById(stockItem._id).populate(
            "preferredSupplier",
            "name deliveryDays notes"
        );

        res.status(201).json(addStockStatus(populatedStockItem));
    } catch (error) {
        res.status(400).json({
            message: "Failed to create stock item",
            error: error.message,
        });
    }
};

const updateStockItem = async (req, res) => {
    try {
        const { restaurant, ...updates } = req.body;

        const stockItem = await StockItem.findOneAndUpdate(
            { _id: req.params.id, restaurant: req.restaurantId },
            updates,
            {
                new: true,
                runValidators: true,
            }
        ).populate("preferredSupplier", "name deliveryDays notes");

        if (!stockItem || !stockItem.isActive) {
            return res.status(404).json({ message: "Stock item not found" });
        }

        res.status(200).json(addStockStatus(stockItem));
    } catch (error) {
        res.status(400).json({
            message: "Failed to update stock item",
            error: error.message,
        });
    }
};

const deleteStockItem = async (req, res) => {
    try {
        const stockItem = await StockItem.findOneAndUpdate(
            { _id: req.params.id, restaurant: req.restaurantId },
            { isActive: false },
            { new: true }
        );

        if (!stockItem) {
            return res.status(404).json({ message: "Stock item not found" });
        }

        res.status(200).json({ message: "Stock item deactivated successfully" });
    } catch (error) {
        res.status(500).json({
            message: "Failed to deactivate stock item",
            error: error.message,
        });
    }
};

const getLowStockItems = async (req, res) => {
    try {
        const stockItems = await StockItem.find({
            isActive: true,
            restaurant: req.restaurantId,
            $expr: { $lte: ["$currentStock", "$minStockLevel"] },
        })
            .populate("preferredSupplier", "name deliveryDays notes")
            .sort({ name: 1 });

        const grouped = stockItems.reduce((acc, item) => {
            const supplierName = item.preferredSupplier
                ? item.preferredSupplier.name
                : "No supplier assigned";

            if (!acc[supplierName]) {
                acc[supplierName] = {
                    supplier: item.preferredSupplier || null,
                    items: [],
                };
            }

            acc[supplierName].items.push(addStockStatus(item));
            return acc;
        }, {});

        res.status(200).json(Object.values(grouped));
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch low stock items",
            error: error.message,
        });
    }
};

module.exports = {
    getStockItems,
    getStockItemById,
    createStockItem,
    updateStockItem,
    deleteStockItem,
    getLowStockItems,
};