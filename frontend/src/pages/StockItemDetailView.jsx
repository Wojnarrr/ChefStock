import StatCard from "../components/StatCard";
import AdjustStockForm from "../forms/AdjustStockForm";
function StockItemDetailView({
                                 item,
                                 movements,
                                 movementsLoading,
                                 onBack,
                                 showAdjustForm,
                                 onAdjustStockClick,
                                 onCancelAdjust,
                                 onSubmitAdjustment,
                             }) {
  return (
    <section className="panel stock-detail-panel">
      <button className="back-button" onClick={onBack}>
        ← Back to stock items
      </button>

      <div className="stock-detail-header">
        <div>
          <p className="eyebrow">Stock Item</p>
          <h2>{item.name}</h2>
          <p className="subtitle">
            {item.category} · {item.stockType.replace("_", " ")}
          </p>
        </div>

          <div className="stock-detail-header-actions">
          <span className={`status-badge ${item.stockStatus}`}>
            {item.stockStatus}
          </span>

              {!showAdjustForm && (
                  <button className="secondary-button" onClick={onAdjustStockClick}>
                      Adjust Stock
                  </button>
              )}
          </div>
      </div>

        {showAdjustForm && (
            <AdjustStockForm
                item={item}
                onSubmit={onSubmitAdjustment}
                onCancel={onCancelAdjust}
            />
        )}
      <section className="detail-stats-grid">
        <StatCard
          label="Current Stock"
          value={`${item.currentStock} ${item.stockUnit}`}
          description="Current app estimate"
        />
        <StatCard
          label="Minimum Stock"
          value={`${item.minStockLevel} ${item.stockUnit}`}
          description="Low-stock threshold"
        />
        <StatCard
          label="Reorder Quantity"
          value={`${item.reorderQuantity} ${item.stockUnit}`}
          description="Suggested reorder amount"
        />
      </section>

      <div className="detail-section">
        <h3>Movement History</h3>

        {movementsLoading ? (
          <p className="muted">Loading movement history...</p>
        ) : movements.length === 0 ? (
          <p className="muted">No movements recorded for this item yet.</p>
        ) : (
          <div className="item-list">
            {movements.map((movement) => (
              <div className="movement-row" key={movement._id}>
                <div>
                  <h3>{formatMovementType(movement.movementType)}</h3>
                  <p>{movement.notes}</p>
                  <p className="movement-meta">
                    {movement.previousStock} → {movement.newStock}{" "}
                    {movement.unit}
                  </p>
                </div>

                <strong>
                  {movement.quantityChange > 0 ? "+" : ""}
                  {movement.quantityChange} {movement.unit}
                </strong>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function formatMovementType(type) {
  return type
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

export default StockItemDetailView;
