import { useEffect, useState } from "react";
import "./App.css";

const API_BASE_URL = "http://localhost:5050/api";

function App() {
  const [dashboard, setDashboard] = useState(null);
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [dashboardResponse, stockItemsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/dashboard/summary`),
          fetch(`${API_BASE_URL}/stock-items`),
        ]);

        if (!dashboardResponse.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        if (!stockItemsResponse.ok) {
          throw new Error("Failed to fetch stock items");
        }

        const dashboardData = await dashboardResponse.json();
        const stockItemsData = await stockItemsResponse.json();

        console.log("Dashboard data:", dashboardData);
        console.log("Stock items data:", stockItemsData);

        setDashboard(dashboardData);
        setStockItems(stockItemsData);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
        <main className="page">
          <p>Loading ChefStock dashboard...</p>
        </main>
    );
  }

  if (error) {
    return (
        <main className="page">
          <h1>ChefStock</h1>
          <p className="error">Error: {error}</p>
        </main>
    );
  }

  return (
      <main className="page">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">Restaurant Inventory System</p>
            <h1>ChefStock Dashboard</h1>
            <p className="subtitle">
              Live stock overview based on deliveries, prep, production and manual
              adjustments.
            </p>
          </div>
        </header>

        <section className="stats-grid">
          <StatCard
              title="Active Stock Items"
              value={dashboard.counts.totalActiveStockItems}
              description="Items currently tracked"
          />
          <StatCard
              title="Low Stock"
              value={dashboard.counts.lowStockItemsCount}
              description="Items at or below minimum"
          />
          <StatCard
              title="Negative Stock"
              value={dashboard.counts.negativeStockItemsCount}
              description="Mismatch warnings"
          />
          <StatCard
              title="Recent Movements"
              value={dashboard.counts.recentMovementsCount}
              description="Latest stock changes"
          />
        </section>

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

        <section className="panel stock-table-panel">
          <div className="panel-header">
            <h2>All Stock Items</h2>
            <span>{stockItems.length}</span>
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
              </tr>
              </thead>

              <tbody>
              {stockItems.map((item) => (
                  <tr key={item._id}>
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
                  </tr>
              ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
  );
}

function StatCard({ title, value, description }) {
  return (
      <div className="stat-card">
        <p>{title}</p>
        <strong>{value}</strong>
        <span>{description}</span>
      </div>
  );
}

export default App;