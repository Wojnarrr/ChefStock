const express = require("express");
const {
    getStockItems,
    getStockItemById,
    createStockItem,
    updateStockItem,
    deleteStockItem,
    getLowStockItems,
} = require("../controllers/stockItemController");

const router = express.Router();

router.route("/").get(getStockItems).post(createStockItem);

router.get("/low-stock", getLowStockItems);

router
    .route("/:id")
    .get(getStockItemById)
    .put(updateStockItem)
    .delete(deleteStockItem);

module.exports = router;