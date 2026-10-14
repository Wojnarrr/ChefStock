const mongoose = require("mongoose");

// Something extra that goes out with the item but isn't in the recipe,
// e.g. a box or a dip. Quantity is in the stock item's recipe unit.
const menuItemExtraSchema = new mongoose.Schema(
    {
        stockItem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "StockItem",
            required: true,
        },

        quantity: {
            type: Number,
            required: true,
            min: [0, "Quantity can't be negative"],
        },
    },
    { _id: false }
);

const menuItemSchema = new mongoose.Schema(
    {
        restaurant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true,
        },

        name: {
            type: String,
            required: [true, "Menu item name is required"],
            trim: true,
            maxlength: [100, "Name cannot exceed 100 characters"],
        },

        category: {
            type: String,
            trim: true,
            default: "",
        },
        // OPTIONAL: the production recipe it's cut from, e.g. "Margherita tray"
        // or "Tiramisu tray". Drinks and dips don't need one.
        recipe: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Recipe",
            default: null,
        },

        // How many portions of that recipe are sold: 1 = a slice,
        // 4 = half tray, 8 = full tray. Ignored when there's no recipe.
        portions: {
            type: Number,
            required: true,
            default: 1,
            min: [0.01, "Portions must be more than 0"],
        },

        extras: {
            type: [menuItemExtraSchema],
            default: [],
        },

        // The price on the menu, INCLUDING VAT.
        sellPrice: {
            type: Number,
            required: [true, "Sell price is required"],
            min: [0, "Price can't be negative"],
        },
        // Optional VAT rate just for this item (e.g. drinks are often taxed at
        // a different rate from food). null = use the restaurant's rate.
        vatRate: {
            type: Number,
            default: null,
            min: [0, "VAT rate can't be negative"],
            max: [100, "VAT rate can't be over 100%"],
        },
        // For matching Flipdish sales to this item later.
        flipdishItemId: {
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

menuItemSchema.index({ restaurant: 1, isActive: 1 });

module.exports = mongoose.model("MenuItem", menuItemSchema);