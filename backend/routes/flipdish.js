const express = require("express");
const {
    getStatus,
    setStore,
    syncSales,
    getSampleOrders,
    getSampleSales,
    getUnmatched,
    matchItem,
    createMenuItems,
} = require("../controllers/flipdishController");
const { protect, attachRestaurantContext } = require("../middleware/auth");
const requireOwner = require("../middleware/requireOwner");

const router = express.Router();

// Sales figures are business information: owners only.
router.use(protect, attachRestaurantContext, requireOwner);

router.get("/status", getStatus);
router.put("/store", setStore);
router.post("/sync", syncSales);
router.get("/sample-orders", getSampleOrders);
router.get("/sample-sales", getSampleSales);
router.get("/unmatched", getUnmatched);
router.post("/match", matchItem);
router.post("/create-menu-items", createMenuItems);

module.exports = router;
