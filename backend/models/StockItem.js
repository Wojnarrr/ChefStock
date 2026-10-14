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
        restaurant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true,
        },

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
        // Copy of the most recent delivery price, so costing a recipe doesn't
        // have to search through every delivery. Updated when a delivery is saved.
        lastUnitCost: {
            type: Number,
            default: null,
            min: 0,
        },

        lastCostDate: {
            type: Date,
            default: null,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

// If recipes use a different unit from the one you count in (g vs case),
// stock deduction and costing need to know how many recipe units are in one
// stock unit. Without it they fail later with "can't convert", so ask now.
stockItemSchema.pre("validate", function () {
    const needsConversion = this.stockUnit !== this.recipeUnit;
    // estimatedUnitsPerStockUnit is the old field; still accepted for existing items.
    const hasConversion = this.unitsPerStockUnit > 0 || this.estimatedUnitsPerStockUnit > 0;

    if (needsConversion && !hasConversion) {
        this.invalidate(
            "unitsPerStockUnit",
            `How many ${this.recipeUnit} are in one ${this.stockUnit}? This is needed to convert between them.`
        );
    }
});
stockItemSchema.index({ restaurant: 1, isActive: 1 });

module.exports = mongoose.model("StockItem", stockItemSchema);