import { useState } from "react";
import { formatEuro } from "../utils/format";
import { useSubmit } from "../hooks/useSubmit";
// Today as "YYYY-MM-DD" in the user's own timezone (toISOString would use UTC,
// which gives yesterday's date just after midnight in Ireland).
const getToday = () => new Date().toLocaleDateString("en-CA");
const { submit, error, saving } = useSubmit(onSubmit);

const ISSUE_OPTIONS = [
  { value: "damaged", label: "Damaged" },
  { value: "missing", label: "Missing / short" },
  { value: "wrong_item", label: "Wrong item" },
  { value: "rejected", label: "Rejected (quality)" },
];

const createEmptyLine = () => ({
  stockItem: "",
  quantity: "1",
  unitCost: "",
  hasProblem: false,
  quantityKept: "",
  issueType: "damaged",
  issueNotes: "",
});

// What you keep is what you pay for. With no problem, you keep everything.
const getKeptQuantity = (line) =>
    line.hasProblem ? Number(line.quantityKept || 0) : Number(line.quantity || 0);

// Returns null if no price was entered (not 0, which would mean "free").
const getLineTotal = (line) => {
  if (line.unitCost === "") return null;
  return Number(line.unitCost) * getKeptQuantity(line);
};

function CreateDeliveryForm({ suppliers, stockItems, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    supplier: "",
    deliveryDate: getToday(),
    invoiceNumber: "",
    notes: "",
    items: [createEmptyLine()],
  });

  const findStockItem = (id) => stockItems.find((item) => item._id === id);

  // Items this supplier usually brings go at the top of the dropdown.
  const fromThisSupplier = stockItems.filter(
      (item) => formData.supplier && item.preferredSupplier?._id === formData.supplier
  );
  const otherItems = stockItems.filter((item) => !fromThisSupplier.includes(item));

  const handleMainChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  // Updates one field on one line. Picking an item also fills in the
  // last price paid, so most of the time you don't need to type it.
  const updateLine = (index, changes) => {
    setFormData((current) => ({
      ...current,
      items: current.items.map((line, lineIndex) => {
        if (lineIndex !== index) return line;

        const next = { ...line, ...changes };

        if ("stockItem" in changes) {
          const lastCost = findStockItem(changes.stockItem)?.lastUnitCost;
          next.unitCost = lastCost != null ? String(lastCost) : "";
        }

        // Opening the problem section starts "kept" at the full amount,
        // so you only change it if something was short or sent back.
        if (changes.hasProblem && line.quantityKept === "") {
          next.quantityKept = line.quantity;
        }

        return next;
      }),
    }));
  };

  const handleLineChange = (index, event) => {
    const { name, value, type, checked } = event.target;
    updateLine(index, { [name]: type === "checkbox" ? checked : value });
  };

  const handleAddLine = () => {
    setFormData((current) => ({ ...current, items: [...current.items, createEmptyLine()] }));
  };

  const handleRemoveLine = (index) => {
    setFormData((current) => ({
      ...current,
      items: current.items.filter((_, lineIndex) => lineIndex !== index),
    }));
  };

  const lineTotals = formData.items.map(getLineTotal).filter((total) => total !== null);
  const deliveryTotal = lineTotals.reduce((sum, total) => sum + total, 0);

  const handleSubmit = (event) => {
    event.preventDefault();
    submit(formData);
  };

  const renderOption = (item) => (
      <option key={item._id} value={item._id}>
        {item.name} ({item.stockUnit})
      </option>
  );

  return (
      <section className="panel form-panel">
        <div className="panel-header">
          <div>
            <h2>Add delivery</h2>
            <p className="panel-subtitle">Go down the invoice and add each line.</p>
          </div>
        </div>

        {suppliers.length === 0 && (
            <p className="error">No suppliers yet. Add a supplier before recording deliveries.</p>
        )}

        <form className="stock-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              Supplier
              <select name="supplier" value={formData.supplier} onChange={handleMainChange} required>
                <option value="" disabled>
                  Choose supplier…
                </option>
                {suppliers.map((supplier) => (
                    <option key={supplier._id} value={supplier._id}>
                      {supplier.name}
                    </option>
                ))}
              </select>
            </label>

            <label>
              Delivered on
              <input
                  name="deliveryDate"
                  type="date"
                  max={getToday()}
                  value={formData.deliveryDate}
                  onChange={handleMainChange}
                  required
              />
            </label>
          </div>

          <div className="delivery-lines">
            {formData.items.map((line, index) => {
              const selected = findStockItem(line.stockItem);
              const unit = selected?.stockUnit || "units";
              const lineTotal = getLineTotal(line);

              return (
                  <div className="delivery-line" key={index}>
                    <div className="delivery-line-grid">
                      <label>
                        Item
                        <select
                            name="stockItem"
                            value={line.stockItem}
                            onChange={(event) => handleLineChange(index, event)}
                            required
                        >
                          <option value="" disabled>
                            Choose item…
                          </option>
                          {fromThisSupplier.length > 0 ? (
                              <>
                                <optgroup label="Usually from this supplier">
                                  {fromThisSupplier.map(renderOption)}
                                </optgroup>
                                <optgroup label="Everything else">{otherItems.map(renderOption)}</optgroup>
                              </>
                          ) : (
                              stockItems.map(renderOption)
                          )}
                        </select>
                      </label>

                      <label>
                        Quantity
                        <span className="input-with-unit">
                      <input
                          name="quantity"
                          type="number"
                          step="any"
                          min="0.001"
                          value={line.quantity}
                          onChange={(event) => handleLineChange(index, event)}
                          required
                      />
                      <span>{unit}</span>
                    </span>
                      </label>

                      <label>
                        € per {unit} (ex VAT)
                        <input
                            name="unitCost"
                            type="number"
                            step="0.01"
                            min="0"
                            value={line.unitCost}
                            onChange={(event) => handleLineChange(index, event)}
                            placeholder="Optional"
                        />
                        {lineTotal !== null && (
                            <span className="field-hint">Line total: {formatEuro(lineTotal)}</span>
                        )}
                      </label>

                      {formData.items.length > 1 && (
                          <button
                              type="button"
                              className="link-button danger delivery-line-remove"
                              onClick={() => handleRemoveLine(index)}
                              aria-label={`Remove line ${index + 1}`}
                          >
                            Remove
                          </button>
                      )}
                    </div>

                    <label className="checkbox-label">
                      <input
                          type="checkbox"
                          name="hasProblem"
                          checked={line.hasProblem}
                          onChange={(event) => handleLineChange(index, event)}
                      />
                      Problem with this item
                    </label>

                    {line.hasProblem && (
                        <div className="delivery-line-grid delivery-problem">
                          <label>
                            What happened?
                            <select
                                name="issueType"
                                value={line.issueType}
                                onChange={(event) => handleLineChange(index, event)}
                            >
                              {ISSUE_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                              ))}
                            </select>
                          </label>

                          <label>
                            How many did you keep?
                            <span className="input-with-unit">
                        <input
                            name="quantityKept"
                            type="number"
                            step="any"
                            min="0"
                            max={line.quantity}
                            value={line.quantityKept}
                            onChange={(event) => handleLineChange(index, event)}
                            required
                        />
                        <span>{unit}</span>
                      </span>
                          </label>

                          <label>
                            Note
                            <input
                                name="issueNotes"
                                value={line.issueNotes}
                                onChange={(event) => handleLineChange(index, event)}
                                placeholder="e.g. 2 cans dented"
                            />
                          </label>
                        </div>
                    )}
                  </div>
              );
            })}
          </div>

          <button type="button" className="secondary-button" onClick={handleAddLine}>
            + Add another item
          </button>

          {lineTotals.length > 0 && (
              <p className="delivery-total">
                Delivery total (ex VAT): <strong>{formatEuro(deliveryTotal)}</strong>
              </p>
          )}

          <details className="more-options">
            <summary>Invoice number and notes</summary>
            <div className="form-grid">
              <label>
                Invoice number
                <input
                    name="invoiceNumber"
                    value={formData.invoiceNumber}
                    onChange={handleMainChange}
                    placeholder="e.g. INV-123"
                />
              </label>

              <label>
                Notes
                <input
                    name="notes"
                    value={formData.notes}
                    onChange={handleMainChange}
                    placeholder="e.g. Driver was late"
                />
              </label>
            </div>
          </details>

          {error && <p className="error">{error}</p>}

          <div className="form-actions">
            <button type="button" className="secondary-button" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? "Saving..." : "Save delivery"}
            </button>
          </div>
        </form>
      </section>
  );
}

export default CreateDeliveryForm;
