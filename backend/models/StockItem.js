const mongoose = require("mongoose");

const validUnits = [
    "g",
    "kg",
    "ml",
    "l",
    "pcs",
    "pack",
    "box",
    "case",
    "bottle",
    "can",
    "container",
];

const stockItemSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Stock item name is required"],
            trim: true,
            maxlength: [100, "Stock item name cannot exceed 100 characters"],
        },

        category: {
            type: String,
            required: [true, "Category is required"],
            enum: ["ingredient", "drink", "packaging", "other"],
        },

        stockType: {
            type: String,
            required: [true, "Stock type is required"],
            enum: ["raw", "prepared", "finished_product", "non_edible"],
        },

        stockUnit: {
            type: String,
            required: [true, "Stock unit is required"],
            enum: validUnits,
        },

        recipeUnit: {
            type: String,
            required: [true, "Recipe unit is required"],
            enum: validUnits,
        },

        packType: {
            type: String,
            enum: ["none", "fixed", "variable"],
            default: "none",
        },

        unitsPerStockUnit: {
            type: Number,
            default: null,
            min: [0, "Units per stock unit cannot be negative"],
        },

        estimatedUnitsPerStockUnit: {
            type: Number,
            default: null,
            min: [0, "Estimated units per stock unit cannot be negative"],
        },

        currentStock: {
            type: Number,
            required: [true, "Current stock is required"],
            default: 0,
            min: [0, "Current stock cannot be negative"],
        },

        minStockLevel: {
            type: Number,
            required: [true, "Minimum stock level is required"],
            default: 0,
            min: [0, "Minimum stock level cannot be negative"],
        },

        reorderQuantity: {
            type: Number,
            required: [true, "Reorder quantity is required"],
            default: 0,
            min: [0, "Reorder quantity cannot be negative"],
        },

        preferredSupplier: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Supplier",
            default: null,
        },

        requiresExpiryTracking: {
            type: Boolean,
            default: false,
        },

        requiresBatchTracking: {
            type: Boolean,
            default: false,
        },

        trackingPriority: {
            type: String,
            enum: ["high", "medium", "low"],
            default: "medium",
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

stockItemSchema.pre("validate", function () {
    if (this.packType === "fixed" && !this.unitsPerStockUnit) {
        this.invalidate(
            "unitsPerStockUnit",
            "Fixed pack items must have unitsPerStockUnit."
        );
    }

    if (this.packType === "variable" && !this.estimatedUnitsPerStockUnit) {
        this.invalidate(
            "estimatedUnitsPerStockUnit",
            "Variable pack items should have estimatedUnitsPerStockUnit."
        );
    }
});

module.exports = mongoose.model("StockItem", stockItemSchema);