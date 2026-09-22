const mongoose = require("mongoose");

const restaurantMembershipSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        restaurant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true,
        },

        role: {
            type: String,
            required: true,
            enum: ["owner", "staff"],
        },
    },
    { timestamps: true }
);

// A user can't have two memberships at the same restaurant.
restaurantMembershipSchema.index({ user: 1, restaurant: 1 }, { unique: true });

module.exports = mongoose.model("RestaurantMembership", restaurantMembershipSchema);