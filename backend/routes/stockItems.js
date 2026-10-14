const express = require("express");
const {
    getStockItems,
    getStockItemById,
    createStockItem,
    updateStockItem,
    deleteStockItem,
    getLowStockItems,
    getPriceHistory,
} = require("../controllers/stockItemController");
const { protect, attachRestaurantContext } = require("../middleware/auth");
const requireOwner = require("../middleware/requireOwner");

const router = express.Router();

router.use(protect, attachRestaurantContext);

router.route("/").get(getStockItems).post(requireOwner, createStockItem);

router.get("/low-stock", getLowStockItems);

router.get("/:id/price-history", getPriceHistory);

router
    .route("/:id")
    .get(getStockItemById)
    .put(requireOwner, updateStockItem)
    .delete(requireOwner, deleteStockItem);

module.exports = router;
