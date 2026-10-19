import { useState } from "react";
import { formatEuro } from "../utils/format";
import { useSubmit } from "../hooks/useSubmit";

// Today as "YYYY-MM-DD" in the user's own timezone (toISOString would use UTC,
// which gives yesterday's date just after midnight in Ireland).
const getToday = () => new Date().toLocaleDateString("en-CA");

const ISSUE_OPTIONS = [
  { value: "damaged", label: "Damaged" },
  { value: "missing", label: "Missing / short" },
  { value: "wrong_item", label: "Wrong item" },
  { value: "rejected", label: "Rejected (quality)" },
];

// A fresh checklist line for one stock item. The price starts at what you
// paid last time, so usually you only change it if the invoice says otherwise.
const createLine = (item) => ({
  checked: false,
  quantity: "",
  unitCost: item.lastUnitCost != null ? String(item.lastUnitCost) : "",
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

// One stock item on the checklist: tick it, say how many, check the price.
function ChecklistRow({ item, line, onChange, onToggle }) {
  const lineTotal = line.checked ? getLineTotal(line) : null;

  return (
      <div className={`checklist-row ${line.checked ? "checked" : ""}`}>
        <div className="checklist-main">
          <label className="checklist-tick">
            <input type="checkbox" checked={line.checked} onChange={(event) => onToggle(event.target.checked)} />
            <span>
            <strong>{item.name}</strong>
              {item.lastUnitCost != null && (
                  <small>
                    Last paid {formatEuro(item.lastUnitCost)} / {item.stockUnit}
                  </small>
              )}
          </span>
          </label>

          <span className="input-with-unit">
          <input
              type="number"
              step="any"
              min={line.checked ? "0.001" : "0"}
              value={line.quantity}
              // Typing a quantity ticks the row; clearing it unticks it.
              onChange={(event) =>
                  onChange({ quantity: event.target.value, checked: Number(event.target.value) > 0 })
              }
              placeholder="Qty"
              aria-label={`How many ${item.name}`}
              required={line.checked}
          />
          <span>{item.stockUnit}</span>
        </span>

          <input
              type="number"
              step="0.01"
              min="0"
              value={line.unitCost}
              onChange={(event) => onChange({ unitCost: event.target.value })}
              placeholder="€ each"
              aria-label={`Price per ${item.stockUnit} of ${item.name}, ex VAT`}
              disabled={!line.checked}
          />

          <span className="checklist-total">{lineTotal != null ? formatEuro(lineTotal) : ""}</span>
        </div>

        {line.checked && (
            <label className="checkbox-label">
              <input
                  type="checkbox"
                  checked={line.hasProblem}
                  onChange={(event) => onChange({ hasProblem: event.target.checked })}
              />
              Problem with this item
            </label>
        )}

        {line.checked && line.hasProblem && (
            <div className="delivery-line-grid delivery-problem">
              <label>
                What happened?
                <select value={line.issueType} onChange={(event) => onChange({ issueType: event.target.value })}>
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
                  type="number"
                  step="any"
                  min="0"
                  max={line.quantity}
                  value={line.quantityKept}
                  onChange={(event) => onChange({ quantityKept: event.target.value })}
                  required
              />
              <span>{item.stockUnit}</span>
            </span>
              </label>

              <label>
                Note
                <input
                    value={line.issueNotes}
                    onChange={(event) => onChange({ issueNotes: event.target.value })}
                    placeholder="e.g. 2 cans dented"
                />
              </label>
            </div>
        )}
      </div>
  );
}

function CreateDeliveryForm({ suppliers, stockItems, onSubmit, onCancel }) {
  const [supplier, setSupplier] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(getToday);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [notes, setNotes] = useState("");

  // One line per stock item, keyed by the item's id: { [itemId]: line }.
  // An item only gets an entry once you touch it.
  const [lines, setLines] = useState({});
  // Items added with the search box that this supplier doesn't usually bring.
  const [extraIds, setExtraIds] = useState([]);
  const [search, setSearch] = useState("");

  const { submit, error, saving } = useSubmit(onSubmit);

  const findStockItem = (id) => stockItems.find((item) => item._id === id);

  // The checklist: what this supplier usually brings, then anything you added.
  const usualItems = stockItems.filter((item) => supplier && item.preferredSupplier?._id === supplier);
  const extraItems = extraIds.map(findStockItem).filter(Boolean);
  const checklist = [...usualItems, ...extraItems];

  const lineFor = (item) => lines[item._id] ?? createLine(item);

  const updateLine = (item, changes) => {
    setLines((current) => {
      const line = { ...(current[item._id] ?? createLine(item)), ...changes };

      // Opening the problem section starts "kept" at the full amount,
      // so you only change it if something was short or sent back.
      if (changes.hasProblem && line.quantityKept === "") {
        line.quantityKept = line.quantity;
      }

      return { ...current, [item._id]: line };
    });
  };

  // Ticking an item fills in your usual order amount, so most of the
  // time ticking is all you need to do.
  const handleToggle = (item, checked) => {
    const line = lineFor(item);
    const usualAmount = item.reorderQuantity > 0 ? String(item.reorderQuantity) : "1";

    updateLine(item, {
      checked,
      quantity: checked && line.quantity === "" ? usualAmount : line.quantity,
    });
  };

  // A different supplier means a different checklist, so start again.
  const handleSupplierChange = (event) => {
    setSupplier(event.target.value);
    setLines({});
    setExtraIds([]);
    setSearch("");
  };

  const addExtraItem = (item) => {
    setExtraIds((current) => [...current, item._id]);
    handleToggle(item, true);
    setSearch("");
  };

  // Search everything you buy in that isn't on the checklist already.
  const listedIds = new Set(checklist.map((item) => item._id));
  const term = search.trim().toLowerCase();
  const searchResults = term
      ? stockItems
          .filter(
              (item) =>
                  item.stockType !== "prepared" &&
                  !listedIds.has(item._id) &&
                  item.name.toLowerCase().includes(term)
          )
          .slice(0, 6)
      : [];

  const checkedItems = checklist.filter((item) => lineFor(item).checked);
  const lineTotals = checkedItems.map((item) => getLineTotal(lineFor(item))).filter((total) => total !== null);
  const deliveryTotal = lineTotals.reduce((sum, total) => sum + total, 0);

  const handleSubmit = (event) => {
    event.preventDefault();

    submit({
      supplier,
      deliveryDate,
      invoiceNumber,
      notes,
      // Same shape as the old form sent, so DeliveriesPage doesn't need to change.
      items: checkedItems.map((item) => ({ stockItem: item._id, ...lineFor(item) })),
    });
  };

  return (
      <section className="panel form-panel">
        <div className="panel-header">
          <div>
            <h2>Add delivery</h2>
            <p className="panel-subtitle">Tick off what arrived against the invoice.</p>
          </div>
        </div>

        {suppliers.length === 0 && (
            <p className="error">No suppliers yet. Add a supplier before recording deliveries.</p>
        )}

        <form className="stock-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              Supplier
              <select value={supplier} onChange={handleSupplierChange} required>
                <option value="" disabled>
                  Choose supplier…
                </option>
                {suppliers.map((option) => (
                    <option key={option._id} value={option._id}>
                      {option.name}
                    </option>
                ))}
              </select>
            </label>

            <label>
              Delivered on
              <input
                  type="date"
                  max={getToday()}
                  value={deliveryDate}
                  onChange={(event) => setDeliveryDate(event.target.value)}
                  required
              />
            </label>
          </div>

          {!supplier ? (
              <p className="muted">Choose a supplier to see what they usually bring.</p>
          ) : (
              <>
                <h3 className="form-section-title">What arrived?</h3>

                {usualItems.length === 0 && (
                    <p className="field-hint">
                      Nothing is set to come from this supplier yet. Search below, or set "Preferred
                      supplier" on your stock items so they're listed here next time.
                    </p>
                )}

                <div className="delivery-checklist">
                  {checklist.map((item) => (
                      <ChecklistRow
                          key={item._id}
                          item={item}
                          line={lineFor(item)}
                          onToggle={(checked) => handleToggle(item, checked)}
                          onChange={(changes) => updateLine(item, changes)}
                      />
                  ))}
                </div>

                <div className="checklist-search">
                  <input
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Something else on the invoice? Search your stock…"
                      aria-label="Add another item"
                  />

                  {searchResults.length > 0 && (
                      <ul className="search-results">
                        {searchResults.map((item) => (
                            <li key={item._id}>
                              <button type="button" className="link-button" onClick={() => addExtraItem(item)}>
                                + {item.name} <span className="muted">({item.stockUnit})</span>
                              </button>
                            </li>
                        ))}
                      </ul>
                  )}

                  {term && searchResults.length === 0 && (
                      <p className="field-hint">No stock item matches "{search}". Add it in Stock Items first.</p>
                  )}
                </div>
              </>
          )}

          {checkedItems.length > 0 && (
              <p className="delivery-total">
                {checkedItems.length} {checkedItems.length === 1 ? "item" : "items"}
                {lineTotals.length > 0 && (
                    <>
                      {" "}· total (ex VAT): <strong>{formatEuro(deliveryTotal)}</strong>
                    </>
                )}
              </p>
          )}

          <details className="more-options">
            <summary>Invoice number and notes</summary>
            <div className="form-grid">
              <label>
                Invoice number
                <input
                    value={invoiceNumber}
                    onChange={(event) => setInvoiceNumber(event.target.value)}
                    placeholder="e.g. INV-123"
                />
              </label>

              <label>
                Notes
                <input
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
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
            <button type="submit" className="primary-button" disabled={saving || checkedItems.length === 0}>
              {saving ? "Saving..." : "Save delivery"}
            </button>
          </div>
        </form>
      </section>
  );
}

export default CreateDeliveryForm;
