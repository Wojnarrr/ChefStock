const express = require("express");
const {
    getSuppliers,
    getSupplierById,
    createSupplier,
    updateSupplier,
    deleteSupplier,
} = require("../controllers/supplierController");

const router = express.Router();

router.route("/").get(getSuppliers).post(createSupplier);

router
    .route("/:id")
    .get(getSupplierById)
    .put(updateSupplier)
    .delete(deleteSupplier);

module.exports = router;