import { useEffect, useState } from "react";
import "./App.css";

const API_BASE_URL = "http://localhost:5050/api";

function App() {
  const [dashboard, setDashboard] = useState(null);
  const [stockItems, setStockItems] = useState([]);
  const [activePage, setActivePage] = useState("dashboard");

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
        <nav className="app-nav">
          <div className="brand">
            <div className="brand-mark">CS</div>
            <div>
              <strong>ChefStock</strong>
              <span>Inventory Manager</span>
            </div>
          </div>

          <div className="nav-links">
            <button
                className={`nav-link ${activePage === "dashboard" ? "active" : ""}`}
                onClick={() => setActivePage("dashboard")}
            >
              Dashboard
            </button>

            <button
                className={`nav-link ${activePage === "stock-items" ? "active" : ""}`}
                onClick={() => setActivePage("stock-items")}
            >
              Stock Items
            </button>

            <button
                className={`nav-link ${activePage === "deliveries" ? "active" : ""}`}
                onClick={() => setActivePage("deliveries")}
            >
              Deliveries
            </button>

            <button
                className={`nav-link ${activePage === "prep" ? "active" : ""}`}
                onClick={() => setActivePage("prep")}
            >
              Prep
            </button>

            <button
                className={`nav-link ${activePage === "production" ? "active" : ""}`}
                onClick={() => setActivePage("production")}
            >
              Production
            </button>

            <button
                className={`nav-link ${activePage === "adjustments" ? "active" : ""}`}
                onClick={() => setActivePage("adjustments")}
            >
              Adjustments
            </button>
          </div>
        </nav>

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

        {activePage === "dashboard" && (
            <DashboardView dashboard={dashboard} />
        )}

        {activePage === "stock-items" && (
            <StockItemsView stockItems={stockItems} />
        )}

        {activePage !== "dashboard" && activePage !== "stock-items" && (
            <ComingSoonView title={getPageTitle(activePage)} />
        )}
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
function DashboardView({ dashboard }) {
  return (
      <>
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
      </>
  );
}

function StockItemsView({ stockItems }) {
  return (
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
  );
}

function ComingSoonView({ title }) {
  return (
      <section className="panel coming-soon">
        <p className="eyebrow">Coming soon</p>
        <h2>{title}</h2>
        <p className="subtitle">
          This section will be added after the dashboard and stock item views are
          finished.
        </p>
      </section>
  );
}

function getPageTitle(activePage) {
  const titles = {
    deliveries: "Deliveries",
    prep: "Prep Batches",
    production: "Production Batches",
    adjustments: "Stock Adjustments",
  };

  return titles[activePage] || "Coming Soon";
}
export default App;