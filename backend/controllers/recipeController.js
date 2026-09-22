const Recipe = require("../models/Recipe");

const getRecipes = async (req, res) => {
    try {
        const recipes = await Recipe.find({
            isActive: true,
            restaurant: req.restaurantId,
        })
            .populate("ingredients.stockItem", "name stockUnit recipeUnit")
            .populate("outputStockItem", "name stockUnit recipeUnit")
            .sort({ name: 1 });

        res.status(200).json(recipes);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch recipes",
            error: error.message,
        });
    }
};

const getRecipeById = async (req, res) => {
    try {
        const recipe = await Recipe.findOne({
            _id: req.params.id,
            restaurant: req.restaurantId,
        }).populate("ingredients.stockItem", "name stockUnit recipeUnit");

        if (!recipe || !recipe.isActive) {
            return res.status(404).json({ message: "Recipe not found" });
        }

        res.status(200).json(recipe);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch recipe",
            error: error.message,
        });
    }
};

const createRecipe = async (req, res) => {
    try {
        const recipe = await Recipe.create({
            ...req.body,
            restaurant: req.restaurantId,
        });

        const populatedRecipe = await Recipe.findById(recipe._id).populate(
            "ingredients.stockItem",
            "name stockUnit recipeUnit"
        );

        res.status(201).json(populatedRecipe);
    } catch (error) {
        res.status(400).json({
            message: "Failed to create recipe",
            error: error.message,
        });
    }
};

const updateRecipe = async (req, res) => {
    try {
        const { restaurant, ...updates } = req.body;

        const recipe = await Recipe.findOneAndUpdate(
            { _id: req.params.id, restaurant: req.restaurantId },
            updates,
            { new: true, runValidators: true }
        )
            .populate("ingredients.stockItem", "name stockUnit recipeUnit")
            .populate("outputStockItem", "name stockUnit recipeUnit");

        if (!recipe || !recipe.isActive) {
            return res.status(404).json({ message: "Recipe not found" });
        }

        res.status(200).json(recipe);
    } catch (error) {
        res.status(400).json({
            message: "Failed to update recipe",
            error: error.message,
        });
    }
};

const deleteRecipe = async (req, res) => {
    try {
        const recipe = await Recipe.findOneAndUpdate(
            { _id: req.params.id, restaurant: req.restaurantId },
            { isActive: false },
            { new: true }
        );

        if (!recipe) {
            return res.status(404).json({ message: "Recipe not found" });
        }

        res.status(200).json({ message: "Recipe deactivated successfully" });
    } catch (error) {
        res.status(500).json({
            message: "Failed to deactivate recipe",
            error: error.message,
        });
    }
};

module.exports = {
    getRecipes,
    getRecipeById,
    createRecipe,
    updateRecipe,
    deleteRecipe,
};