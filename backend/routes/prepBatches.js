const express = require("express");
const {
    getPrepBatches,
    getPrepBatchById,
    createPrepBatch,
} = require("../controllers/prepBatchController");

const router = express.Router();

router.route("/").get(getPrepBatches).post(createPrepBatch);

router.route("/:id").get(getPrepBatchById);

module.exports = router;