const Supplier = require("../models/Supplier");

const getSuppliers = async (req, res) => {
    try {
        const suppliers = await Supplier.find({
            isActive: true,
            restaurant: req.restaurantId,
        }).sort({ name: 1 });

        res.status(200).json(suppliers);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch suppliers",
            error: error.message,
        });
    }
};

const getSupplierById = async (req, res) => {
    try {
        const supplier = await Supplier.findOne({
            _id: req.params.id,
            restaurant: req.restaurantId,
        });

        if (!supplier || !supplier.isActive) {
            return res.status(404).json({ message: "Supplier not found" });
        }

        res.status(200).json(supplier);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch supplier",
            error: error.message,
        });
    }
};

const createSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.create({
            ...req.body,
            restaurant: req.restaurantId,
        });

        res.status(201).json(supplier);
    } catch (error) {
        res.status(400).json({
            message: "Failed to create supplier",
            error: error.message,
        });
    }
};

const updateSupplier = async (req, res) => {
    try {
        const { restaurant, ...updates } = req.body;

        const supplier = await Supplier.findOneAndUpdate(
            { _id: req.params.id, restaurant: req.restaurantId },
            updates,
            {
                new: true,
                runValidators: true,
            }
        );

        if (!supplier || !supplier.isActive) {
            return res.status(404).json({ message: "Supplier not found" });
        }

        res.status(200).json(supplier);
    } catch (error) {
        res.status(400).json({
            message: "Failed to update supplier",
            error: error.message,
        });
    }
};

const deleteSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findOneAndUpdate(
            { _id: req.params.id, restaurant: req.restaurantId },
            { isActive: false },
            { new: true }
        );

        if (!supplier) {
            return res.status(404).json({ message: "Supplier not found" });
        }

        res.status(200).json({ message: "Supplier deactivated successfully" });
    } catch (error) {
        res.status(500).json({
            message: "Failed to deactivate supplier",
            error: error.message,
        });
    }
};

module.exports = {
    getSuppliers,
    getSupplierById,
    createSupplier,
    updateSupplier,
    deleteSupplier,
};