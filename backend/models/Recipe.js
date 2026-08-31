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

        recipeType: {
            type: String,
            required: true,
            enum: ["production", "prep"],
            default: "production",
        },

        outputStockItem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "StockItem",
            default: null,
        },

        outputQuantity: {
            type: Number,
            default: null,
            min: 0,
        },

        outputUnit: {
            type: String,
            required: true,
            enum: [
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
                "pizza",
                "tray",
                "portion",
                "batch",
            ],
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

recipeSchema.pre("validate", function () {
    if (this.recipeType === "prep") {
        if (!this.outputStockItem) {
            this.invalidate(
                "outputStockItem",
                "Prep recipes must have an output stock item."
            );
        }

        if (!this.outputQuantity) {
            this.invalidate(
                "outputQuantity",
                "Prep recipes must have an output quantity."
            );
        }
    }
});

module.exports = mongoose.model("Recipe", recipeSchema);