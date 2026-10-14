const mongoose = require("mongoose");
const MenuItem = require("../models/MenuItem");
const Recipe = require("../models/Recipe");
const StockItem = require("../models/StockItem");
const Restaurant = require("../models/Restaurant");
const createCostCalculator = require("../utils/createCostCalculator");
const costMenuItem = require("../utils/costMenuItem");

// The fields a request may set. Anything else (restaurant, isActive...) is ignored.
const ALLOWED_FIELDS = ["name", "category", "recipe", "portions", "extras", "sellPrice","vatRate", "flipdishItemId"];

const pickAllowedFields = (body) => {
    const data = {};
    for (const field of ALLOWED_FIELDS) {
        if (body[field] !== undefined) data[field] = body[field];
    }
    return data;
};

// Makes sure the recipe and every extra belong to THIS restaurant.
// Without this, someone could link a menu item to another restaurant's
// recipe just by sending its id. Returns an error message, or null if fine.
const checkReferences = async (data, restaurantId) => {
    if (data.recipe !== undefined) {
        if (!mongoose.isValidObjectId(data.recipe)) return "Recipe not found";

        const recipe = await Recipe.findOne({
            _id: data.recipe,
            restaurant: restaurantId,
            isActive: true,
        });

        if (!recipe) return "Recipe not found";
        if (recipe.recipeType !== "production") {
            return "Menu items must use a production recipe (e.g. a tray), not a prep recipe";
        }
    }

    if (data.extras) {
        const ids = [...new Set(data.extras.map((extra) => String(extra.stockItem)))];

        if (!ids.every((id) => mongoose.isValidObjectId(id))) return "Extra stock item not found";

        const found = await StockItem.countDocuments({
            _id: { $in: ids },
            restaurant: restaurantId,
            isActive: true,
        });

        if (found !== ids.length) return "Extra stock item not found";
    }

    return null;
};

// GET /api/menu-items
// Every menu item, with its cost and food cost % worked out from current prices.
const getMenuItems = async (req, res) => {
    try {
        // Three independent queries, so run them at the same time.
        const [menuItems, recipes, restaurant] = await Promise.all([
            MenuItem.find({ restaurant: req.restaurantId, isActive: true })
                .populate("recipe", "name portionsPerOutput")
                .populate("extras.stockItem")
                .sort({ category: 1, name: 1 }),
            Recipe.find({ restaurant: req.restaurantId, isActive: true }).populate("ingredients.stockItem"),
            Restaurant.findById(req.restaurantId),
        ]);

        const calculator = createCostCalculator(recipes);
        const recipesById = new Map(recipes.map((recipe) => [String(recipe._id), recipe]));

        const result = menuItems.map((menuItem) => ({
            ...menuItem.toObject(),
            costing: costMenuItem(menuItem, calculator, recipesById, restaurant.vatRate),
        }));

        res.status(200).json({
            menuItems: result,
            vatRate: restaurant.vatRate,
            targetFoodCostPercent: restaurant.targetFoodCostPercent,
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch menu", error: error.message });
    }
};

// POST /api/menu-items
const createMenuItem = async (req, res) => {
    try {
        const data = pickAllowedFields(req.body);

        const problem = await checkReferences(data, req.restaurantId);
        if (problem) return res.status(400).json({ message: problem });

        const menuItem = await MenuItem.create({ ...data, restaurant: req.restaurantId });

        res.status(201).json(menuItem);
    } catch (error) {
        res.status(400).json({ message: "Failed to create menu item", error: error.message });
    }
};

// PUT /api/menu-items/:id
const updateMenuItem = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ message: "Menu item not found" });
        }

        const data = pickAllowedFields(req.body);

        const problem = await checkReferences(data, req.restaurantId);
        if (problem) return res.status(400).json({ message: problem });

        // Load, change, save (instead of findOneAndUpdate) so the model's
        // pre("validate") check runs: update queries skip document hooks.
        const menuItem = await MenuItem.findOne({
            _id: req.params.id,
            restaurant: req.restaurantId,
            isActive: true,
        });

        if (!menuItem) return res.status(404).json({ message: "Menu item not found" });

        Object.assign(menuItem, data);
        await menuItem.save();

        res.status(200).json(menuItem);

    } catch (error) {
        res.status(400).json({ message: "Failed to update menu item", error: error.message });
    }
};

// DELETE /api/menu-items/:id
// "Soft delete", like stock items: hidden, but kept so past sales still make sense.
const deleteMenuItem = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ message: "Menu item not found" });
        }

        const menuItem = await MenuItem.findOneAndUpdate(
            { _id: req.params.id, restaurant: req.restaurantId },
            { isActive: false },
            { new: true }
        );

        if (!menuItem) return res.status(404).json({ message: "Menu item not found" });

        res.status(200).json({ message: "Menu item removed" });
    } catch (error) {
        res.status(500).json({ message: "Failed to remove menu item", error: error.message });
    }
};

module.exports = { getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem };