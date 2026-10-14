const express = require("express");
const {
    getMenuItems,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
} = require("../controllers/menuItemController");
const { protect, attachRestaurantContext } = require("../middleware/auth");
const requireOwner = require("../middleware/requireOwner");

const router = express.Router();

// Menu costs and margins are business information: owners only.
router.use(protect, attachRestaurantContext, requireOwner);

router.route("/").get(getMenuItems).post(createMenuItem);
router.route("/:id").put(updateMenuItem).delete(deleteMenuItem);

module.exports = router;