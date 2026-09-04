import { useState } from "react";

function CreatePrepBatchForm({ stockItems, onSubmit, onCancel }) {
  const createEmptyInputItem = () => ({
    stockItem: stockItems[0]?._id || "",
    quantityUsed: "1",
  });

  const createEmptyOutputItem = () => ({
    stockItem: stockItems[0]?._id || "",
    quantityProduced: "1",
  });

  const [formData, setFormData] = useState({
    inputItems: [createEmptyInputItem()],
    outputItems: [createEmptyOutputItem()],
    notes: "",
  });

  const handleInputItemChange = (index, event) => {
    const { name, value } = event.target;

    setFormData((currentFormData) => {
      const updatedInputItems = currentFormData.inputItems.map((item, itemIndex) => {
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
        inputItems: updatedInputItems,
      };
    });
  };

  const handleOutputItemChange = (index, event) => {
    const { name, value } = event.target;

    setFormData((currentFormData) => {
      const updatedOutputItems = currentFormData.outputItems.map((item, itemIndex) => {
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
        outputItems: updatedOutputItems,
      };
    });
  };

  const handleAddInputItem = () => {
    setFormData((currentFormData) => ({
      ...currentFormData,
      inputItems: [...currentFormData.inputItems, createEmptyInputItem()],
    }));
  };

  const handleAddOutputItem = () => {
    setFormData((currentFormData) => ({
      ...currentFormData,
      outputItems: [...currentFormData.outputItems, createEmptyOutputItem()],
    }));
  };

  const handleRemoveInputItem = (index) => {
    setFormData((currentFormData) => {
      if (currentFormData.inputItems.length === 1) {
        return currentFormData;
      }

      return {
        ...currentFormData,
        inputItems: currentFormData.inputItems.filter((_, itemIndex) => itemIndex !== index),
      };
    });
  };

  const handleRemoveOutputItem = (index) => {
    setFormData((currentFormData) => {
      if (currentFormData.outputItems.length === 1) {
        return currentFormData;
      }

      return {
        ...currentFormData,
        outputItems: currentFormData.outputItems.filter((_, itemIndex) => itemIndex !== index),
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
          <h2>Add Prep Batch</h2>
          <p className="panel-subtitle">
            Convert raw or delivered stock into prepared kitchen stock.
          </p>
        </div>
      </div>

      <form className="stock-form" onSubmit={handleSubmit}>
        <div className="delivery-items-header">
          <div>
            <h3>Input Items</h3>
            <p className="panel-subtitle">Items used up during prep.</p>
          </div>

          <button type="button" className="primary-button" onClick={handleAddInputItem}>
            Add Input
          </button>
        </div>

        <div className="delivery-items-list">
          {formData.inputItems.map((inputItem, index) => {
            const selectedStockItem = stockItems.find(
              (item) => item._id === inputItem.stockItem
            );

            return (
              <div className="delivery-item-card" key={index}>
                <div className="delivery-item-card-header">
                  <h4>Input {index + 1}</h4>

                  {formData.inputItems.length > 1 && (
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => handleRemoveInputItem(index)}
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
                      value={inputItem.stockItem}
                      onChange={(event) => handleInputItemChange(index, event)}
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
                    Quantity Used
                    <input
                      name="quantityUsed"
                      type="number"
                      step="0.001"
                      value={inputItem.quantityUsed}
                      onChange={(event) => handleInputItemChange(index, event)}
                      required
                    />
                  </label>

                  <label>
                    Unit
                    <input value={selectedStockItem?.stockUnit || ""} disabled readOnly />
                  </label>
                </div>
              </div>
            );
          })}
        </div>

        <div className="delivery-items-header">
          <div>
            <h3>Output Items</h3>
            <p className="panel-subtitle">Prepared items created from this prep.</p>
          </div>

          <button type="button" className="primary-button" onClick={handleAddOutputItem}>
            Add Output
          </button>
        </div>

        <div className="delivery-items-list">
          {formData.outputItems.map((outputItem, index) => {
            const selectedStockItem = stockItems.find(
              (item) => item._id === outputItem.stockItem
            );

            return (
              <div className="delivery-item-card" key={index}>
                <div className="delivery-item-card-header">
                  <h4>Output {index + 1}</h4>

                  {formData.outputItems.length > 1 && (
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => handleRemoveOutputItem(index)}
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
                      value={outputItem.stockItem}
                      onChange={(event) => handleOutputItemChange(index, event)}
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
                    Quantity Produced
                    <input
                      name="quantityProduced"
                      type="number"
                      step="0.001"
                      value={outputItem.quantityProduced}
                      onChange={(event) => handleOutputItemChange(index, event)}
                      required
                    />
                  </label>

                  <label>
                    Unit
                    <input value={selectedStockItem?.stockUnit || ""} disabled readOnly />
                  </label>
                </div>
              </div>
            );
          })}
        </div>

        <label className="full-width-label">
          Prep Notes
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleNotesChange}
            placeholder="e.g. Cooked veg for evening service"
            rows="3"
          />
        </label>

        <div className="form-actions">
          <button type="button" className="secondary-button" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="primary-button">
            Create Prep Batch
          </button>
        </div>
      </form>
    </section>
  );
}

export default CreatePrepBatchForm;
