const express = require("express");
const {
    getSuppliers,
    getSupplierById,
    createSupplier,
    updateSupplier,
    deleteSupplier,
} = require("../controllers/supplierController");
const { protect, attachRestaurantContext } = require("../middleware/auth");
const requireOwner = require("../middleware/requireOwner");

const router = express.Router();

router.use(protect, attachRestaurantContext);

router.route("/").get(getSuppliers).post(requireOwner, createSupplier);

router
    .route("/:id")
    .get(getSupplierById)
    .put(requireOwner, updateSupplier)
    .delete(requireOwner, deleteSupplier);

module.exports = router;