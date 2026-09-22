const express = require("express");
const {
    getInventoryMovements,
} = require("../controllers/inventoryMovementController");
const { protect, attachRestaurantContext } = require("../middleware/auth");

const router = express.Router();

router.use(protect, attachRestaurantContext);

router.route("/").get(getInventoryMovements);

module.exports = router;