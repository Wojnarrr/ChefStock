const mongoose = require("mongoose");

const inventoryMovementSchema = new mongoose.Schema(
    {
        stockItem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "StockItem",
            required: true,
        },

        movementType: {
            type: String,
            required: true,
            enum: [
                "delivery",
                "prep_input",
                "prep_output",
                "production_usage",
                "manual_adjustment",
            ],
        },

        quantityChange: {
            type: Number,
            required: true,
        },

        unit: {
            type: String,
            required: true,
        },

        previousStock: {
            type: Number,
            required: true,
        },

        newStock: {
            type: Number,
            required: true,
        },

        sourceType: {
            type: String,
            required: true,
            enum: [
                "DeliveryRecord",
                "PrepBatch",
                "ProductionBatch",
                "StockAdjustment",
            ],
        },

        sourceId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },

        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        notes: {
            type: String,
            trim: true,
            default: "",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("InventoryMovement", inventoryMovementSchema);