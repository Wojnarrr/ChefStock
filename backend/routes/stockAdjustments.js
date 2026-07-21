const express = require("express");
const {
    getStockAdjustments,
    createStockAdjustment,
} = require("../controllers/stockAdjustmentController");

const router = express.Router();

router.route("/").get(getStockAdjustments).post(createStockAdjustment);

module.exports = router;