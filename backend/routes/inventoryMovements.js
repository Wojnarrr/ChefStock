const express = require("express");
const {
    getInventoryMovements,
} = require("../controllers/inventoryMovementController");

const router = express.Router();

router.route("/").get(getInventoryMovements);

module.exports = router;