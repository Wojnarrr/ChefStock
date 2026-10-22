const mongoose = require("mongoose");

// One line of a Flipdish order. We copy only what stock and sales analysis
// need: no customer name, phone or address (GDPR: don't store what you don't use).
const saleLineSchema = new mongoose.Schema(
    {
        // How this line is matched to a ChefStock menu item: the Flipdish item id,
        // plus the size option id if the item has sizes (e.g. "4521:9932").
        flipdishKey: { type: String, required: true },
        name: { type: String, required: true }, // e.g. "Margherita - Half tray"
        price: { type: Number, required: true, min: 0 }, // incl. VAT, incl. options
        menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", default: null }, // null = not matched yet
    },
    { _id: false }
);

const saleSchema = new mongoose.Schema(
    {
        restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
        source: { type: String, enum: ["flipdish"], default: "flipdish" },
        externalOrderId: { type: String, required: true }, // Flipdish OrderId
        placedAt: { type: Date, required: true },
        orderState: { type: String, required: true }, // Flipdish's OrderState, as-is
        // Did the customer actually get (and pay for) this order?
        counts: { type: Boolean, required: true },
        amount: { type: Number, default: 0 }, // total incl. VAT, delivery, tips
        totalTax: { type: Number, default: 0 },
        lines: { type: [saleLineSchema], default: [] },
    },
    { timestamps: true }
);

// The same order can be imported many times (every sync overlaps a little).
// This index makes that safe: one Sale per Flipdish order per restaurant.
saleSchema.index({ restaurant: 1, source: 1, externalOrderId: 1 }, { unique: true });
saleSchema.index({ restaurant: 1, placedAt: -1 });

module.exports = mongoose.model("Sale", saleSchema);
