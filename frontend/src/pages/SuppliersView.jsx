function SuppliersView({ suppliers, onAddSupplier }) {
  return (
    <section className="panel stock-table-panel">
      <div className="panel-header">
        <div>
          <h2>Suppliers</h2>
          <p className="panel-subtitle">
            Suppliers used for deliveries and ordering.
          </p>
        </div>

        <div className="panel-actions">
          <span>{suppliers.length}</span>
          <button className="primary-button" onClick={onAddSupplier}>
            Add Supplier
          </button>
        </div>
      </div>

      {suppliers.length === 0 ? (
        <p className="muted">No suppliers added yet.</p>
      ) : (
        <div className="table-wrapper">
          <table className="stock-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Delivery Days</th>
                <th>Notes</th>
              </tr>
            </thead>

            <tbody>
              {suppliers.map((supplier) => (
                <tr key={supplier._id}>
                  <td>
                    <strong>{supplier.name}</strong>
                  </td>
                  <td>{supplier.contactPerson || "—"}</td>
                  <td>{supplier.phone || "—"}</td>
                  <td>{supplier.email || "—"}</td>
                  <td>{supplier.deliveryDays?.join(", ") || "—"}</td>
                  <td>{supplier.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default SuppliersView;
