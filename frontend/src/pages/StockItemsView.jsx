function StockItemsView({ stockItems, onStockItemClick, onAddStockItem, onEditStockItem, onDeleteStockItem }) {
  return (
      <section className="panel stock-table-panel">
        <div className="panel-header">
          <div>
            <h2>All Stock Items</h2>
            <p className="panel-subtitle">Click an item to view movement history.</p>
          </div>

          <div className="panel-actions">
            <span>{stockItems.length}</span>
            <button className="primary-button" onClick={onAddStockItem}>
              Add Stock Item
            </button>
          </div>
        </div>

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
              <th></th>
            </tr>
            </thead>

            <tbody>
            {stockItems.map((item) => (
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
                </tr>
            ))}
            </tbody>
          </table>
        </div>
      </section>
  );
}

export default StockItemsView;