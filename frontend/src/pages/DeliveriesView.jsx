import { useTableControls } from "../hooks/useTableControls";
import { TableControls, Pagination } from "../components/TableControls";
import { formatDate } from "../utils/format";

const newest = (a, b) => new Date(b.deliveryDate) - new Date(a.deliveryDate);

function DeliveriesView({ deliveries, onAddDelivery }) {
  const controls = useTableControls(deliveries, {
    getSearchText: (delivery) =>
        [
          delivery.supplier?.name,
          delivery.invoiceNumber,
          ...delivery.items.map((item) => item.stockItem?.name),
        ].join(" "),
    sortOptions: {
      newest: { label: "Newest first", compare: newest },
      oldest: { label: "Oldest first", compare: (a, b) => newest(b, a) },
    },
  });
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
      <TableControls controls={controls} placeholder="..." />
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
            {controls.rows.map((delivery) => (
              <tr key={delivery._id}>
                <td>{formatDate(delivery.deliveryDate)}</td>
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
      <Pagination controls={controls} />
    </section>
  );

}

export default DeliveriesView;
