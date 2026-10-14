const StockItem = require("../models/StockItem");
const mongoose = require("mongoose");
const DeliveryRecord = require("../models/DeliveryRecord");
const Supplier = require("../models/Supplier");

// What a request may set. Anything else (restaurant, lastUnitCost...) is ignored.
const EDITABLE_FIELDS = [
    "name",
    "category",
    "stockType",
    "stockUnit",
    "recipeUnit",
    "unitsPerStockUnit",
    "minStockLevel",
    "reorderQuantity",
    "preferredSupplier",
];

const pickFields = (body, fields) => {
    const data = {};
    for (const field of fields) {
        if (body[field] !== undefined) data[field] = body[field];
    }
    return data;
};

// The preferred supplier must be one of THIS restaurant's suppliers.
const checkSupplier = async (supplierId, restaurantId) => {
    if (!supplierId) return null; // none is fine
    if (!mongoose.isValidObjectId(supplierId)) return "Supplier not found";

    const supplier = await Supplier.findOne({ _id: supplierId, restaurant: restaurantId });
    return supplier ? null : "Supplier not found";
};
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
        // Only when creating can the starting stock be set; after that,
        // stock only changes through deliveries, prep and adjustments.
        const data = pickFields(req.body, [...EDITABLE_FIELDS, "currentStock"]);

        const problem = await checkSupplier(data.preferredSupplier, req.restaurantId);
        if (problem) return res.status(400).json({ message: problem });

        const stockItem = await StockItem.create({ ...data, restaurant: req.restaurantId });
        await stockItem.populate("preferredSupplier", "name deliveryDays notes");

        res.status(201).json(addStockStatus(stockItem));
    } catch (error) {
        res.status(400).json({
            message: "Failed to create stock item",
            error: error.message,
        });
    }
};

const updateStockItem = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ message: "Stock item not found" });
        }

        const data = pickFields(req.body, EDITABLE_FIELDS);

        const problem = await checkSupplier(data.preferredSupplier, req.restaurantId);
        if (problem) return res.status(400).json({ message: problem });

        // Load, change, save, so the model's pre("validate") check runs
        // (findOneAndUpdate would skip it).
        const stockItem = await StockItem.findOne({
            _id: req.params.id,
            restaurant: req.restaurantId,
            isActive: true,
        });

        if (!stockItem) {
            return res.status(404).json({ message: "Stock item not found" });
        }

        Object.assign(stockItem, data);
        await stockItem.save();
        await stockItem.populate("preferredSupplier", "name deliveryDays notes");

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
// GET /api/stock-items/:id/price-history
// Every price paid for this item, oldest first, taken from the deliveries.
const getPriceHistory = async (req, res) => {
    try {
        const stockItemId = req.params.id;

        if (!mongoose.isValidObjectId(stockItemId)) {
            return res.status(404).json({ message: "Stock item not found" });
        }

        // "items.stockItem" searches inside the items array of each delivery.
        const deliveries = await DeliveryRecord.find({
            restaurant: req.restaurantId,
            "items.stockItem": stockItemId,
        })
            .populate("supplier", "name")
            .sort({ deliveryDate: 1 });

        const history = [];

        for (const delivery of deliveries) {
            for (const item of delivery.items) {
                // A delivery can contain many items; only keep this one,
                // and only where a price was actually entered.
                if (item.stockItem.equals(stockItemId) && item.unitCost != null) {
                    history.push({
                        date: delivery.deliveryDate,
                        unitCost: item.unitCost,
                        unit: item.unit,
                        supplier: delivery.supplier?.name || "Unknown supplier",
                        deliveryId: delivery._id,
                    });
                }
            }
        }

        res.status(200).json(history);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch price history", error: error.message });
    }
};
module.exports = {
    getStockItems,
    getStockItemById,
    createStockItem,
    updateStockItem,
    deleteStockItem,
    getLowStockItems,
    getPriceHistory,
};