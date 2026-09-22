import { useState } from "react";

function CreateRecipeForm({ recipes, stockItems, editingRecipe, onSubmit, onCancel }) {
  const isEditing = Boolean(editingRecipe);

  const createEmptyIngredient = () => {
    const firstItem = stockItems[0];

    return {
      stockItem: firstItem?._id || "",
      quantity: "1",
      unit: firstItem?.recipeUnit || firstItem?.stockUnit || "",
      minQuantity: "",
      maxQuantity: "",
      isOptional: false,
      notes: "",
    };
  };

  const [formData, setFormData] = useState(() =>
      editingRecipe
          ? {
            name: editingRecipe.name,
            recipeType: editingRecipe.recipeType,
            outputStockItem: editingRecipe.outputStockItem?._id || editingRecipe.outputStockItem || "",
            outputQuantity:
                editingRecipe.outputQuantity === null || editingRecipe.outputQuantity === undefined
                    ? ""
                    : String(editingRecipe.outputQuantity),
            outputUnit: editingRecipe.outputUnit,
            portionsPerOutput:
                editingRecipe.portionsPerOutput === null || editingRecipe.portionsPerOutput === undefined
                    ? ""
                    : String(editingRecipe.portionsPerOutput),
            ingredients: editingRecipe.ingredients.map((ingredient) => ({
              stockItem: ingredient.stockItem?._id || ingredient.stockItem,
              quantity: String(ingredient.quantity),
              unit: ingredient.unit,
              minQuantity: ingredient.minQuantity === null || ingredient.minQuantity === undefined ? "" : String(ingredient.minQuantity),
              maxQuantity: ingredient.maxQuantity === null || ingredient.maxQuantity === undefined ? "" : String(ingredient.maxQuantity),
              isOptional: ingredient.isOptional,
              notes: ingredient.notes || "",
            })),
            notes: editingRecipe.notes || "",
          }
          : {
            name: "",
            recipeType: "production",
            outputStockItem: stockItems[0]?._id || "",
            outputQuantity: "",
            outputUnit: "pizza",
            portionsPerOutput: "8",
            ingredients: [createEmptyIngredient()],
            notes: "",
          }
  );

  const handleMainChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }));
  };

  const handleRecipeTypeChange = (event) => {
    const newRecipeType = event.target.value;

    setFormData((currentFormData) => ({
      ...currentFormData,
      recipeType: newRecipeType,
      outputUnit: newRecipeType === "prep" ? "container" : "pizza",
      portionsPerOutput: newRecipeType === "prep" ? "" : "8",
      outputQuantity: newRecipeType === "prep" ? "1" : "",
    }));
  };

  const handleIngredientChange = (index, event) => {
    const { name, value, type, checked } = event.target;

    setFormData((currentFormData) => {
      const updatedIngredients = currentFormData.ingredients.map(
          (ingredient, ingredientIndex) => {
            if (ingredientIndex !== index) {
              return ingredient;
            }

            const updatedIngredient = {
              ...ingredient,
              [name]: type === "checkbox" ? checked : value,
            };

            if (name === "stockItem") {
              const selectedStockItem = stockItems.find(
                  (item) => item._id === value
              );

              updatedIngredient.unit =
                  selectedStockItem?.recipeUnit || selectedStockItem?.stockUnit || "";
            }

            return updatedIngredient;
          }
      );

      return {
        ...currentFormData,
        ingredients: updatedIngredients,
      };
    });
  };

  const handleAddIngredient = () => {
    setFormData((currentFormData) => ({
      ...currentFormData,
      ingredients: [...currentFormData.ingredients, createEmptyIngredient()],
    }));
  };

  const handleRemoveIngredient = (index) => {
    setFormData((currentFormData) => {
      if (currentFormData.ingredients.length === 1) {
        return currentFormData;
      }

      return {
        ...currentFormData,
        ingredients: currentFormData.ingredients.filter(
            (_, ingredientIndex) => ingredientIndex !== index
        ),
      };
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(formData);
  };

  const outputUnitOptions =
      formData.recipeType === "prep"
          ? ["g", "kg", "ml", "l", "pcs", "pack", "box", "case", "bottle", "can", "container", "batch"]
          : ["pizza", "tray", "portion", "batch", "pcs"];

  return (
      <section className="panel form-panel">
        <div className="panel-header">
          <div>
            <h2>{isEditing ? "Edit Recipe" : "Add Recipe"}</h2>
            <p className="panel-subtitle">
              {isEditing
                  ? "Update this recipe's ingredients and output."
                  : "Create a reusable recipe for production or prep."}
            </p>
          </div>
        </div>

        <form className="stock-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              Recipe Name
              <input
                  name="name"
                  value={formData.name}
                  onChange={handleMainChange}
                  placeholder="e.g. Margherita Pizza"
                  required
              />
            </label>

            <label>
              Recipe Type
              <select
                  name="recipeType"
                  value={formData.recipeType}
                  onChange={handleRecipeTypeChange}
              >
                <option value="production">Production</option>
                <option value="prep">Prep</option>
              </select>
            </label>

            {formData.recipeType === "prep" && (
                <>
                  <label>
                    Output Stock Item
                    <select
                        name="outputStockItem"
                        value={formData.outputStockItem}
                        onChange={handleMainChange}
                        required
                    >
                      {stockItems.map((item) => (
                          <option key={item._id} value={item._id}>
                            {item.name} ({item.stockUnit})
                          </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Output Quantity
                    <input
                        name="outputQuantity"
                        type="number"
                        step="0.001"
                        value={formData.outputQuantity}
                        onChange={handleMainChange}
                        placeholder="e.g. 8"
                        required
                    />
                  </label>
                </>
            )}

            <label>
              Output Unit
              <select
                  name="outputUnit"
                  value={formData.outputUnit}
                  onChange={handleMainChange}
                  required
              >
                {outputUnitOptions.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                ))}
              </select>
            </label>

            {formData.recipeType === "production" && (
                <label>
                  Portions Per Output
                  <input
                      name="portionsPerOutput"
                      type="number"
                      step="1"
                      value={formData.portionsPerOutput}
                      onChange={handleMainChange}
                      placeholder="e.g. 8 slices per pizza"
                  />
                </label>
            )}
          </div>

          <div className="delivery-items-header">
            <div>
              <h3>Ingredients</h3>
              <p className="panel-subtitle">
                Add stock items used to make this recipe.
              </p>
            </div>

            <button
                type="button"
                className="primary-button"
                onClick={handleAddIngredient}
            >
              Add Ingredient
            </button>
          </div>

          <div className="delivery-items-list">
            {formData.ingredients.map((ingredient, index) => {
              const selectedStockItem = stockItems.find(
                  (item) => item._id === ingredient.stockItem
              );

              return (
                  <div className="delivery-item-card" key={index}>
                    <div className="delivery-item-card-header">
                      <h4>Ingredient {index + 1}</h4>

                      {formData.ingredients.length > 1 && (
                          <button
                              type="button"
                              className="secondary-button"
                              onClick={() => handleRemoveIngredient(index)}
                          >
                            Remove
                          </button>
                      )}
                    </div>

                    <div className="form-grid">
                      <label>
                        Stock Item
                        <select
                            name="stockItem"
                            value={ingredient.stockItem}
                            onChange={(event) => handleIngredientChange(index, event)}
                            required
                        >
                          {stockItems.map((item) => (
                              <option key={item._id} value={item._id}>
                                {item.name} ({item.recipeUnit || item.stockUnit})
                              </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        Quantity
                        <input
                            name="quantity"
                            type="number"
                            step="0.001"
                            value={ingredient.quantity}
                            onChange={(event) => handleIngredientChange(index, event)}
                            required
                        />
                      </label>

                      <label>
                        Unit
                        <input
                            name="unit"
                            value={ingredient.unit}
                            onChange={(event) => handleIngredientChange(index, event)}
                            placeholder={
                                selectedStockItem?.recipeUnit ||
                                selectedStockItem?.stockUnit ||
                                "unit"
                            }
                            required
                        />
                      </label>

                      <label>
                        Min Quantity
                        <input
                            name="minQuantity"
                            type="number"
                            step="0.001"
                            value={ingredient.minQuantity}
                            onChange={(event) => handleIngredientChange(index, event)}
                            placeholder="Optional"
                        />
                      </label>

                      <label>
                        Max Quantity
                        <input
                            name="maxQuantity"
                            type="number"
                            step="0.001"
                            value={ingredient.maxQuantity}
                            onChange={(event) => handleIngredientChange(index, event)}
                            placeholder="Optional"
                        />
                      </label>

                      <label>
                        Ingredient Notes
                        <input
                            name="notes"
                            value={ingredient.notes}
                            onChange={(event) => handleIngredientChange(index, event)}
                            placeholder="Optional"
                        />
                      </label>
                    </div>

                    <div className="checkbox-row">
                      <label>
                        <input
                            type="checkbox"
                            name="isOptional"
                            checked={ingredient.isOptional}
                            onChange={(event) => handleIngredientChange(index, event)}
                        />
                        Optional ingredient
                      </label>
                    </div>
                  </div>
              );
            })}
          </div>

          <label className="full-width-label">
            Recipe Notes
            <textarea
                name="notes"
                value={formData.notes}
                onChange={handleMainChange}
                placeholder="Optional recipe notes"
                rows="3"
            />
          </label>

          <div className="form-actions">
            <button type="button" className="secondary-button" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="primary-button">
              {isEditing ? "Save Changes" : "Create Recipe"}
            </button>
          </div>
        </form>
      </section>
  );
}

export default CreateRecipeForm;