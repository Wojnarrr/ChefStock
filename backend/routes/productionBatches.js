const express = require("express");
const {
    getProductionBatches,
    getProductionBatchById,
    createProductionBatch,
} = require("../controllers/productionBatchController");

const router = express.Router();

router.route("/").get(getProductionBatches).post(createProductionBatch);

router.route("/:id").get(getProductionBatchById);

module.exports = router;