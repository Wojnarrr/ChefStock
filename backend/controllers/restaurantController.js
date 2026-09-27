const Restaurant = require("../models/Restaurant");
const RestaurantMembership = require("../models/RestaurantMembership");
const { getMembershipsForUser } = require("./authController");

// PUT /api/restaurants/current   body: { name, address }
const updateCurrentRestaurant = async (req, res) => {
    try {
        const { name, address } = req.body;

        const restaurant = await Restaurant.findByIdAndUpdate(
            req.restaurantId,
            { name, address },
            { new: true, runValidators: true } // return the updated doc, and check name length etc.
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

module.exports = {
    updateCurrentRestaurant,
    regenerateJoinCode,
    createRestaurant,
    joinRestaurant,
};