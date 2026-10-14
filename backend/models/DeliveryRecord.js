const mongoose = require("mongoose");

const deliveryItemSchema = new mongoose.Schema(
    {
        stockItem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "StockItem",
            required: true,
        },

        quantityExpected: {
            type: Number,
            default: null,
            min: 0,
        },

        quantityReceived: {
            type: Number,
            required: true,
            min: 0,
        },

        quantityAccepted: {
            type: Number,
            required: true,
            min: 0,
        },

        unit: {
            type: String,
            required: true,
        },

        batchNumber: {
            type: String,
            trim: true,
            default: "",
        },

        // What you paid per stock unit (e.g. per case), excluding VAT.
        // null means "not entered", which is different from free (0).
        unitCost: {
            type: Number,
            default: null,
            min: 0,
        },

        expiryDate: {
            type: Date,
            default: null,
        },

        issueType: {
            type: String,
            enum: [
                "none",
                "missing",
                "extra",
                "damaged",
                "wrong_item",
                "wrong_quantity",
                "rejected",
            ],
            default: "none",
        },

        issueNotes: {
            type: String,
            trim: true,
            default: "",
        },
    },
    { _id: false }
);

const deliveryRecordSchema = new mongoose.Schema(
    {
        restaurant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true,
        },

        supplier: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Supplier",
            required: true,
        },

        deliveryDate: {
            type: Date,
            required: true,
            default: Date.now,
        },

        receivedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        items: {
            type: [deliveryItemSchema],
            required: true,
            validate: {
                validator: function (items) {
                    return items.length > 0;
                },
                message: "Delivery must include at least one item.",
            },
        },

        invoiceNumber: {
            type: String,
            trim: true,
            default: "",
        },

        notes: {
            type: String,
            trim: true,
            default: "",
        },
    },
    { timestamps: true }
);

deliveryRecordSchema.index({ restaurant: 1, deliveryDate: -1 });

module.exports = mongoose.model("DeliveryRecord", deliveryRecordSchema);