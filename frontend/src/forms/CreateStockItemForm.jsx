import { useState } from "react";
import { STOCK_UNIT_OPTIONS } from "../constants/options";

function CreateStockItemForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: "",
    category: "ingredient",
    stockType: "raw",
    stockUnit: "pack",
    recipeUnit: "g",
    packType: "none",
    unitsPerStockUnit: "",
    estimatedUnitsPerStockUnit: "",
    currentStock: "0",
    minStockLevel: "0",
    reorderQuantity: "0",
    trackingPriority: "medium",
    requiresExpiryTracking: false,
    requiresBatchTracking: false,
  });

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: type === "checkbox" ? checked : value,
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
          <h2>Add Stock Item</h2>
          <p className="panel-subtitle">
            Create a new item that can be used in deliveries, prep, and recipes.
          </p>
        </div>
      </div>

      <form className="stock-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label>
            Name
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Garlic Dip"
              required
            />
          </label>

          <label>
            Category
            <select name="category" value={formData.category} onChange={handleChange}>
              <option value="ingredient">Ingredient</option>
              <option value="drink">Drink</option>
              <option value="packaging">Packaging</option>
              <option value="other">Other</option>
            </select>
          </label>

          <label>
            Stock Type
            <select name="stockType" value={formData.stockType} onChange={handleChange}>
              <option value="raw">Raw</option>
              <option value="prepared">Prepared</option>
              <option value="finished_product">Finished Product</option>
              <option value="non_edible">Non Edible</option>
            </select>
          </label>

          <label>
            Stock Unit
            <select name="stockUnit" value={formData.stockUnit} onChange={handleChange}>
              <UnitOptions />
            </select>
          </label>

          <label>
            Recipe Unit
            <select name="recipeUnit" value={formData.recipeUnit} onChange={handleChange}>
              <UnitOptions />
            </select>
          </label>

          <label>
            Pack Type
            <select name="packType" value={formData.packType} onChange={handleChange}>
              <option value="none">None</option>
              <option value="fixed">Fixed</option>
              <option value="variable">Variable</option>
            </select>
          </label>

          {formData.packType === "fixed" && (
            <label>
              Units Per Stock Unit
              <input
                name="unitsPerStockUnit"
                type="number"
                step="0.001"
                value={formData.unitsPerStockUnit}
                onChange={handleChange}
                placeholder="e.g. 1500"
                required
              />
            </label>
          )}

          {formData.packType === "variable" && (
            <label>
              Estimated Units Per Stock Unit
              <input
                name="estimatedUnitsPerStockUnit"
                type="number"
                step="0.001"
                value={formData.estimatedUnitsPerStockUnit}
                onChange={handleChange}
                placeholder="e.g. 10"
                required
              />
            </label>
          )}

          <label>
            Current Stock
            <input
              name="currentStock"
              type="number"
              step="0.001"
              value={formData.currentStock}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Minimum Stock Level
            <input
              name="minStockLevel"
              type="number"
              step="0.001"
              value={formData.minStockLevel}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Reorder Quantity
            <input
              name="reorderQuantity"
              type="number"
              step="0.001"
              value={formData.reorderQuantity}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Tracking Priority
            <select
              name="trackingPriority"
              value={formData.trackingPriority}
              onChange={handleChange}
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </label>
        </div>

        <div className="checkbox-row">
          <label>
            <input
              type="checkbox"
              name="requiresExpiryTracking"
              checked={formData.requiresExpiryTracking}
              onChange={handleChange}
            />
            Requires expiry tracking
          </label>

          <label>
            <input
              type="checkbox"
              name="requiresBatchTracking"
              checked={formData.requiresBatchTracking}
              onChange={handleChange}
            />
            Requires batch tracking
          </label>
        </div>

        <div className="form-actions">
          <button type="button" className="secondary-button" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="primary-button">
            Create Stock Item
          </button>
        </div>
      </form>
    </section>
  );
}

function UnitOptions() {
  return (
    <>
      {STOCK_UNIT_OPTIONS.map((unit) => (
        <option key={unit} value={unit}>
          {unit}
        </option>
      ))}
    </>
  );
}

export default CreateStockItemForm;
