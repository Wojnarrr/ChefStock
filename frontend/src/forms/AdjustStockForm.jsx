import { useState } from "react";
import { STOCK_ADJUSTMENT_REASONS } from "../constants/options";

function AdjustStockForm({ item, onSubmit, onCancel }) {
    const [formData, setFormData] = useState({
        newStock: item.currentStock,
        reason: "stock_count_correction",
        notes: "",
    });

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((currentFormData) => ({ ...currentFormData, [name]: value }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        onSubmit({
            stockItem: item._id,
            newStock: Number(formData.newStock),
            reason: formData.reason,
            notes: formData.notes,
        });
    };

    return (
        <div className="inline-form-panel">
            <h3>Adjust Stock</h3>
            <p className="panel-subtitle">
                App currently estimates {item.currentStock} {item.stockUnit}
            </p>

            <form className="stock-form" onSubmit={handleSubmit}>
                <div className="form-grid">
                    <label>
                        New Stock Count
                        <input
                            name="newStock"
                            type="number"
                            step="0.001"
                            value={formData.newStock}
                            onChange={handleChange}
                            required
                        />
                    </label>

                    <label>
                        Reason
                        <select name="reason" value={formData.reason} onChange={handleChange} required>
                            {STOCK_ADJUSTMENT_REASONS.map((reason) => (
                                <option key={reason.value} value={reason.value}>
                                    {reason.label}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                <label className="full-width-label">
                    Notes
                    <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        placeholder="Optional"
                        rows="2"
                    />
                </label>

                <div className="form-actions">
                    <button type="button" className="secondary-button" onClick={onCancel}>
                        Cancel
                    </button>
                    <button type="submit" className="primary-button">
                        Save Adjustment
                    </button>
                </div>
            </form>
        </div>
    );
}

export default AdjustStockForm;