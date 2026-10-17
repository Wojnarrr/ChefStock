import { useState } from "react";
import { apiFetch } from "../utils/api";
import { useApi } from "../hooks/useApi";
import ErrorBanner from "../components/ErrorBanner";
import RecipesView from "./RecipesView";
import CreateRecipeForm from "../forms/CreateRecipeForm";

// Turns what the form holds into what the API expects.
const toPayload = (formData, stockItems) => {
    const isPrep = formData.recipeType === "prep";
    const outputItem = stockItems.find((item) => item._id === formData.outputStockItem);

    return {
        name: formData.name,
        recipeType: formData.recipeType,
        // Prep output is added straight onto the item's stock, so it has to
        // be in that item's stock unit.
        outputUnit: isPrep ? outputItem.stockUnit : formData.outputUnit,
        portionsPerOutput:
            !isPrep && formData.portionsPerOutput !== "" ? Number(formData.portionsPerOutput) : null,
        outputStockItem: isPrep ? formData.outputStockItem : null,
        outputQuantity: isPrep ? Number(formData.outputQuantity) : null,
        ingredients: formData.ingredients.map((ingredient) => {
            const stockItem = stockItems.find((item) => item._id === ingredient.stockItem);

            return {
                stockItem: ingredient.stockItem,
                quantity: Number(ingredient.quantity),
                // Always the item's own recipe unit: that's what the backend converts from.
                unit: stockItem.recipeUnit || stockItem.stockUnit,
                isOptional: ingredient.isOptional,
            };
        }),
        notes: formData.notes,
        isActive: true,
    };
};

function RecipesPage() {
    const recipes = useApi("/recipes");
    const stockItems = useApi("/stock-items");

    // null = form closed, "new" = adding, a recipe object = editing it.
    const [formMode, setFormMode] = useState(null);
    const [actionError, setActionError] = useState("");

    // Errors are thrown back to the form, which shows them.
    const handleSave = async (formData) => {
        const isNew = formMode === "new";

        await apiFetch(isNew ? "/recipes" : `/recipes/${formMode._id}`, {
            method: isNew ? "POST" : "PUT",
            body: JSON.stringify(toPayload(formData, stockItems.data)),
        });

        await recipes.reload();
        setFormMode(null);
    };

    const handleDelete = async (recipe) => {
        if (!window.confirm(`Delete recipe "${recipe.name}"?`)) return;

        try {
            setActionError("");
            await apiFetch(`/recipes/${recipe._id}`, { method: "DELETE" });
            await recipes.reload();
        } catch (err) {
            setActionError(err.message);
        }
    };

    const handleEdit = (recipe) => {
        setFormMode(recipe);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const loading = recipes.loading || stockItems.loading;
    const error = recipes.error || stockItems.error;

    if (loading) return <p className="muted">Loading recipes...</p>;
    if (error && !recipes.data) return <p className="error">{error}</p>;

    return (
        <div className="page-stack">
            <ErrorBanner message={actionError} onDismiss={() => setActionError("")} />

            {formMode && (
                <CreateRecipeForm
                    key={formMode === "new" ? "new" : formMode._id}
                    recipes={recipes.data}
                    stockItems={stockItems.data}
                    editingRecipe={formMode === "new" ? null : formMode}
                    onSubmit={handleSave}
                    onCancel={() => setFormMode(null)}
                />
            )}

            <RecipesView
                recipes={recipes.data}
                isFormOpen={Boolean(formMode)}
                onAddRecipe={() => setFormMode("new")}
                onEditRecipe={handleEdit}
                onDeleteRecipe={handleDelete}
            />
        </div>
    );
}

export default RecipesPage;