import {useAuth} from "../context/AuthContext.jsx";
import { useTableControls } from "../hooks/useTableControls";
import { TableControls, Pagination } from "../components/TableControls";

const STATUS_ORDER = { negative: 0, low: 1, ok: 2 };
const byName = (a, b) => a.name.localeCompare(b.name);

function StockItemsView({ stockItems, onStockItemClick, onAddStockItem, onEditStockItem, onDeleteStockItem, isFormOpen }) {
 const {role} = useAuth();
 const isOwner = role === 'owner';
    const controls = useTableControls(stockItems, {
        getSearchText: (item) => `${item.name} ${item.category}`,
        filters: {
            all: { label: "All", test: () => true },
            attention: { label: "Low or out", test: (item) => item.stockStatus !== "ok" },
        },
        sortOptions: {
            attention: {
                label: "Needs attention first",
                compare: (a, b) => STATUS_ORDER[a.stockStatus] - STATUS_ORDER[b.stockStatus] || byName(a, b),
            },
            name: { label: "Name A–Z", compare: byName },
            category: { label: "Category", compare: (a, b) => a.category.localeCompare(b.category) || byName(a, b) },
        },
    });
  return (
      <section className="panel stock-table-panel">
        <div className="panel-header">
          <div>
            <h2>All Stock Items</h2>
            <p className="panel-subtitle">Click an item to view movement history.</p>
          </div>

          <div className="panel-actions">
            <span>{stockItems.length}</span>
              {isOwner && !isFormOpen && (
                  <button className="primary-button" onClick={onAddStockItem}>
                      Add Stock Item
                  </button>
              )}
          </div>
        </div>
          <TableControls controls={controls} placeholder="Search stock..." />
        <div className="table-wrapper">
          <table className="stock-table">
            <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>Type</th>
              <th>Current Stock</th>
              <th>Minimum</th>
              <th>Status</th>
              {isOwner && (
              <th></th>
              )}
            </tr>
            </thead>
              {controls.total === 0 && <p className="muted">No items match.</p>}
            <tbody>
            {controls.rows.map((item) => (
                <tr key={item._id} onClick={() => onStockItemClick(item)}>
                  <td>
                    <strong>{item.name}</strong>
                  </td>
                  <td>{item.category}</td>
                  <td>{item.stockType.replace("_", " ")}</td>
                  <td>
                    {item.currentStock} {item.stockUnit}
                  </td>
                  <td>
                    {item.minStockLevel} {item.stockUnit}
                  </td>
                  <td>
                  <span className={`status-badge ${item.stockStatus}`}>
                    {item.stockStatus}
                  </span>
                  </td>
                  {isOwner && (
                  <td className="table-actions">
                    <button
                        className="link-button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onEditStockItem(item);
                        }}
                    >
                      Edit
                    </button>
                    <button
                        className="link-button danger"
                        onClick={(event) => {
                          event.stopPropagation();
                          onDeleteStockItem(item);
                        }}
                    >
                      Delete
                    </button>
                  </td>
                  )}
                </tr>
            ))}
            </tbody>
          </table>
        </div>
          <Pagination controls={controls} />
      </section>
  );
}

export default StockItemsView;