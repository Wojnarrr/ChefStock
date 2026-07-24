import { useEffect, useState } from "react";
import "./App.css";

const API_BASE_URL = "http://localhost:5050/api";

function App() {
  const [dashboard, setDashboard] = useState(null);
  const [stockItems, setStockItems] = useState([]);
  const [activePage, setActivePage] = useState("dashboard");
  const [suppliers, setSuppliers] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [selectedStockItem, setSelectedStockItem] = useState(null);
  const [selectedItemMovements, setSelectedItemMovements] = useState([]);
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [showCreateStockItemForm, setShowCreateStockItemForm] = useState(false);
  const [showCreateDeliveryForm, setShowCreateDeliveryForm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
          const [
              dashboardResponse,
              stockItemsResponse,
              suppliersResponse,
              deliveriesResponse,
          ] = await Promise.all([
              fetch(`${API_BASE_URL}/dashboard/summary`),
              fetch(`${API_BASE_URL}/stock-items`),
              fetch(`${API_BASE_URL}/suppliers`),
              fetch(`${API_BASE_URL}/deliveries`),
          ]);

        if (!dashboardResponse.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        if (!stockItemsResponse.ok) {
          throw new Error("Failed to fetch stock items");
        }
        if (!suppliersResponse.ok) {
            throw new Error("Failed to fetch suppliers");
        }

        if (!deliveriesResponse.ok) {
            throw new Error("Failed to fetch deliveries");
        }

        const dashboardData = await dashboardResponse.json();
        const stockItemsData = await stockItemsResponse.json();
        const suppliersData = await suppliersResponse.json();
        const deliveriesData = await deliveriesResponse.json();

        console.log("Dashboard data:", dashboardData);
        console.log("Stock items data:", stockItemsData);

        setDashboard(dashboardData);
        setStockItems(stockItemsData);
        setSuppliers(suppliersData);
        setDeliveries(deliveriesData);

      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const handleStockItemClick = async (item) => {
    try {
      setSelectedStockItem(item);
      setMovementsLoading(true);

      const response = await fetch(
          `${API_BASE_URL}/inventory-movements?stockItem=${item._id}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch stock item movements");
      }

      const data = await response.json();
      setSelectedItemMovements(data.movements);
    } catch (error) {
      setError(error.message);
    } finally {
      setMovementsLoading(false);
    }
  };

  const handleBackToStockItems = () => {
    setSelectedStockItem(null);
    setSelectedItemMovements([]);
  };

  const refreshStockItems = async () => {
      const response = await fetch(`${API_BASE_URL}/stock-items`);

      if (!response.ok) {
          throw new Error("Failed to refresh stock items");
      }

      const data = await response.json();
      setStockItems(data);
  };
  const refreshDashboard = async () => {
      const response = await fetch(`${API_BASE_URL}/dashboard/summary`);

      if (!response.ok) {
          throw new Error("Failed to refresh dashboard");
      }

      const data = await response.json();
      setDashboard(data);
  };

  const refreshDeliveries = async () => {
      const response = await fetch(`${API_BASE_URL}/deliveries`);

      if (!response.ok) {
          throw new Error("Failed to refresh deliveries");
      }

      const data = await response.json();
      setDeliveries(data);
  };

  const handleCreateStockItem = async (formData) => {
      try {
          const payload = {
              name: formData.name,
              category: formData.category,
              stockType: formData.stockType,
              stockUnit: formData.stockUnit,
              recipeUnit: formData.recipeUnit,
              packType: formData.packType,
              currentStock: Number(formData.currentStock),
              minStockLevel: Number(formData.minStockLevel),
              reorderQuantity: Number(formData.reorderQuantity),
              trackingPriority: formData.trackingPriority,
              requiresExpiryTracking: formData.requiresExpiryTracking,
              requiresBatchTracking: formData.requiresBatchTracking,
          };

          if (formData.packType === "fixed") {
              payload.unitsPerStockUnit = Number(formData.unitsPerStockUnit);
          }

          if (formData.packType === "variable") {
              payload.estimatedUnitsPerStockUnit = Number(
                  formData.estimatedUnitsPerStockUnit
              );
          }

          const response = await fetch(`${API_BASE_URL}/stock-items`, {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
          });

          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || "Failed to create stock item");
          }

          await refreshStockItems();
          setShowCreateStockItemForm(false);
      } catch (error) {
          setError(error.message);
      }
  };
  const handleCreateDelivery = async (formData) => {
      try {
          const selectedStockItem = stockItems.find(
              (item) => item._id === formData.stockItem
          );

          const payload = {
              supplier: formData.supplier,
              invoiceNumber: formData.invoiceNumber,
              items: [
                  {
                      stockItem: formData.stockItem,
                      quantityReceived: Number(formData.quantityReceived),
                      quantityAccepted: Number(formData.quantityAccepted),
                      unit: selectedStockItem.stockUnit,
                      batchNumber: formData.batchNumber,
                      expiryDate: formData.expiryDate || null,
                      issueType: formData.issueType,
                      issueNotes: formData.issueNotes,
                  },
              ],
              notes: formData.notes,
          };

          const response = await fetch(`${API_BASE_URL}/deliveries`, {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
          });

          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || "Failed to create delivery");
          }

          await refreshDashboard();
          await refreshStockItems();
          await refreshDeliveries();

          setShowCreateDeliveryForm(false);
      } catch (error) {
          setError(error.message);
      }
  };

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
                onClick={() => {
                  setActivePage("dashboard");
                  setSelectedStockItem(null);
                }}
            >
              Dashboard
            </button>

            <button
                className={`nav-link ${activePage === "stock-items" ? "active" : ""}`}
                onClick={() => {
                  setActivePage("stock-items");
                  setSelectedStockItem(null);
                }}
            >
              Stock Items
            </button>

            <button
                className={`nav-link ${activePage === "deliveries" ? "active" : ""}`}
                onClick={() => {
                    setActivePage("deliveries");
                    setSelectedStockItem(null);
                    setShowCreateStockItemForm(false);
                    setShowCreateDeliveryForm(false);
                }}
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

          {activePage === "dashboard" && <DashboardView dashboard={dashboard} />}

          {activePage === "stock-items" &&
              (selectedStockItem ? (
                  <StockItemDetailView
                      item={selectedStockItem}
                      movements={selectedItemMovements}
                      movementsLoading={movementsLoading}
                      onBack={handleBackToStockItems}
                  />
              ) : showCreateStockItemForm ? (
                  <CreateStockItemForm
                      onSubmit={handleCreateStockItem}
                      onCancel={() => setShowCreateStockItemForm(false)}
                  />
              ) : (
                  <StockItemsView
                      stockItems={stockItems}
                      onStockItemClick={handleStockItemClick}
                      onAddStockItem={() => setShowCreateStockItemForm(true)}
                  />
              ))}

          {activePage === "deliveries" &&
              (showCreateDeliveryForm ? (
                  <CreateDeliveryForm
                      suppliers={suppliers}
                      stockItems={stockItems}
                      onSubmit={handleCreateDelivery}
                      onCancel={() => setShowCreateDeliveryForm(false)}
                  />
              ) : (
                  <DeliveriesView
                      deliveries={deliveries}
                      onAddDelivery={() => setShowCreateDeliveryForm(true)}
                  />
              ))}

          {activePage !== "dashboard" &&
              activePage !== "stock-items" &&
              activePage !== "deliveries" && (
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

function StockItemsView({ stockItems, onStockItemClick, onAddStockItem }) {
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
                </tr>
            ))}
            </tbody>
          </table>
        </div>
      </section>
  );
}

function StockItemDetailView({ item, movements, movementsLoading, onBack }) {
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

          <span className={`status-badge ${item.stockStatus}`}>
          {item.stockStatus}
        </span>
        </div>

        <section className="detail-stats-grid">
          <StatCard
              title="Current Stock"
              value={`${item.currentStock} ${item.stockUnit}`}
              description="Current app estimate"
          />
          <StatCard
              title="Minimum Stock"
              value={`${item.minStockLevel} ${item.stockUnit}`}
              description="Low-stock threshold"
          />
          <StatCard
              title="Reorder Quantity"
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
function CreateStockItemForm({ onSubmit, onCancel }) {
    const [formData, setFormData] = useState({
        name: "",
        category: "ingredient",
        stockType: "raw",
        stockUnit: "pack",
        recipeUnit: "g",
        packType: "none",
        unitsPerStockUnit: "",
        estimatedUnitsPerStockUnit: "",
        currentStock: "0",
        minStockLevel: "0",
        reorderQuantity: "0",
        trackingPriority: "medium",
        requiresExpiryTracking: false,
        requiresBatchTracking: false,
    });

    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;

        setFormData((currentFormData) => ({
            ...currentFormData,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        onSubmit(formData);
    };

    return (
        <section className="panel form-panel">
            <div className="panel-header">
                <div>
                    <h2>Add Stock Item</h2>
                    <p className="panel-subtitle">
                        Create a new item that can be used in deliveries, prep, and recipes.
                    </p>
                </div>
            </div>

            <form className="stock-form" onSubmit={handleSubmit}>
                <div className="form-grid">
                    <label>
                        Name
                        <input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g. Garlic Dip"
                            required
                        />
                    </label>

                    <label>
                        Category
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                        >
                            <option value="ingredient">Ingredient</option>
                            <option value="drink">Drink</option>
                            <option value="packaging">Packaging</option>
                            <option value="other">Other</option>
                        </select>
                    </label>

                    <label>
                        Stock Type
                        <select
                            name="stockType"
                            value={formData.stockType}
                            onChange={handleChange}
                        >
                            <option value="raw">Raw</option>
                            <option value="prepared">Prepared</option>
                            <option value="finished_product">Finished Product</option>
                            <option value="non_edible">Non Edible</option>
                        </select>
                    </label>

                    <label>
                        Stock Unit
                        <select
                            name="stockUnit"
                            value={formData.stockUnit}
                            onChange={handleChange}
                        >
                            <UnitOptions />
                        </select>
                    </label>

                    <label>
                        Recipe Unit
                        <select
                            name="recipeUnit"
                            value={formData.recipeUnit}
                            onChange={handleChange}
                        >
                            <UnitOptions />
                        </select>
                    </label>

                    <label>
                        Pack Type
                        <select
                            name="packType"
                            value={formData.packType}
                            onChange={handleChange}
                        >
                            <option value="none">None</option>
                            <option value="fixed">Fixed</option>
                            <option value="variable">Variable</option>
                        </select>
                    </label>

                    {formData.packType === "fixed" && (
                        <label>
                            Units Per Stock Unit
                            <input
                                name="unitsPerStockUnit"
                                type="number"
                                step="0.001"
                                value={formData.unitsPerStockUnit}
                                onChange={handleChange}
                                placeholder="e.g. 1500"
                                required
                            />
                        </label>
                    )}

                    {formData.packType === "variable" && (
                        <label>
                            Estimated Units Per Stock Unit
                            <input
                                name="estimatedUnitsPerStockUnit"
                                type="number"
                                step="0.001"
                                value={formData.estimatedUnitsPerStockUnit}
                                onChange={handleChange}
                                placeholder="e.g. 10"
                                required
                            />
                        </label>
                    )}

                    <label>
                        Current Stock
                        <input
                            name="currentStock"
                            type="number"
                            step="0.001"
                            value={formData.currentStock}
                            onChange={handleChange}
                            required
                        />
                    </label>

                    <label>
                        Minimum Stock Level
                        <input
                            name="minStockLevel"
                            type="number"
                            step="0.001"
                            value={formData.minStockLevel}
                            onChange={handleChange}
                            required
                        />
                    </label>

                    <label>
                        Reorder Quantity
                        <input
                            name="reorderQuantity"
                            type="number"
                            step="0.001"
                            value={formData.reorderQuantity}
                            onChange={handleChange}
                            required
                        />
                    </label>

                    <label>
                        Tracking Priority
                        <select
                            name="trackingPriority"
                            value={formData.trackingPriority}
                            onChange={handleChange}
                        >
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                    </label>
                </div>

                <div className="checkbox-row">
                    <label>
                        <input
                            type="checkbox"
                            name="requiresExpiryTracking"
                            checked={formData.requiresExpiryTracking}
                            onChange={handleChange}
                        />
                        Requires expiry tracking
                    </label>

                    <label>
                        <input
                            type="checkbox"
                            name="requiresBatchTracking"
                            checked={formData.requiresBatchTracking}
                            onChange={handleChange}
                        />
                        Requires batch tracking
                    </label>
                </div>

                <div className="form-actions">
                    <button type="button" className="secondary-button" onClick={onCancel}>
                        Cancel
                    </button>
                    <button type="submit" className="primary-button">
                        Create Stock Item
                    </button>
                </div>
            </form>
        </section>
    );
}

function UnitOptions() {
    return (
        <>
            <option value="g">g</option>
            <option value="kg">kg</option>
            <option value="ml">ml</option>
            <option value="l">l</option>
            <option value="pcs">pcs</option>
            <option value="pack">pack</option>
            <option value="box">box</option>
            <option value="case">case</option>
            <option value="bottle">bottle</option>
            <option value="can">can</option>
            <option value="container">container</option>
        </>
    );
}
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
function CreateDeliveryForm({ suppliers, stockItems, onSubmit, onCancel }) {
    const [formData, setFormData] = useState({
        supplier: suppliers[0]?._id || "",
        stockItem: stockItems[0]?._id || "",
        quantityReceived: "1",
        quantityAccepted: "1",
        invoiceNumber: "",
        batchNumber: "",
        expiryDate: "",
        issueType: "none",
        issueNotes: "",
        notes: "",
    });

    const selectedStockItem = stockItems.find(
        (item) => item._id === formData.stockItem
    );

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((currentFormData) => ({
            ...currentFormData,
            [name]: value,
        }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        onSubmit(formData);
    };

    return (
        <section className="panel form-panel">
            <div className="panel-header">
                <div>
                    <h2>Add Delivery</h2>
                    <p className="panel-subtitle">
                        Record stock received from a supplier.
                    </p>
                </div>
            </div>

            <form className="stock-form" onSubmit={handleSubmit}>
                <div className="form-grid">
                    <label>
                        Supplier
                        <select
                            name="supplier"
                            value={formData.supplier}
                            onChange={handleChange}
                            required
                        >
                            {suppliers.map((supplier) => (
                                <option key={supplier._id} value={supplier._id}>
                                    {supplier.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label>
                        Stock Item
                        <select
                            name="stockItem"
                            value={formData.stockItem}
                            onChange={handleChange}
                            required
                        >
                            {stockItems.map((item) => (
                                <option key={item._id} value={item._id}>
                                    {item.name} ({item.stockUnit})
                                </option>
                            ))}
                        </select>
                    </label>

                    <label>
                        Quantity Received
                        <input
                            name="quantityReceived"
                            type="number"
                            step="0.001"
                            value={formData.quantityReceived}
                            onChange={handleChange}
                            required
                        />
                    </label>

                    <label>
                        Quantity Accepted
                        <input
                            name="quantityAccepted"
                            type="number"
                            step="0.001"
                            value={formData.quantityAccepted}
                            onChange={handleChange}
                            required
                        />
                    </label>

                    <label>
                        Unit
                        <input
                            value={selectedStockItem?.stockUnit || ""}
                            disabled
                            readOnly
                        />
                    </label>

                    <label>
                        Invoice Number
                        <input
                            name="invoiceNumber"
                            value={formData.invoiceNumber}
                            onChange={handleChange}
                            placeholder="e.g. INV-123"
                        />
                    </label>

                    <label>
                        Batch Number
                        <input
                            name="batchNumber"
                            value={formData.batchNumber}
                            onChange={handleChange}
                            placeholder="Optional"
                        />
                    </label>

                    <label>
                        Expiry Date
                        <input
                            name="expiryDate"
                            type="date"
                            value={formData.expiryDate}
                            onChange={handleChange}
                        />
                    </label>

                    <label>
                        Issue Type
                        <select
                            name="issueType"
                            value={formData.issueType}
                            onChange={handleChange}
                        >
                            <option value="none">None</option>
                            <option value="missing">Missing</option>
                            <option value="extra">Extra</option>
                            <option value="damaged">Damaged</option>
                            <option value="wrong_item">Wrong Item</option>
                            <option value="wrong_quantity">Wrong Quantity</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </label>

                    <label>
                        Issue Notes
                        <input
                            name="issueNotes"
                            value={formData.issueNotes}
                            onChange={handleChange}
                            placeholder="Optional"
                        />
                    </label>
                </div>

                <label className="full-width-label">
                    Delivery Notes
                    <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        placeholder="Optional delivery notes"
                        rows="3"
                    />
                </label>

                <div className="form-actions">
                    <button type="button" className="secondary-button" onClick={onCancel}>
                        Cancel
                    </button>
                    <button type="submit" className="primary-button">
                        Create Delivery
                    </button>
                </div>
            </form>
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