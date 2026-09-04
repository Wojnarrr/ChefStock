import { useState } from "react";
import { DELIVERY_DAY_OPTIONS } from "../constants/options";

function CreateSupplierForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    deliveryDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    notes: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }));
  };

  const handleDeliveryDayToggle = (day) => {
    setFormData((currentFormData) => {
      const alreadySelected = currentFormData.deliveryDays.includes(day);

      return {
        ...currentFormData,
        deliveryDays: alreadySelected
          ? currentFormData.deliveryDays.filter((deliveryDay) => deliveryDay !== day)
          : [...currentFormData.deliveryDays, day],
      };
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(formData);
  };

  return (
    <section className="panel form-panel">
      <div className="panel-header">
        <div>
          <h2>Add Supplier</h2>
          <p className="panel-subtitle">
            Create a supplier that can be used when recording deliveries.
          </p>
        </div>
      </div>

      <form className="stock-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label>
            Supplier Name
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Dairy Supplier"
              required
            />
          </label>

          <label>
            Contact Person
            <input
              name="contactPerson"
              value={formData.contactPerson}
              onChange={handleChange}
              placeholder="e.g. Orders Team"
            />
          </label>

          <label>
            Phone
            <input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Optional"
            />
          </label>

          <label>
            Email
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Optional"
            />
          </label>
        </div>

        <div className="delivery-days-section">
          <h3>Delivery Days</h3>

          <div className="day-checkbox-grid">
            {DELIVERY_DAY_OPTIONS.map((day) => (
              <label key={day} className="day-checkbox">
                <input
                  type="checkbox"
                  checked={formData.deliveryDays.includes(day)}
                  onChange={() => handleDeliveryDayToggle(day)}
                />
                {day}
              </label>
            ))}
          </div>
        </div>

        <label className="full-width-label">
          Notes
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="e.g. No Sunday deliveries"
            rows="3"
          />
        </label>

        <div className="form-actions">
          <button type="button" className="secondary-button" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="primary-button">
            Create Supplier
          </button>
        </div>
      </form>
    </section>
  );
}

export default CreateSupplierForm;
