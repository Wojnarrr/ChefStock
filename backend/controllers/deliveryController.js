const mongoose = require("mongoose");
const DeliveryRecord = require("../models/DeliveryRecord");
const StockItem = require("../models/StockItem");
const InventoryMovement = require("../models/InventoryMovement");

const getDeliveries = async (req, res) => {
    try {
        const deliveries = await DeliveryRecord.find({
            restaurant: req.restaurantId,
        })
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
        const delivery = await DeliveryRecord.findOne({
            _id: req.params.id,
            restaurant: req.restaurantId,
        })
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
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const { items } = req.body;

        if (!items || items.length === 0) {
            await session.abortTransaction();

            return res.status(400).json({
                message: "Delivery must include at least one item.",
            });
        }

        const createdDeliveries = await DeliveryRecord.create(
            [{ ...req.body, restaurant: req.restaurantId }],
            { session }
        );

        const delivery = createdDeliveries[0];

        const movementRecords = [];

        for (const item of delivery.items) {
            if (item.quantityAccepted <= 0) {
                continue;
            }

            const stockItem = await StockItem.findOne({
                _id: item.stockItem,
                restaurant: req.restaurantId,
            }).session(session);

            if (!stockItem || !stockItem.isActive) {
                await session.abortTransaction();

                return res.status(404).json({
                    message: "Stock item not found or inactive",
                    stockItem: item.stockItem,
                });
            }

            const previousStock = stockItem.currentStock;
            const newStock = previousStock + item.quantityAccepted;

            stockItem.currentStock = newStock;

            // Remember the latest price, but don't let a back-dated delivery
            // overwrite a newer price.
            const isNewestPrice =
                !stockItem.lastCostDate || delivery.deliveryDate >= stockItem.lastCostDate;

            if (item.unitCost != null && isNewestPrice) {
                stockItem.lastUnitCost = item.unitCost;
                stockItem.lastCostDate = delivery.deliveryDate;
            }

            await stockItem.save({ session });

            const createdMovements = await InventoryMovement.create(
                [
                    {
                        restaurant: req.restaurantId,
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
                    },
                ],
                { session }
            );

            movementRecords.push(createdMovements[0]);
        }

        await session.commitTransaction();

        const populatedDelivery = await DeliveryRecord.findById(delivery._id)
            .populate("supplier", "name deliveryDays notes")
            .populate("items.stockItem", "name stockUnit currentStock");

        res.status(201).json({
            delivery: populatedDelivery,
            movementsCreated: movementRecords,
        });
    } catch (error) {
        await session.abortTransaction();

        res.status(400).json({
            message: "Failed to create delivery",
            error: error.message,
        });
    } finally {
        session.endSession();
    }
};

module.exports = {
    getDeliveries,
    getDeliveryById,
    createDelivery,
};