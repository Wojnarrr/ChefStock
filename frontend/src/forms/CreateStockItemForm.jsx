import { useState } from "react";
import { STOCK_UNIT_OPTIONS } from "../constants/options";

const CATEGORY_OPTIONS = [
  { value: "ingredient", label: "Ingredient" },
  { value: "drink", label: "Drink" },
  { value: "packaging", label: "Packaging" },
  { value: "other", label: "Other" },
];

// Saved item -> the strings the inputs need (or a blank form).
const toFormState = (item) =>
    item
        ? {
          name: item.name,
          category: item.category,
          madeInHouse: item.stockType === "prepared",
          stockUnit: item.stockUnit,
          recipeUnit: item.recipeUnit,
          // Older items may only have the "estimated" number; use it so nothing is lost.
          unitsPerStockUnit: String(item.unitsPerStockUnit ?? item.estimatedUnitsPerStockUnit ?? ""),
          currentStock: "0",
          minStockLevel: String(item.minStockLevel ?? 0),
          reorderQuantity: String(item.reorderQuantity ?? 0),
          preferredSupplier: item.preferredSupplier?._id ?? item.preferredSupplier ?? "",
        }
        : {
          name: "",
          category: "ingredient",
          madeInHouse: false,
          stockUnit: "case",
          recipeUnit: "case",
          unitsPerStockUnit: "",
          currentStock: "0",
          minStockLevel: "0",
          reorderQuantity: "0",
          preferredSupplier: "",
        };

function CreateStockItemForm({ editingStockItem, stockItems = [], suppliers = [], onSubmit, onCancel }) {
  const isEditing = Boolean(editingStockItem);

  const [form, setForm] = useState(() => toFormState(editingStockItem));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Only ask for the conversion when the two units are different.
  const needsConversion = form.stockUnit !== form.recipeUnit;
// Items whose name contains what's been typed, so you can spot duplicates.
  const typed = form.name.trim().toLowerCase();
  const similarItems =
      typed.length >= 2
          ? stockItems.filter(
              (item) =>
                  item._id !== editingStockItem?._id &&
                  item.name.toLowerCase().includes(typed)
          )
          : [];
  const exactMatch = similarItems.find((item) => item.name.toLowerCase() === typed);
  const handleChange = (event) => {
    const { name, value } = event.target;
    setError("");

    setForm((current) => {
      const next = { ...current, [name]: value };

      // Most items are used in the same unit they're counted in, so the recipe
      // unit follows the stock unit until someone changes it on purpose.
      if (name === "stockUnit" && current.recipeUnit === current.stockUnit) {
        next.recipeUnit = value;
      }

      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setError("");
      setSaving(true);

      // Keep old "finished product" / "non-edible" types unless it's now made in house.
      const boughtInType =
          editingStockItem && editingStockItem.stockType !== "prepared" ? editingStockItem.stockType : "raw";

      const payload = {
        name: form.name,
        category: form.category,
        stockType: form.madeInHouse ? "prepared" : boughtInType,
        stockUnit: form.stockUnit,
        recipeUnit: form.recipeUnit,
        unitsPerStockUnit: needsConversion ? Number(form.unitsPerStockUnit) : null,
        minStockLevel: Number(form.minStockLevel),
        reorderQuantity: Number(form.reorderQuantity),
        preferredSupplier: form.preferredSupplier || null,
      };

      // The starting amount is only set when creating; after that, stock
      // changes through deliveries, prep and Adjust Stock.
      if (!isEditing) {
        payload.currentStock = Number(form.currentStock);
      }

      await onSubmit(payload);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
      <section className="panel form-panel">
        <div className="panel-header">
          <div>
            <h2>{isEditing ? `Edit ${editingStockItem.name}` : "Add stock item"}</h2>
            <p className="panel-subtitle">
              {isEditing
                  ? "To change how much you have, use Adjust Stock on the item's page."
                  : "Anything you buy or make: ingredients, drinks, packaging."}
            </p>
          </div>
        </div>

        <form className="stock-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              Name
              <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Mozzarella" required />
              {exactMatch ? (
                  <span className="field-hint field-warning">
                    "{exactMatch.name}" is already in your stock list.
                  </span>
              ) : similarItems.length > 0 && (
                  <span className="field-hint">
                    Already have: {similarItems.slice(0, 4).map((item) => item.name).join(", ")}
                    {similarItems.length > 4 && ` +${similarItems.length - 4} more`}
                  </span>
              )}
            </label>

            <label>
              Category
              <select name="category" value={form.category} onChange={handleChange}>
                {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                ))}
              </select>
            </label>
          </div>

          <fieldset className="choice-group">
            <legend>Where does it come from?</legend>
            <label className={`choice ${!form.madeInHouse ? "active" : ""}`}>
              <input
                  type="radio"
                  name="madeInHouse"
                  checked={!form.madeInHouse}
                  onChange={() => setForm({ ...form, madeInHouse: false })}
              />
              <span>
              <strong>Bought in</strong>
              <small>Comes on a delivery</small>
            </span>
            </label>
            <label className={`choice ${form.madeInHouse ? "active" : ""}`}>
              <input
                  type="radio"
                  name="madeInHouse"
                  checked={form.madeInHouse}
                  onChange={() => setForm({ ...form, madeInHouse: true })}
              />
              <span>
              <strong>Made in house</strong>
              <small>Made by a prep recipe, e.g. sauce, dough</small>
            </span>
            </label>
          </fieldset>

          <div className="form-grid">
            <label>
              You count it in
              <select name="stockUnit" value={form.stockUnit} onChange={handleChange}>
                {STOCK_UNIT_OPTIONS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                ))}
              </select>
              <span className="field-hint">How it arrives and how you count it: case, box, can…</span>
            </label>

            <label>
              Recipes use it in
              <select name="recipeUnit" value={form.recipeUnit} onChange={handleChange}>
                {STOCK_UNIT_OPTIONS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                ))}
              </select>
              <span className="field-hint">e.g. grams of cheese on a pizza</span>
            </label>

            {needsConversion && (
                <label>
                  How many {form.recipeUnit} in one {form.stockUnit}?
                  <input
                      name="unitsPerStockUnit"
                      type="number"
                      step="any"
                      min="0.001"
                      value={form.unitsPerStockUnit}
                      onChange={handleChange}
                      placeholder="e.g. 10000"
                      required
                  />
                  <span className="field-hint">An average is fine. If it varies, use what you usually get.</span>
                </label>
            )}

            <label>
              Warn me when below
              <span className="input-with-unit">
              <input name="minStockLevel" type="number" step="any" min="0" value={form.minStockLevel} onChange={handleChange} required />
              <span>{form.stockUnit}</span>
            </span>
            </label>

            {!isEditing && (
                <label>
                  Stock on hand now
                  <span className="input-with-unit">
                <input name="currentStock" type="number" step="any" min="0" value={form.currentStock} onChange={handleChange} />
                <span>{form.stockUnit}</span>
              </span>
                </label>
            )}
          </div>

          <details className="more-options">
            <summary>More options</summary>
            <div className="form-grid">
              <label>
                Preferred supplier
                <select name="preferredSupplier" value={form.preferredSupplier} onChange={handleChange}>
                  <option value="">None</option>
                  {suppliers.map((supplier) => (
                      <option key={supplier._id} value={supplier._id}>
                        {supplier.name}
                      </option>
                  ))}
                </select>
              </label>

              <label>
                Usual order amount
                <span className="input-with-unit">
                <input name="reorderQuantity" type="number" step="any" min="0" value={form.reorderQuantity} onChange={handleChange} />
                <span>{form.stockUnit}</span>
              </span>
              </label>
            </div>
          </details>

          {error && <p className="error">{error}</p>}

          <div className="form-actions">
            <button type="button" className="secondary-button" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? "Saving..." : isEditing ? "Save changes" : "Create stock item"}
            </button>
          </div>
        </form>
      </section>
  );
}

export default CreateStockItemForm;