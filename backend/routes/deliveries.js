const express = require("express");

const {
    getDeliveries,
    getDeliveryById,
    createDelivery,
} = require("../controllers/deliveryController");

const router = express.Router();

router.get("/", getDeliveries);
router.post("/", createDelivery);
router.get("/:id", getDeliveryById);

module.exports = router;