const express = require("express");

const {
    getDeliveries,
    getDeliveryById,
    createDelivery,
} = require("../controllers/deliveryController");
const { protect, attachRestaurantContext } = require("../middleware/auth");

const router = express.Router();

router.use(protect, attachRestaurantContext);

router.get("/", getDeliveries);
router.post("/", createDelivery);
router.get("/:id", getDeliveryById);

module.exports = router;