import { useState } from "react";
import { formatEuro } from "../utils/format";
// Cost of one line on the invoice. You pay for what you accepted, not what
// arrived (rejected items get credited). Returns null if no price was entered.
const getLineTotal = (item) => {
  if (item.unitCost === "") return null;
  return Number(item.unitCost) * Number(item.quantityAccepted || 0);
};

function CreateDeliveryForm({ suppliers, stockItems, onSubmit, onCancel }) {
  const createEmptyDeliveryItem = () => ({
    stockItem: stockItems[0]?._id || "",
    quantityReceived: "1",
    quantityAccepted: "1",
    batchNumber: "",
    expiryDate: "",
    issueType: "none",
    issueNotes: "",
    unitCost: "",
  });

  const [formData, setFormData] = useState({
    supplier: suppliers[0]?._id || "",
    invoiceNumber: "",
    notes: "",
    items: [createEmptyDeliveryItem()],
  });

  const handleMainChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }));
  };

  const handleItemChange = (index, event) => {
    const { name, value } = event.target;

    setFormData((currentFormData) => {
      const updatedItems = currentFormData.items.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        return {
          ...item,
          [name]: value,
        };
      });

      return {
        ...currentFormData,
        items: updatedItems,
      };
    });
  };

  const handleAddItem = () => {
    setFormData((currentFormData) => ({
      ...currentFormData,
      items: [...currentFormData.items, createEmptyDeliveryItem()],
    }));
  };

  const handleRemoveItem = (index) => {
    setFormData((currentFormData) => {
      if (currentFormData.items.length === 1) {
        return currentFormData;
      }

      return {
        ...currentFormData,
        items: currentFormData.items.filter((_, itemIndex) => itemIndex !== index),
      };
    });
  };

  const lineTotals = formData.items.map(getLineTotal).filter((total) => total !== null);
  const deliveryTotal = lineTotals.reduce((sum, total) => sum + total, 0);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(formData);
  };

  return (
    <section className="panel form-panel">
      <div className="panel-header">
        <div>
          <h2>Add Delivery</h2>
          <p className="panel-subtitle">
            Record one supplier delivery with multiple stock items.
          </p>
        </div>
      </div>
      {suppliers.length === 0 && (
        <p className="error">
          No suppliers found. Create a supplier first before recording deliveries.
        </p>
      )}
      <form className="stock-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label>
            Supplier
            <select
              name="supplier"
              value={formData.supplier}
              onChange={handleMainChange}
              required
            >
              {suppliers.map((supplier) => (
                <option key={supplier._id} value={supplier._id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Invoice Number
            <input
              name="invoiceNumber"
              value={formData.invoiceNumber}
              onChange={handleMainChange}
              placeholder="e.g. INV-123"
            />
          </label>
        </div>

        <div className="delivery-items-header">
          <div>
            <h3>Delivery Items</h3>
            <p className="panel-subtitle">Add each item from the supplier invoice.</p>
          </div>

          <button type="button" className="primary-button" onClick={handleAddItem}>
            Add Item
          </button>
        </div>

        <div className="delivery-items-list">
          {formData.items.map((deliveryItem, index) => {
            const selectedStockItem = stockItems.find(
              (item) => item._id === deliveryItem.stockItem
            );

            return (
              <div className="delivery-item-card" key={index}>
                <div className="delivery-item-card-header">
                  <h4>Item {index + 1}</h4>

                  {formData.items.length > 1 && (
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
                    Stock Item
                    <select
                      name="stockItem"
                      value={deliveryItem.stockItem}
                      onChange={(event) => handleItemChange(index, event)}
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
                    Unit
                    <input value={selectedStockItem?.stockUnit || ""} disabled readOnly />
                  </label>

                  <label>
                    Quantity Received
                    <input
                      name="quantityReceived"
                      type="number"
                      step="0.001"
                      value={deliveryItem.quantityReceived}
                      onChange={(event) => handleItemChange(index, event)}
                      required
                    />
                  </label>

                  <label>
                    Quantity Accepted
                    <input
                      name="quantityAccepted"
                      type="number"
                      step="0.001"
                      value={deliveryItem.quantityAccepted}
                      onChange={(event) => handleItemChange(index, event)}
                      required
                    />
                  </label>

                  <label>
                    Cost per {selectedStockItem?.stockUnit || "unit"} (€, ex VAT)
                    <input
                        name="unitCost"
                        type="number"
                        step="0.01"
                        min="0"
                        value={deliveryItem.unitCost}
                        onChange={(event) => handleItemChange(index, event)}
                        placeholder="Optional"
                    />
                    {getLineTotal(deliveryItem) !== null && (
                        <span className="field-hint">
                        Line total: {formatEuro(getLineTotal(deliveryItem))}
                      </span>
                    )}
                  </label>

                  <label>
                    Batch Number
                    <input
                      name="batchNumber"
                      value={deliveryItem.batchNumber}
                      onChange={(event) => handleItemChange(index, event)}
                      placeholder="Optional"
                    />
                  </label>

                  <label>
                    Expiry Date
                    <input
                      name="expiryDate"
                      type="date"
                      value={deliveryItem.expiryDate}
                      onChange={(event) => handleItemChange(index, event)}
                    />
                  </label>

                  <label>
                    Issue Type
                    <select
                      name="issueType"
                      value={deliveryItem.issueType}
                      onChange={(event) => handleItemChange(index, event)}
                    >
                      <option value="none">None</option>
                      <option value="missing">Missing</option>
                      <option value="extra">Extra</option>
                      <option value="damaged">Damaged</option>
                      <option value="wrong_item">Wrong Item</option>
                      <option value="wrong_quantity">Wrong Quantity</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </label>

                  <label>
                    Issue Notes
                    <input
                      name="issueNotes"
                      value={deliveryItem.issueNotes}
                      onChange={(event) => handleItemChange(index, event)}
                      placeholder="Optional"
                    />
                  </label>
                </div>
              </div>
            );
          })}
        </div>
        {lineTotals.length > 0 && (
            <p className="delivery-total">
              Delivery total (ex VAT): <strong>{formatEuro(deliveryTotal)}</strong>
            </p>
        )}
        <label className="full-width-label">
          Delivery Notes
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleMainChange}
            placeholder="Optional delivery notes"
            rows="3"
          />
        </label>

        <div className="form-actions">
          <button type="button" className="secondary-button" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="primary-button">
            Create Delivery
          </button>
        </div>
      </form>
    </section>
  );
}

export default CreateDeliveryForm;
