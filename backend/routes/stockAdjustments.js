const express = require("express");
const {
    getStockAdjustments,
    createStockAdjustment,
} = require("../controllers/stockAdjustmentController");
const { protect, attachRestaurantContext } = require("../middleware/auth");

const router = express.Router();

router.use(protect, attachRestaurantContext);

router.route("/").get(getStockAdjustments).post(createStockAdjustment);

module.exports = router;