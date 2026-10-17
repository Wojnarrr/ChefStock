import { useTableControls } from "../hooks/useTableControls";
import { TableControls, Pagination } from "../components/TableControls";
function SuppliersView({ suppliers, onAddSupplier, onEditSupplier, onDeleteSupplier }) {

  const controls = useTableControls(suppliers, {
    getSearchText: (supplier) => `${supplier.name} ${supplier.contactPerson ?? ""}`,
    sortOptions: {
      name: { label: "Name A–Z", compare: (a, b) => a.name.localeCompare(b.name) },
    },
  });
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
      <TableControls controls={controls} placeholder="..." />
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
              <th></th>
            </tr>
            </thead>

            <tbody>
            {controls.rows.map((supplier) => (
                <tr key={supplier._id}>
                  <td><strong>{supplier.name}</strong></td>
                  <td>{supplier.contactPerson || "—"}</td>
                  <td>{supplier.phone || "—"}</td>
                  <td>{supplier.email || "—"}</td>
                  <td>{supplier.deliveryDays?.join(", ") || "—"}</td>
                  <td>{supplier.notes || "—"}</td>
                  <td className="table-actions">
                    <button className="link-button" onClick={() => onEditSupplier(supplier)}>
                      Edit
                    </button>
                    <button className="link-button danger" onClick={() => onDeleteSupplier(supplier)}>
                      Delete
                    </button>
                  </td>
                </tr>
            ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination controls={controls} />
    </section>
  );
}

export default SuppliersView;
