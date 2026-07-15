const InventoryMovement = require("../models/InventoryMovement");

const getInventoryMovements = async (req, res) => {
    try {
        const movements = await InventoryMovement.find()
            .populate("stockItem", "name stockUnit category")
            .sort({ createdAt: -1 });

        res.status(200).json(movements);
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