const mongoose = require("mongoose");

const prepInputSchema = new mongoose.Schema(
    {
        stockItem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "StockItem",
            required: true,
        },

        quantityUsed: {
            type: Number,
            required: true,
            min: 0,
        },

        unit: {
            type: String,
            required: true,
        },

        isEstimated: {
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

const prepBatchSchema = new mongoose.Schema(
    {
        restaurant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true,
        },
        prepDate: {
            type: Date,
            required: true,
            default: Date.now,
        },

        preparedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        prepType: {
            type: String,
            enum: ["manual", "recipe_based"],
            default: "manual",
        },

        outputStockItem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "StockItem",
            required: true,
        },

        outputQuantity: {
            type: Number,
            required: true,
            min: 0,
        },

        outputUnit: {
            type: String,
            required: true,
        },

        inputs: {
            type: [prepInputSchema],
            required: true,
            validate: {
                validator: function (inputs) {
                    return inputs.length > 0;
                },
                message: "Prep batch must include at least one input item.",
            },
        },

        notes: {
            type: String,
            trim: true,
            default: "",
        },
    },
    { timestamps: true }
);

prepBatchSchema.index({ restaurant: 1, isActive: 1 });
module.exports = mongoose.model("PrepBatch", prepBatchSchema);