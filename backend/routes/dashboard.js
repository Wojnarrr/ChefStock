const express = require("express");
const { getDashboardSummary } = require("../controllers/dashboardController");
const { protect, attachRestaurantContext } = require("../middleware/auth");

const router = express.Router();

router.use(protect, attachRestaurantContext);

router.get("/summary", getDashboardSummary);

module.exports = router;