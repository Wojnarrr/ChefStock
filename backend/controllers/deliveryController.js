const DeliveryRecord = require("../models/DeliveryRecord");
const StockItem = require("../models/StockItem");
const InventoryMovement = require("../models/InventoryMovement");

const getDeliveries = async (req, res) => {
    try {
        const deliveries = await DeliveryRecord.find()
            .populate("supplier", "name deliveryDays notes")
            .populate("items.stockItem", "name stockUnit currentStock")
            .sort({ deliveryDate: -1 });

        res.status(200).json(deliveries);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch deliveries",
            error: error.message,
        });
    }
};

const getDeliveryById = async (req, res) => {
    try {
        const delivery = await DeliveryRecord.findById(req.params.id)
            .populate("supplier", "name deliveryDays notes")
            .populate("items.stockItem", "name stockUnit currentStock");

        if (!delivery) {
            return res.status(404).json({ message: "Delivery not found" });
        }

        res.status(200).json(delivery);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch delivery",
            error: error.message,
        });
    }
};

const createDelivery = async (req, res) => {
    try {
        const delivery = await DeliveryRecord.create(req.body);

        const movementRecords = [];

        for (const item of delivery.items) {
            if (item.quantityAccepted <= 0) {
                continue;
            }

            const stockItem = await StockItem.findById(item.stockItem);

            if (!stockItem || !stockItem.isActive) {
                return res.status(404).json({
                    message: "Stock item not found or inactive",
                    stockItem: item.stockItem,
                });
            }

            const previousStock = stockItem.currentStock;
            const newStock = previousStock + item.quantityAccepted;

            stockItem.currentStock = newStock;
            await stockItem.save();

            const movement = await InventoryMovement.create({
                stockItem: stockItem._id,
                movementType: "delivery",
                quantityChange: item.quantityAccepted,
                unit: item.unit,
                previousStock,
                newStock,
                sourceType: "DeliveryRecord",
                sourceId: delivery._id,
                performedBy: delivery.receivedBy || null,
                notes: `Delivery received from supplier`,
            });

            movementRecords.push(movement);
        }

        const populatedDelivery = await DeliveryRecord.findById(delivery._id)
            .populate("supplier", "name deliveryDays notes")
            .populate("items.stockItem", "name stockUnit currentStock");

        res.status(201).json({
            delivery: populatedDelivery,
            movementsCreated: movementRecords,
        });
    } catch (error) {
        res.status(400).json({
            message: "Failed to create delivery",
            error: error.message,
        });
    }
};

module.exports = {
    getDeliveries,
    getDeliveryById,
    createDelivery,
};