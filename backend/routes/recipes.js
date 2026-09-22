const express = require("express");
const {
    getRecipes,
    getRecipeById,
    createRecipe,
    updateRecipe,
    deleteRecipe,
} = require("../controllers/recipeController");
const { protect, attachRestaurantContext } = require("../middleware/auth");
const requireOwner = require("../middleware/requireOwner");

const router = express.Router();

router.use(protect, attachRestaurantContext);

router.route("/").get(getRecipes).post(requireOwner, createRecipe);

router
    .route("/:id")
    .get(getRecipeById)
    .put(requireOwner, updateRecipe)
    .delete(requireOwner, deleteRecipe);

module.exports = router;