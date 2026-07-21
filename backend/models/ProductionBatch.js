const mongoose = require("mongoose");

const productionItemSchema = new mongoose.Schema(
    {
        recipe: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Recipe",
            required: true,
        },

        quantityProduced: {
            type: Number,
            required: true,
            min: 0,
        },

        outputUnit: {
            type: String,
            required: true,
        },
    },
    { _id: false }
);

const productionBatchSchema = new mongoose.Schema(
    {
        productionDate: {
            type: Date,
            required: true,
            default: Date.now,
        },

        producedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        itemsProduced: {
            type: [productionItemSchema],
            required: true,
            validate: {
                validator: function (items) {
                    return items.length > 0;
                },
                message: "Production batch must include at least one produced item.",
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

module.exports = mongoose.model("ProductionBatch", productionBatchSchema);