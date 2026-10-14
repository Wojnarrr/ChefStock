const Restaurant = require("../models/Restaurant");
const RestaurantMembership = require("../models/RestaurantMembership");
const { getMembershipsForUser } = require("./authController");
const mongoose = require("mongoose");
// PUT /api/restaurants/current   body: { name, address }
const updateCurrentRestaurant = async (req, res) => {
    try {
        // Only copy the fields an owner is allowed to change. Anything else in
        // the request (e.g. joinCode, isActive) is ignored.
        const ALLOWED_FIELDS = ["name", "address", "vatRate", "targetFoodCostPercent"];
        const updates = {};

        for (const field of ALLOWED_FIELDS) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        const restaurant = await Restaurant.findByIdAndUpdate(
            req.restaurantId,
            updates,
            { new: true, runValidators: true }
        );

        res.status(200).json(restaurant);
    } catch (error) {
        res.status(400).json({ message: "Failed to update restaurant", error: error.message });
    }
};

// POST /api/restaurants/current/join-code
const regenerateJoinCode = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.restaurantId);

        restaurant.joinCode = Restaurant.generateJoinCode();
        await restaurant.save();

        res.status(200).json({ joinCode: restaurant.joinCode });
    } catch (error) {
        res.status(500).json({ message: "Failed to generate a new code", error: error.message });
    }
};

// POST /api/restaurants   body: { name, address }
const createRestaurant = async (req, res) => {
    try {
        const { name, address } = req.body;

        const restaurant = await Restaurant.create({ name, address: address || "" });

        await RestaurantMembership.create({
            user: req.user._id,
            restaurant: restaurant._id,
            role: "owner",
        });

        const memberships = await getMembershipsForUser(req.user._id);

        res.status(201).json({ restaurantId: restaurant._id, memberships });
    } catch (error) {
        res.status(400).json({ message: "Failed to create restaurant", error: error.message });
    }
};

// POST /api/restaurants/join   body: { joinCode }
const joinRestaurant = async (req, res) => {
    try {
        const joinCode = (req.body.joinCode || "").trim().toUpperCase();

        const restaurant = await Restaurant.findOne({ joinCode, isActive: true });

        if (!restaurant) {
            return res.status(404).json({ message: "Invalid join code" });
        }

        const alreadyMember = await RestaurantMembership.findOne({
            user: req.user._id,
            restaurant: restaurant._id,
        });

        if (alreadyMember) {
            return res.status(400).json({ message: "You're already a member of this restaurant" });
        }

        await RestaurantMembership.create({
            user: req.user._id,
            restaurant: restaurant._id,
            role: "staff",
        });

        const memberships = await getMembershipsForUser(req.user._id);

        res.status(201).json({ restaurantId: restaurant._id, memberships });
    } catch (error) {
        res.status(400).json({ message: "Failed to join restaurant", error: error.message });
    }
};

// DELETE /api/restaurants/:restaurantId/membership
// Removes YOUR OWN membership of a restaurant ("leave").
const leaveRestaurant = async (req, res) => {
    try {
        const { restaurantId } = req.params;

        if (!mongoose.isValidObjectId(restaurantId)) {
            return res.status(404).json({ message: "You're not a member of this restaurant" });
        }

        // Looking it up by req.user._id is the permission check:
        // you can only ever find (and delete) your own membership.
        const membership = await RestaurantMembership.findOne({
            user: req.user._id,
            restaurant: restaurantId,
        });

        if (!membership) {
            return res.status(404).json({ message: "You're not a member of this restaurant" });
        }

        if (membership.role === "owner") {
            const owners = await RestaurantMembership.countDocuments({
                restaurant: restaurantId,
                role: "owner",
            });

            if (owners <= 1) {
                return res.status(400).json({
                    message: "You're the only owner. Make someone else an owner before leaving.",
                });
            }
        }

        await membership.deleteOne();

        const memberships = await getMembershipsForUser(req.user._id);

        res.status(200).json({ memberships });
    } catch (error) {
        res.status(500).json({ message: "Failed to leave restaurant", error: error.message });
    }
};
module.exports = {
    updateCurrentRestaurant,
    regenerateJoinCode,
    createRestaurant,
    joinRestaurant,
    leaveRestaurant,
};