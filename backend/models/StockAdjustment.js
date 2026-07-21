const mongoose = require("mongoose");

const stockAdjustmentSchema = new mongoose.Schema(
    {
        stockItem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "StockItem",
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

        quantityChange: {
            type: Number,
            required: true,
        },

        unit: {
            type: String,
            required: true,
        },

        reason: {
            type: String,
            required: true,
            enum: [
                "stock_count_correction",
                "waste",
                "staff_food",
                "damaged",
                "expired",
                "missing",
                "other",
            ],
        },

        adjustedBy: {
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

module.exports = mongoose.model("StockAdjustment", stockAdjustmentSchema);