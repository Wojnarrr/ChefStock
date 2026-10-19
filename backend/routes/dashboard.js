const express = require("express");
const { getDashboardSummary, getDashboardCosts} = require("../controllers/dashboardController");
const { protect, attachRestaurantContext } = require("../middleware/auth");
const requireOwner = require("../middleware/requireOwner");

const router = express.Router();

router.use(protect, attachRestaurantContext);

router.get("/summary", getDashboardSummary);
router.get("/costs", requireOwner, getDashboardCosts);
module.exports = router;