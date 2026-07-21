const express = require("express");
const {
    getRecipes,
    getRecipeById,
    createRecipe,
    updateRecipe,
    deleteRecipe,
} = require("../controllers/recipeController");

const router = express.Router();

router.route("/").get(getRecipes).post(createRecipe);

router
    .route("/:id")
    .get(getRecipeById)
    .put(updateRecipe)
    .delete(deleteRecipe);

module.exports = router;