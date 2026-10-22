const mongoose = require("mongoose");
const crypto = require("crypto");

const generateJoinCode = () => {
    const randomPart = crypto.randomBytes(3).toString("hex").toUpperCase();
    return `REST-${randomPart}`;
};

const restaurantSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Restaurant name is required"],
            trim: true,
            maxlength: [100, "Restaurant name cannot exceed 100 characters"],
        },

        address: {
            type: String,
            trim: true,
            default: "",
        },

        joinCode: {
            type: String,
            required: true,
            unique: true,
            default: generateJoinCode,
        },
        // VAT included in menu prices, as a percentage (e.g. 13.5).
        // null = not set yet; food cost % then uses the price including VAT.
        vatRate: {
            type: Number,
            default: null,
            min: [0, "VAT rate can't be negative"],
            max: [100, "VAT rate can't be over 100%"],
        },

        targetFoodCostPercent: {
            type: Number,
            default: 30,
            min: [1, "Target must be at least 1%"],
            max: [100, "Target can't be over 100%"],
        },
        // The Flipdish store this restaurant's sales come from
        // (Flipdish's StoreId, called physicalRestaurantId in the orders API).
        flipdishStoreId: {
            type: Number,
            default: null,
        },

        // When orders were last pulled, so the next sync only asks for new ones.
        flipdishLastSyncAt: {
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
restaurantSchema.statics.generateJoinCode = generateJoinCode;
module.exports = mongoose.model("Restaurant", restaurantSchema);