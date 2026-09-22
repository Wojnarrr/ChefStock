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

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Restaurant", restaurantSchema);