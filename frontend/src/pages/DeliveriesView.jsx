import { useTableControls } from "../hooks/useTableControls";
import { TableControls, Pagination } from "../components/TableControls";
import { formatDate } from "../utils/format";
import { Fragment, useState } from "react";
import { formatDate, formatEuro } from "../utils/format";

// What a delivery cost, from the lines that have a price. null if none do.
const getDeliveryTotal = (delivery) => {
    const priced = delivery.items.filter((item) => item.unitCost != null);
    if (priced.length === 0) return null;
    return priced.reduce((sum, item) => sum + item.unitCost * item.quantityAccepted, 0);
};

const ISSUE_LABELS = {
    damaged: "Damaged",
    missing: "Missing / short",
    wrong_item: "Wrong item",
    rejected: "Rejected",
    extra: "Extra",
    wrong_quantity: "Wrong quantity",
};
const newest = (a, b) => new Date(b.deliveryDate) - new Date(a.deliveryDate);

function DeliveriesView({ deliveries, onAddDelivery }) {
    // The delivery whose lines are showing, or null.
    const [expandedId, setExpandedId] = useState(null);
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
              <th>Items</th>
              <th>Total (ex VAT)</th>
              <th>Invoice</th>
              <th></th>
          </tr>
          </thead>

          <tbody>
          {controls.rows.map((delivery) => {
              const isOpen = expandedId === delivery._id;
              const total = getDeliveryTotal(delivery);
              const problems = delivery.items.filter((item) => item.issueType && item.issueType !== "none").length;

              return (
                  <Fragment key={delivery._id}>
                      <tr className="clickable-row" onClick={() => setExpandedId(isOpen ? null : delivery._id)}>
                          <td>{formatDate(delivery.deliveryDate)}</td>
                          <td>
                              <strong>{delivery.supplier?.name || "Unknown supplier"}</strong>
                          </td>
                          <td>
                              {delivery.items.length} {delivery.items.length === 1 ? "item" : "items"}
                              {problems > 0 && (
                                  <span className="status-badge low">
              {problems} {problems === 1 ? "problem" : "problems"}
            </span>
                              )}
                          </td>
                          <td>{total == null ? "—" : formatEuro(total)}</td>
                          <td>{delivery.invoiceNumber || "—"}</td>
                          <td>
                              {/* No onClick: the click bubbles up to the row, so this works with the keyboard too. */}
                              <button type="button" className="link-button" aria-expanded={isOpen}>
                                  {isOpen ? "Hide" : "Show"}
                              </button>
                          </td>
                      </tr>

                      {isOpen && (
                          <tr className="delivery-detail-row">
                              <td colSpan={6}>
                                  <table className="delivery-lines-table">
                                      <thead>
                                      <tr>
                                          <th>Item</th>
                                          <th>Kept</th>
                                          <th>€ each</th>
                                          <th>Line total</th>
                                          <th>Problem</th>
                                      </tr>
                                      </thead>
                                      <tbody>
                                      {delivery.items.map((item, index) => (
                                          <tr key={index}>
                                              <td>{item.stockItem?.name || "Removed item"}</td>
                                              <td>
                                                  {item.quantityAccepted} {item.unit}
                                                  {item.quantityReceived !== item.quantityAccepted && (
                                                      <span className="cell-subtext"> of {item.quantityReceived} delivered</span>
                                                  )}
                                              </td>
                                              <td>{item.unitCost == null ? "—" : formatEuro(item.unitCost)}</td>
                                              <td>{item.unitCost == null ? "—" : formatEuro(item.unitCost * item.quantityAccepted)}</td>
                                              <td>
                                                  {item.issueType && item.issueType !== "none"
                                                      ? `${ISSUE_LABELS[item.issueType] ?? item.issueType}${item.issueNotes ? `: ${item.issueNotes}` : ""}`
                                                      : "—"}
                                              </td>
                                          </tr>
                                      ))}
                                      </tbody>
                                  </table>
                                  {delivery.notes && <p className="muted">Note: {delivery.notes}</p>}
                              </td>
                          </tr>
                      )}
                  </Fragment>
              );
          })}
          </tbody>
        </table>
      </div>
      <Pagination controls={controls} />
    </section>
  );

}

export default DeliveriesView;
