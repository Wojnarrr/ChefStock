function DeliveriesView({ deliveries, onAddDelivery }) {
  return (
    <section className="panel stock-table-panel">
      <div className="panel-header">
        <div>
          <h2>Deliveries</h2>
          <p className="panel-subtitle">
            Stock received from suppliers and added into inventory.
          </p>
        </div>

        <div className="panel-actions">
          <span>{deliveries.length}</span>
          <button className="primary-button" onClick={onAddDelivery}>
            Add Delivery
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="stock-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Supplier</th>
              <th>Invoice</th>
              <th>Items</th>
              <th>Notes</th>
            </tr>
          </thead>

          <tbody>
            {deliveries.map((delivery) => (
              <tr key={delivery._id}>
                <td>{new Date(delivery.deliveryDate).toLocaleDateString()}</td>
                <td>{delivery.supplier?.name || "Unknown supplier"}</td>
                <td>{delivery.invoiceNumber || "—"}</td>
                <td>
                  {delivery.items.map((item) => (
                    <div key={item.stockItem?._id || item.stockItem}>
                      <strong>{item.stockItem?.name || "Unknown item"}</strong>{" "}
                      +{item.quantityAccepted} {item.unit}
                    </div>
                  ))}
                </td>
                <td>{delivery.notes || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default DeliveriesView;
