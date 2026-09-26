const mongoose = require("mongoose");
const RestaurantMembership = require("../models/RestaurantMembership");

const VALID_ROLES = ["owner", "staff"];

// Finds a membership by id, but ONLY inside the current restaurant.
// Without the restaurant filter, an owner of restaurant A could change
// or remove someone from restaurant B just by guessing an id.
const findMembershipInRestaurant = async (membershipId, restaurantId) => {
    if (!mongoose.isValidObjectId(membershipId)) return null;

    return RestaurantMembership.findOne({ _id: membershipId, restaurant: restaurantId });
};

const countOwners = (restaurantId) =>
    RestaurantMembership.countDocuments({ restaurant: restaurantId, role: "owner" });

// GET /api/members
const getMembers = async (req, res) => {
    try {
        const memberships = await RestaurantMembership.find({ restaurant: req.restaurantId })
            .populate("user", "name email")
            .sort({ role: 1, createdAt: 1 }); // "owner" sorts before "staff"

        const members = memberships.map((membership) => ({
            _id: membership._id, // the membership id, used for PATCH/DELETE
            role: membership.role,
            joinedAt: membership.createdAt,
            user: membership.user,
        }));

        res.status(200).json(members);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch members", error: error.message });
    }
};

// PATCH /api/members/:id   body: { role: "owner" | "staff" }
const updateMemberRole = async (req, res) => {
    try {
        const { role } = req.body;

        if (!VALID_ROLES.includes(role)) {
            return res.status(400).json({ message: "Role must be owner or staff" });
        }

        const membership = await findMembershipInRestaurant(req.params.id, req.restaurantId);

        if (!membership) {
            return res.status(404).json({ message: "Member not found" });
        }

        // Never leave a restaurant without an owner.
        if (membership.role === "owner" && role === "staff") {
            const owners = await countOwners(req.restaurantId);
            if (owners <= 1) {
                return res.status(400).json({ message: "A restaurant must have at least one owner" });
            }
        }

        membership.role = role;
        await membership.save();

        res.status(200).json({ _id: membership._id, role: membership.role });
    } catch (error) {
        res.status(500).json({ message: "Failed to update member", error: error.message });
    }
};

// DELETE /api/members/:id
const removeMember = async (req, res) => {
    try {
        const membership = await findMembershipInRestaurant(req.params.id, req.restaurantId);

        if (!membership) {
            return res.status(404).json({ message: "Member not found" });
        }

        if (membership.role === "owner") {
            const owners = await countOwners(req.restaurantId);
            if (owners <= 1) {
                return res.status(400).json({ message: "You can't remove the last owner" });
            }
        }

        await membership.deleteOne();

        res.status(200).json({ message: "Member removed" });
    } catch (error) {
        res.status(500).json({ message: "Failed to remove member", error: error.message });
    }
};

module.exports = { getMembers, updateMemberRole, removeMember };