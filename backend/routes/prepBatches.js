const express = require("express");
const {
    getPrepBatches,
    getPrepBatchById,
    createPrepBatch,
} = require("../controllers/prepBatchController");
const { protect, attachRestaurantContext } = require("../middleware/auth");

const router = express.Router();

router.use(protect, attachRestaurantContext);

router.route("/").get(getPrepBatches).post(createPrepBatch);

router.route("/:id").get(getPrepBatchById);

module.exports = router;