const jwt = require("jsonwebtoken");
const User = require("../models/User");
const RestaurantMembership = require("../models/RestaurantMembership");

const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Not authorized, no token provided" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId);

        if (!user || !user.isActive) {
            return res.status(401).json({ message: "Not authorized, user not found" });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: "Not authorized, invalid token" });
    }
};

const attachRestaurantContext = async (req, res, next) => {
    try {
        const restaurantId = req.headers["x-restaurant-id"];

        if (!restaurantId) {
            return res.status(400).json({ message: "No restaurant selected" });
        }

        const membership = await RestaurantMembership.findOne({
            user: req.user._id,
            restaurant: restaurantId,
        });

        if (!membership) {
            return res.status(403).json({ message: "You do not have access to this restaurant" });
        }

        req.restaurantId = restaurantId;
        req.role = membership.role;
        next();
    } catch (error) {
        res.status(500).json({ message: "Failed to verify restaurant access", error: error.message });
    }
};

module.exports = { protect, attachRestaurantContext };