import { useState } from "react";

function CreateProductionBatchForm({ recipes, onSubmit, onCancel }) {
    const productionRecipes = recipes.filter(
        (recipe) => recipe.recipeType === "production" && recipe.isActive
    );

    const createEmptyProducedItem = () => {
        const firstRecipe = productionRecipes[0];

        return {
            recipe: firstRecipe?._id || "",
            quantityProduced: "1",
            outputUnit: firstRecipe?.outputUnit || "",
        };
    };

    const [formData, setFormData] = useState({
        itemsProduced: [createEmptyProducedItem()],
        notes: "",
    });

    const handleItemChange = (index, event) => {
        const { name, value } = event.target;

        setFormData((currentFormData) => {
            const updatedItems = currentFormData.itemsProduced.map((item, itemIndex) => {
                if (itemIndex !== index) {
                    return item;
                }

                const updatedItem = { ...item, [name]: value };

                if (name === "recipe") {
                    const selectedRecipe = productionRecipes.find((r) => r._id === value);
                    updatedItem.outputUnit = selectedRecipe?.outputUnit || "";
                }

                return updatedItem;
            });

            return { ...currentFormData, itemsProduced: updatedItems };
        });
    };

    const handleAddItem = () => {
        setFormData((currentFormData) => ({
            ...currentFormData,
            itemsProduced: [...currentFormData.itemsProduced, createEmptyProducedItem()],
        }));
    };

    const handleRemoveItem = (index) => {
        setFormData((currentFormData) => {
            if (currentFormData.itemsProduced.length === 1) {
                return currentFormData;
            }

            return {
                ...currentFormData,
                itemsProduced: currentFormData.itemsProduced.filter(
                    (_, itemIndex) => itemIndex !== index
                ),
            };
        });
    };

    const handleNotesChange = (event) => {
        setFormData((currentFormData) => ({
            ...currentFormData,
            notes: event.target.value,
        }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        onSubmit(formData);
    };

    return (
        <section className="panel form-panel">
            <div className="panel-header">
                <div>
                    <h2>Add Production Batch</h2>
                    <p className="panel-subtitle">
                        Record what was made using existing recipes. Stock is deducted automatically.
                    </p>
                </div>
            </div>

            {productionRecipes.length === 0 && (
                <p className="error">
                    No production recipes found. Create a production recipe first.
                </p>
            )}

            <form className="stock-form" onSubmit={handleSubmit}>
                <div className="delivery-items-header">
                    <div>
                        <h3>Items Produced</h3>
                        <p className="panel-subtitle">Pick a recipe and how many you made.</p>
                    </div>

                    <button type="button" className="primary-button" onClick={handleAddItem}>
                        Add Item
                    </button>
                </div>

                <div className="delivery-items-list">
                    {formData.itemsProduced.map((producedItem, index) => (
                        <div className="delivery-item-card" key={index}>
                            <div className="delivery-item-card-header">
                                <h4>Item {index + 1}</h4>

                                {formData.itemsProduced.length > 1 && (
                                    <button
                                        type="button"
                                        className="secondary-button"
                                        onClick={() => handleRemoveItem(index)}
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>

                            <div className="form-grid">
                                <label>
                                    Recipe
                                    <select
                                        name="recipe"
                                        value={producedItem.recipe}
                                        onChange={(event) => handleItemChange(index, event)}
                                        required
                                    >
                                        {productionRecipes.map((recipe) => (
                                            <option key={recipe._id} value={recipe._id}>
                                                {recipe.name}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label>
                                    Quantity Produced
                                    <input
                                        name="quantityProduced"
                                        type="number"
                                        step="0.001"
                                        value={producedItem.quantityProduced}
                                        onChange={(event) => handleItemChange(index, event)}
                                        required
                                    />
                                </label>

                                <label>
                                    Unit
                                    <input value={producedItem.outputUnit} disabled readOnly />
                                </label>
                            </div>
                        </div>
                    ))}
                </div>

                <label className="full-width-label">
                    Notes
                    <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleNotesChange}
                        placeholder="e.g. Morning bake"
                        rows="3"
                    />
                </label>

                <div className="form-actions">
                    <button type="button" className="secondary-button" onClick={onCancel}>
                        Cancel
                    </button>
                    <button type="submit" className="primary-button">
                        Create Production Batch
                    </button>
                </div>
            </form>
        </section>
    );
}

export default CreateProductionBatchForm;