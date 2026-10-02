const User = require("../models/User");
const Restaurant = require("../models/Restaurant");
const RestaurantMembership = require("../models/RestaurantMembership");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");

const getMembershipsForUser = async (userId) => {
    const memberships = await RestaurantMembership.find({ user: userId }).populate(
        "restaurant",
        "name address joinCode isActive"
    );

    return memberships.map((membership) => {
        const { _id, name, address, isActive, joinCode } = membership.restaurant;

        return {
            restaurant: {
                _id,
                name,
                address,
                isActive,
                // Only owners should see the invite code.
                ...(membership.role === "owner" && { joinCode }),
            },
            role: membership.role,
        };
    });
};
const registerOwner = async (req, res) => {
    try {
        const { name, email, password, restaurantName, restaurantAddress } = req.body;

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ message: "An account with this email already exists" });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await User.create({ name, email, passwordHash });

        const restaurant = await Restaurant.create({
            name: restaurantName,
            address: restaurantAddress || "",
        });

        await RestaurantMembership.create({
            user: user._id,
            restaurant: restaurant._id,
            role: "owner",
        });

        const memberships = await getMembershipsForUser(user._id);

        res.status(201).json({
            token: generateToken(user._id),
            user: { id: user._id, name: user.name, email: user.email },
            memberships,
        });
    } catch (error) {
        res.status(400).json({
            message: "Failed to register",
            error: error.message,
        });
    }
};

const registerStaff = async (req, res) => {
    try {
        const { name, email, password, joinCode } = req.body;

        const restaurant = await Restaurant.findOne({ joinCode, isActive: true });

        if (!restaurant) {
            return res.status(404).json({ message: "Invalid join code" });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ message: "An account with this email already exists" });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await User.create({ name, email, passwordHash });

        await RestaurantMembership.create({
            user: user._id,
            restaurant: restaurant._id,
            role: "staff",
        });

        const memberships = await getMembershipsForUser(user._id);

        res.status(201).json({
            token: generateToken(user._id),
            user: { id: user._id, name: user.name, email: user.email },
            memberships,
        });
    } catch (error) {
        res.status(400).json({
            message: "Failed to register",
            error: error.message,
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user || !user.isActive) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const passwordMatches = await user.comparePassword(password);

        if (!passwordMatches) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const memberships = await getMembershipsForUser(user._id);

        res.status(200).json({
            token: generateToken(user._id),
            user: { id: user._id, name: user.name, email: user.email },
            memberships,
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to log in",
            error: error.message,
        });
    }
};

const getMe = async (req, res) => {
    try {
        const memberships = await getMembershipsForUser(req.user._id);

        res.status(200).json({
            user: { id: req.user._id, name: req.user.name, email: req.user.email },
            memberships,
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch current user",
            error: error.message,
        });
    }
};
// PUT /api/auth/password   body: { currentPassword, newPassword }
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({ message: "New password must be at least 8 characters" });
        }

        // req.user was loaded by the protect middleware.
        const passwordMatches = await req.user.comparePassword(currentPassword || "");

        if (!passwordMatches) {
            return res.status(400).json({ message: "Current password is incorrect" });
        }

        req.user.passwordHash = await bcrypt.hash(newPassword, 10);
        await req.user.save();

        res.status(200).json({ message: "Password updated" });
    } catch (error) {
        res.status(500).json({ message: "Failed to change password", error: error.message });
    }
};

module.exports = {
    registerOwner,
    registerStaff,
    login,
    getMe,
    getMembershipsForUser,
    changePassword,

};