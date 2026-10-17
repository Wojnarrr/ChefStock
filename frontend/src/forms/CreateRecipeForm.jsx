import { useState } from "react";
import { useSubmit } from "../hooks/useSubmit";
// What one "output" of a recipe we sell can be. Prep recipes don't need this:
// they're measured in the unit of the item they make.
const SELLABLE_UNITS = ["tray", "pizza", "portion", "batch", "pcs"];

// The unit recipes measure this item in, e.g. g of cheese.
const getRecipeUnit = (item) => item?.recipeUnit || item?.stockUnit || "";

const toOptionalString = (value) => (value === null || value === undefined ? "" : String(value));

const createEmptyIngredient = () => ({ stockItem: "", quantity: "", isOptional: false });

// Saved recipe -> what the inputs need (or a blank form).
const toFormState = (recipe) =>
    recipe
        ? {
          name: recipe.name,
          recipeType: recipe.recipeType,
          outputStockItem: recipe.outputStockItem?._id || recipe.outputStockItem || "",
          outputQuantity: toOptionalString(recipe.outputQuantity),
          outputUnit: recipe.outputUnit,
          portionsPerOutput: toOptionalString(recipe.portionsPerOutput),
          ingredients: recipe.ingredients.map((ingredient) => ({
            stockItem: ingredient.stockItem?._id || ingredient.stockItem,
            quantity: String(ingredient.quantity),
            isOptional: ingredient.isOptional,
          })),
          notes: recipe.notes || "",
        }
        : {
          name: "",
          recipeType: "production",
          outputStockItem: "",
          outputQuantity: "1",
          outputUnit: "tray",
          portionsPerOutput: "8",
          ingredients: [createEmptyIngredient()],
          notes: "",
        };

function CreateRecipeForm({ recipes = [], stockItems, editingRecipe, onSubmit, onCancel }) {
  const isEditing = Boolean(editingRecipe);
  const [formData, setFormData] = useState(() => toFormState(editingRecipe));

  const isPrep = formData.recipeType === "prep";
  const findStockItem = (id) => stockItems.find((item) => item._id === id);

  // A prep recipe makes something you made in house (sauce, dough).
  const madeInHouseItems = stockItems.filter((item) => item.stockType === "prepared");
  const outputItem = findStockItem(formData.outputStockItem);

  // Warn about recipes with the same or a similar name.
  const typed = formData.name.trim().toLowerCase();
  const similarRecipes =
      typed.length >= 2
          ? recipes.filter(
              (recipe) => recipe._id !== editingRecipe?._id && recipe.name.toLowerCase().includes(typed)
          )
          : [];
  const exactMatch = similarRecipes.find((recipe) => recipe.name.toLowerCase() === typed);

  const handleMainChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const setRecipeType = (recipeType) => {
    setFormData((current) => ({
      ...current,
      recipeType,
      outputUnit: recipeType === "prep" ? current.outputUnit : "tray",
      portionsPerOutput: recipeType === "prep" ? "" : "8",
    }));
  };

  const handleIngredientChange = (index, event) => {
    const { name, value, type, checked } = event.target;

    setFormData((current) => ({
      ...current,
      ingredients: current.ingredients.map((ingredient, i) =>
          i === index ? { ...ingredient, [name]: type === "checkbox" ? checked : value } : ingredient
      ),
    }));
  };

  const handleAddIngredient = () => {
    setFormData((current) => ({
      ...current,
      ingredients: [...current.ingredients, createEmptyIngredient()],
    }));
  };

  const handleRemoveIngredient = (index) => {
    setFormData((current) => ({
      ...current,
      ingredients: current.ingredients.filter((_, i) => i !== index),
    }));
  };

  const { submit, error, saving } = useSubmit(onSubmit);

  const handleSubmit = (event) => {
    event.preventDefault();
    submit(formData);
  };

  return (
      <section className="panel form-panel">
        <div className="panel-header">
          <div>
            <h2>{isEditing ? `Edit ${editingRecipe.name}` : "Add recipe"}</h2>
            <p className="panel-subtitle">What goes into it, and what it makes.</p>
          </div>
        </div>

        <form className="stock-form" onSubmit={handleSubmit}>
          <label className="full-width-label">
            Name
            <input
                name="name"
                value={formData.name}
                onChange={handleMainChange}
                placeholder={isPrep ? "e.g. Pizza sauce" : "e.g. Margherita tray"}
                required
            />
            {exactMatch ? (
                <span className="field-hint field-warning">"{exactMatch.name}" already exists.</span>
            ) : (
                similarRecipes.length > 0 && (
                    <span className="field-hint">
                Already have: {similarRecipes.slice(0, 4).map((recipe) => recipe.name).join(", ")}
              </span>
                )
            )}
          </label>

          <fieldset className="choice-group">
            <legend>What is it?</legend>
            <label className={`choice ${!isPrep ? "active" : ""}`}>
              <input type="radio" name="recipeType" checked={!isPrep} onChange={() => setRecipeType("production")} />
              <span>
              <strong>Something we sell</strong>
              <small>e.g. a tray of pizza</small>
            </span>
            </label>
            <label className={`choice ${isPrep ? "active" : ""}`}>
              <input type="radio" name="recipeType" checked={isPrep} onChange={() => setRecipeType("prep")} />
              <span>
              <strong>Something we prep</strong>
              <small>e.g. sauce or dough, used in other recipes</small>
            </span>
            </label>
          </fieldset>

          {/* What the recipe makes, written as a sentence so it's obvious what each box means. */}
          {isPrep ? (
              <div className="form-grid">
                <label>
                  It makes
                  <select name="outputStockItem" value={formData.outputStockItem} onChange={handleMainChange} required>
                    <option value="" disabled>
                      Choose item…
                    </option>
                    {madeInHouseItems.map((item) => (
                        <option key={item._id} value={item._id}>
                          {item.name}
                        </option>
                    ))}
                  </select>
                  {madeInHouseItems.length === 0 && (
                      <span className="field-hint field-warning">
                  Add the item first in Stock Items and choose "Made in house".
                </span>
                  )}
                </label>

                <label>
                  How much one batch makes
                  <span className="input-with-unit">
                <input
                    name="outputQuantity"
                    type="number"
                    step="any"
                    min="0.001"
                    value={formData.outputQuantity}
                    onChange={handleMainChange}
                    required
                />
                <span>{outputItem?.stockUnit || ""}</span>
              </span>
                </label>
              </div>
          ) : (
              <div className="form-grid">
                <label>
                  One recipe makes one
                  <select name="outputUnit" value={formData.outputUnit} onChange={handleMainChange}>
                    {SELLABLE_UNITS.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                    ))}
                  </select>
                </label>

                <label>
                  Cut into
                  <span className="input-with-unit">
                <input
                    name="portionsPerOutput"
                    type="number"
                    step="1"
                    min="1"
                    value={formData.portionsPerOutput}
                    onChange={handleMainChange}
                    placeholder="e.g. 8"
                />
                <span>slices / portions</span>
              </span>
                </label>
              </div>
          )}

          <h3 className="form-section-title">Ingredients</h3>

          <div className="ingredient-list">
            {formData.ingredients.map((ingredient, index) => {
              const selected = findStockItem(ingredient.stockItem);

              // Items already used on another line, and the item this recipe makes,
              // can't be picked again.
              const unavailable = new Set(
                  formData.ingredients.filter((_, i) => i !== index).map((other) => other.stockItem)
              );
              if (isPrep) unavailable.add(formData.outputStockItem);

              return (
                  <div className="ingredient-row" key={index}>
                    <select
                        name="stockItem"
                        value={ingredient.stockItem}
                        onChange={(event) => handleIngredientChange(index, event)}
                        aria-label={`Ingredient ${index + 1}`}
                        required
                    >
                      <option value="" disabled>
                        Choose ingredient…
                      </option>
                      {stockItems.map((item) => (
                          <option key={item._id} value={item._id} disabled={unavailable.has(item._id)}>
                            {item.name}
                          </option>
                      ))}
                    </select>

                    <span className="input-with-unit">
                  <input
                      name="quantity"
                      type="number"
                      step="any"
                      min="0.001"
                      value={ingredient.quantity}
                      onChange={(event) => handleIngredientChange(index, event)}
                      placeholder="Amount"
                      aria-label={`Amount of ingredient ${index + 1}`}
                      required
                  />
                  <span>{getRecipeUnit(selected)}</span>
                </span>

                    <label className="checkbox-label">
                      <input
                          type="checkbox"
                          name="isOptional"
                          checked={ingredient.isOptional}
                          onChange={(event) => handleIngredientChange(index, event)}
                      />
                      Optional
                    </label>

                    {formData.ingredients.length > 1 ? (
                        <button type="button" className="link-button danger" onClick={() => handleRemoveIngredient(index)}>
                          Remove
                        </button>
                    ) : (
                        <span />
                    )}
                  </div>
              );
            })}
          </div>

          <button type="button" className="secondary-button" onClick={handleAddIngredient}>
            + Add ingredient
          </button>

          <details className="more-options">
            <summary>Notes</summary>
            <textarea
                name="notes"
                value={formData.notes}
                onChange={handleMainChange}
                placeholder="e.g. Bake 12 minutes at 250°C"
                rows="3"
            />
          </details>
          {error && <p className="error">{error}</p>}

          <div className="form-actions">
            <button type="button" className="secondary-button" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="primary-button">
              {isEditing ? "Save changes" : "Create recipe"}
            </button>
          </div>
        </form>
      </section>
  );
}

export default CreateRecipeForm;
