const Recipe = require("../models/Recipe");

const getRecipes = async (req, res) => {
    try {
        const recipes = await Recipe.find({ isActive: true })
            .populate("ingredients.stockItem", "name stockUnit recipeUnit")
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
        const recipe = await Recipe.findById(req.params.id).populate(
            "ingredients.stockItem",
            "name stockUnit recipeUnit"
        );

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
        const recipe = await Recipe.create(req.body);

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
        const recipe = await Recipe.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        }).populate("ingredients.stockItem", "name stockUnit recipeUnit");

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
        const recipe = await Recipe.findByIdAndUpdate(
            req.params.id,
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