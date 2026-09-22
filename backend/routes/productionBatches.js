const express = require("express");
const {
    getProductionBatches,
    getProductionBatchById,
    createProductionBatch,
} = require("../controllers/productionBatchController");
const { protect, attachRestaurantContext } = require("../middleware/auth");

const router = express.Router();

router.use(protect, attachRestaurantContext);

router.route("/").get(getProductionBatches).post(createProductionBatch);

router.route("/:id").get(getProductionBatchById);

module.exports = router;