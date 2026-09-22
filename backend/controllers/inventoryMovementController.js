const InventoryMovement = require("../models/InventoryMovement");

const getInventoryMovements = async (req, res) => {
    try {
        const filter = { restaurant: req.restaurantId };

        if (req.query.stockItem) {
            filter.stockItem = req.query.stockItem;
        }

        if (req.query.movementType) {
            filter.movementType = req.query.movementType;
        }

        const limit = Number(req.query.limit) || 50;

        const movements = await InventoryMovement.find(filter)
            .populate("stockItem", "name stockUnit category currentStock")
            .sort({ createdAt: -1 })
            .limit(limit);

        res.status(200).json({
            count: movements.length,
            filters: {
                stockItem: req.query.stockItem || null,
                movementType: req.query.movementType || null,
                limit,
            },
            movements,
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch inventory movements",
            error: error.message,
        });
    }
};

module.exports = {
    getInventoryMovements,
};