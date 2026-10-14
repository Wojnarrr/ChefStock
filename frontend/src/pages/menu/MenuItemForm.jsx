import { useState } from "react";

// Turns a saved menu item into the strings the form inputs need.
const toFormState = (item) =>
    item
        ? {
            name: item.name,
            category: item.category || "",
            recipe: item.recipe?._id ?? item.recipe ?? "",
            portions: String(item.portions),
            sellPrice: String(item.sellPrice),
            vatRate: item.vatRate ?? "",
            extras: item.extras.map((extra) => ({
                stockItem: extra.stockItem?._id ?? extra.stockItem,
                quantity: String(extra.quantity),
            })),
        }
        : {
            name: "",
            category: "",
            recipe: "", // "" = no recipe (e.g. a drink)
            portions: "1",
            sellPrice: "",
            vatRate: "", // "" = use the restaurant's rate
            extras: [],
        };

function MenuItemForm({ recipes, stockItems, editingItem, onSubmit, onCancel }) {
    // Only production recipes (trays) can be sold; prep recipes make ingredients.
    const productionRecipes = recipes.filter((recipe) => recipe.recipeType === "production");

    const [form, setForm] = useState(() => toFormState(editingItem));
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const selectedRecipe = productionRecipes.find((recipe) => recipe._id === form.recipe);
    const portionsPerOutput = selectedRecipe?.portionsPerOutput;

    const handleChange = (event) => {
        setForm({ ...form, [event.target.name]: event.target.value });
        setError(""); // the user is fixing things, so clear the old message
    };

    // Shortcuts worked out from the recipe: for 8 portions -> 1, 4, 8; for 12 -> 1, 6, 12.
    const sizeShortcuts = portionsPerOutput
        ? [
            { label: "1 portion", portions: 1 },
            { label: "Half", portions: portionsPerOutput / 2 },
            { label: "Whole", portions: portionsPerOutput },
        ]
        : [];

    const handleExtraChange = (index, field, value) => {
        const extras = form.extras.map((extra, i) => (i === index ? { ...extra, [field]: value } : extra));
        setForm({ ...form, extras });
    };

    const handleAddExtra = () => {
        setForm({ ...form, extras: [...form.extras, { stockItem: stockItems[0]?._id || "", quantity: "1" }] });
        setError("");
    };

    const handleRemoveExtra = (index) => {
        setForm({ ...form, extras: form.extras.filter((_, i) => i !== index) });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        // Same rule as the backend, checked here too so the message comes instantly.
        if (!form.recipe && form.extras.length === 0) {
            setError("Choose a recipe, or add at least one stock item (e.g. the can for a drink).");
            return;
        }

        try {
            setError("");
            setSaving(true);

            // Inputs give us strings; the API wants numbers or null.
            await onSubmit({
                name: form.name,
                category: form.category,
                recipe: form.recipe || null,
                portions: form.recipe ? Number(form.portions) : 1,
                sellPrice: Number(form.sellPrice),
                vatRate: form.vatRate === "" ? null : Number(form.vatRate),
                extras: form.extras.map((extra) => ({
                    stockItem: extra.stockItem,
                    quantity: Number(extra.quantity),
                })),
            });
        } catch (err) {
            setError(err.message);
            setSaving(false);
        }
    };

    return (
        <section className="panel form-panel">
            <h2>{editingItem ? `Edit ${editingItem.name}` : "Add menu item"}</h2>

            <form className="stock-form" onSubmit={handleSubmit}>
                <div className="form-grid">
                    <label>
                        Name
                        <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Margherita slice" required />
                    </label>

                    <label>
                        Category
                        <input name="category" value={form.category} onChange={handleChange} placeholder="e.g. Pizza, Drinks" />
                    </label>

                    <label>
                        Sell price (€, incl. VAT)
                        <input name="sellPrice" type="number" step="0.01" min="0" value={form.sellPrice} onChange={handleChange} placeholder="As on the menu" required />
                    </label>

                    <label>
                        VAT rate for this item (%)
                        <input name="vatRate" type="number" step="0.1" min="0" max="100" value={form.vatRate} onChange={handleChange} placeholder="Leave empty to use the restaurant's" />
                    </label>
                </div>

                <h3 className="form-section-title">Made from a recipe</h3>
                <p className="panel-subtitle">For things cut from a tray or batch: pizza, tiramisu. Leave as "No recipe" for drinks.</p>

                <div className="form-grid">
                    <label>
                        Recipe
                        <select name="recipe" value={form.recipe} onChange={handleChange}>
                            <option value="">No recipe</option>
                            {productionRecipes.map((recipe) => (
                                <option key={recipe._id} value={recipe._id}>
                                    {recipe.name}
                                </option>
                            ))}
                        </select>
                        {portionsPerOutput && (
                            <span className="field-hint">
                Makes {portionsPerOutput} portions per {selectedRecipe.outputUnit}
              </span>
                        )}
                    </label>

                    {form.recipe && (
                        <label>
                            Portions sold
                            <input name="portions" type="number" step="0.5" min="0.5" value={form.portions} onChange={handleChange} required />
                            {sizeShortcuts.length > 0 && (
                                <span className="size-shortcuts">
                  {sizeShortcuts.map((size) => (
                      <button
                          key={size.label}
                          type="button"
                          className={`chip ${Number(form.portions) === size.portions ? "active" : ""}`}
                          onClick={() => setForm({ ...form, portions: String(size.portions) })}
                      >
                          {size.label}
                      </button>
                  ))}
                </span>
                            )}
                        </label>
                    )}
                </div>

                <div className="delivery-items-header">
                    <div>
                        <h3>Stock items</h3>
                        <p className="panel-subtitle">Served as they are: a can of Coke, 50 ml of garlic dip, a box.</p>
                    </div>
                    <button type="button" className="secondary-button" onClick={handleAddExtra} disabled={stockItems.length === 0}>
                        Add stock item
                    </button>
                </div>

                {form.extras.map((extra, index) => {
                    const stockItem = stockItems.find((item) => item._id === extra.stockItem);

                    return (
                        <div className="extra-row" key={index}>
                            <select
                                value={extra.stockItem}
                                onChange={(event) => handleExtraChange(index, "stockItem", event.target.value)}
                                aria-label={`Stock item ${index + 1}`}
                            >
                                {stockItems.map((item) => (
                                    <option key={item._id} value={item._id}>
                                        {item.name}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={extra.quantity}
                                onChange={(event) => handleExtraChange(index, "quantity", event.target.value)}
                                aria-label={`Quantity of stock item ${index + 1}`}
                                required
                            />
                            <span className="muted">{stockItem?.recipeUnit}</span>
                            <button type="button" className="link-button danger" onClick={() => handleRemoveExtra(index)}>
                                Remove
                            </button>
                        </div>
                    );
                })}

                {error && <p className="error">{error}</p>}

                <div className="form-actions">
                    <button type="button" className="secondary-button" onClick={onCancel}>
                        Cancel
                    </button>
                    <button type="submit" className="primary-button" disabled={saving}>
                        {saving ? "Saving..." : editingItem ? "Save changes" : "Add to menu"}
                    </button>
                </div>
            </form>
        </section>
    );
}

export default MenuItemForm;