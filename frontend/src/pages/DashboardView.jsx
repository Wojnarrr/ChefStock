import StatCard from "../components/StatCard";

function DashboardView({ dashboard }) {
  return (
    <>
      <div className="stats-grid">
        <StatCard
          label="Active Stock Items"
          value={dashboard.counts.totalActiveStockItems}
          description="Items currently tracked"
        />

        <StatCard
          label="Low Stock"
          value={dashboard.counts.lowStockItemsCount}
          description="Items at or below minimum"
        />

        <StatCard
          label="Negative Stock"
          value={dashboard.counts.negativeStockItemsCount}
          description="Mismatch warnings"
        />

        <StatCard
          label="Recent Movements"
          value={dashboard.counts.recentMovementsCount}
          description="Latest stock changes"
        />
      </div>

      <section className="content-grid">
        <div className="panel">
          <div className="panel-header">
            <h2>Low Stock Items</h2>
            <span>{dashboard.lowStockItems.length}</span>
          </div>

          {dashboard.lowStockItems.length === 0 ? (
            <p className="muted">No low-stock items right now.</p>
          ) : (
            <div className="item-list">
              {dashboard.lowStockItems.map((item) => (
                <div className="stock-row" key={item._id}>
                  <div>
                    <h3>{item.name}</h3>
                    <p>
                      Current: {item.currentStock} {item.stockUnit} · Minimum:{" "}
                      {item.minStockLevel} {item.stockUnit}
                    </p>
                  </div>
                  <span className={`status-badge ${item.stockStatus}`}>
                    {item.stockStatus}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>Recent Activity</h2>
            <span>{dashboard.recentMovements.length}</span>
          </div>

          <div className="item-list">
            {dashboard.recentMovements.slice(0, 6).map((movement) => (
              <div className="movement-row" key={movement._id}>
                <div>
                  <h3>{movement.stockItem?.name || "Unknown item"}</h3>
                  <p>{movement.notes}</p>
                </div>
                <strong>
                  {movement.quantityChange > 0 ? "+" : ""}
                  {movement.quantityChange} {movement.unit}
                </strong>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export default DashboardView;
