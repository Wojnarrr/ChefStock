const express = require("express");
const {
    updateCurrentRestaurant,
    regenerateJoinCode,
    createRestaurant,
    joinRestaurant,
} = require("../controllers/restaurantController");
const { protect, attachRestaurantContext } = require("../middleware/auth");
const requireOwner = require("../middleware/requireOwner");

const router = express.Router();

// Everything here needs a logged-in user.
router.use(protect);

// These two are about restaurants you're NOT in yet,
// so there's no restaurant context to check.
router.post("/", createRestaurant);
router.post("/join", joinRestaurant);

// These act on the currently selected restaurant (the x-restaurant-id header),
// and only its owner may use them.
router.put("/current", attachRestaurantContext, requireOwner, updateCurrentRestaurant);
router.post("/current/join-code", attachRestaurantContext, requireOwner, regenerateJoinCode);

module.exports = router;