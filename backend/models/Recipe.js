const mongoose = require("mongoose");

const recipeIngredientSchema = new mongoose.Schema(
    {
        stockItem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "StockItem",
            required: true,
        },

        quantity: {
            type: Number,
            required: true,
            min: 0,
        },

        unit: {
            type: String,
            required: true,
        },

        minQuantity: {
            type: Number,
            default: null,
            min: 0,
        },

        maxQuantity: {
            type: Number,
            default: null,
            min: 0,
        },

        isOptional: {
            type: Boolean,
            default: false,
        },

        notes: {
            type: String,
            trim: true,
            default: "",
        },
    },
    { _id: false }
);

const recipeSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Recipe name is required"],
            trim: true,
            maxlength: [100, "Recipe name cannot exceed 100 characters"],
        },

        outputUnit: {
            type: String,
            required: true,
            enum: ["pizza", "tray", "portion", "batch", "pcs"],
        },

        portionsPerOutput: {
            type: Number,
            default: null,
            min: 0,
        },

        ingredients: {
            type: [recipeIngredientSchema],
            required: true,
            validate: {
                validator: function (ingredients) {
                    return ingredients.length > 0;
                },
                message: "Recipe must include at least one ingredient.",
            },
        },

        notes: {
            type: String,
            trim: true,
            default: "",
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Recipe", recipeSchema);