import { useEffect, useState } from "react";
import "./App.css";

import NavBar from "./components/NavBar";
import PageHeader from "./components/PageHeader";
import ComingSoonView from "./components/ComingSoonView";

import DashboardView from "./pages/DashboardView";
import StockItemsView from "./pages/StockItemsView";
import StockItemDetailView from "./pages/StockItemDetailView";
import SuppliersView from "./pages/SuppliersView";
import DeliveriesView from "./pages/DeliveriesView";
import RecipesView from "./pages/RecipesView";
import ProductionView from "./pages/ProductionBatchesView.jsx";
import PrepTasksView from "./pages/PrepTasksView";

import CreatePrepTaskForm from "./forms/CreatePrepTaskForm";
import CreateStockItemForm from "./forms/CreateStockItemForm";
import CreateSupplierForm from "./forms/CreateSupplierForm";
import CreateDeliveryForm from "./forms/CreateDeliveryForm";
import CreateRecipeForm from "./forms/CreateRecipeForm";
import CreateProductionBatchForm from "./forms/CreateProductionBatchForm";

import { getPageTitle } from "./constants/options";

import { apiFetch } from "./utils/api";

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
  const [showCreateSupplierForm, setShowCreateSupplierForm] = useState(false);
  const [productionBatches, setProductionBatches] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [showCreateRecipeForm, setShowCreateRecipeForm] = useState(false);
  const [showCreateProductionBatchForm, setShowCreateProductionBatchForm] = useState(false);
  const [prepTasks, setPrepTasks] = useState([]);
  const [showCreatePrepTaskForm, setShowCreatePrepTaskForm] = useState(false);

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
          prepBatchesResponse,
          recipesResponse,
          productionBatchesResponse,
          prepTasksResponse,
        ] = await Promise.all([
          fetch(`${API_BASE_URL}/dashboard/summary`),
          fetch(`${API_BASE_URL}/stock-items`),
          fetch(`${API_BASE_URL}/suppliers`),
          fetch(`${API_BASE_URL}/deliveries`),
          fetch(`${API_BASE_URL}/prep-batches`),
          fetch(`${API_BASE_URL}/recipes`),
          fetch(`${API_BASE_URL}/production-batches`),
          fetch(`${API_BASE_URL}/prep-tasks`),
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
        if (!prepBatchesResponse.ok) {
          throw new Error("Failed to fetch prep batches");
        }
        if (!recipesResponse.ok) {
          throw new Error("Failed to fetch recipes");
        }
        if (!productionBatchesResponse.ok) {
          throw new Error("Failed to fetch production batches");
        }
        if (!prepTasksResponse.ok) {
          throw new Error("Failed to fetch prep tasks");
        }
        const dashboardData = await dashboardResponse.json();
        const stockItemsData = await stockItemsResponse.json();
        const suppliersData = await suppliersResponse.json();
        const deliveriesData = await deliveriesResponse.json();
        const recipesData = await recipesResponse.json();
        const productionBatchesData = await productionBatchesResponse.json();
        const prepTasksData = await prepTasksResponse.json();

        console.log("Dashboard data:", dashboardData);
        console.log("Stock items data:", stockItemsData);

        setDashboard(dashboardData);
        setStockItems(stockItemsData);
        setSuppliers(suppliersData);
        setDeliveries(deliveriesData);
        setRecipes(recipesData);
        setProductionBatches(productionBatchesData);
        setPrepTasks(prepTasksData);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);
  const loadItemMovements = async (stockItemId) => {
    try {
      setMovementsLoading(true);
      const data = await apiFetch(`/inventory-movements?stockItem=${stockItemId}`);
      setSelectedItemMovements(data.movements);
    } catch (error) {
      setError(error.message);
    } finally {
      setMovementsLoading(false);
    }
  };
  const handleStockItemClick = async (item) => {
    setSelectedStockItem(item);
    await loadItemMovements(item._id);
  };

  const handleBackToStockItems = () => {
    setSelectedStockItem(null);
    setSelectedItemMovements([]);
  };

  // Navigating between tabs closes any open create-forms so each tab starts
  // on its list view, except the stock-items tab keeps its own form state
  // (matches the original nav behavior).
  const handleNavigate = (page) => {
    setActivePage(page);
    setSelectedStockItem(null);
    setShowCreateDeliveryForm(false);
    setShowCreateSupplierForm(false);
    setShowCreateRecipeForm(false);
    setShowCreateProductionBatchForm(false);
    setShowCreatePrepTaskForm(false);
    if (page !== "stock-items") {
      setShowCreateStockItemForm(false);
    }
  };


  const refreshStockItems = async () => {
    const data = await apiFetch("/stock-items");
    setStockItems(data);
  };
  const refreshDashboard = async () => {
    const data = await apiFetch("/dashboard/summary");
    setDashboard(data);
  };

  const refreshDeliveries = async () => {
    const data = await apiFetch("/deliveries");
    setDeliveries(data);
  };

  const refreshSuppliers = async () => {
    const data = await apiFetch("/suppliers");
    setSuppliers(data);
  };

  // const refreshPrepBatches = async () => {
  //   const data = await apiFetch("/prep-batches");
  //   setPrepBatches(data);
  // };

  const refreshRecipes = async () => {
    const data = await apiFetch("/recipes");
    setRecipes(data);
  };
  const refreshProductionBatches = async () => {
    const data = await apiFetch("/production-batches");
    setProductionBatches(data);
  };
  const refreshPrepTasks = async () => {
    const data = await apiFetch("/prep-tasks");
    setPrepTasks(data);
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

      await apiFetch("/stock-items", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      await refreshStockItems();
      setShowCreateStockItemForm(false);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleCreateDelivery = async (formData) => {
    try {
      const payload = {
        supplier: formData.supplier,
        invoiceNumber: formData.invoiceNumber,
        items: formData.items.map((deliveryItem) => {
          const selectedStockItem = stockItems.find(
              (stockItem) => stockItem._id === deliveryItem.stockItem
          );

          return {
            stockItem: deliveryItem.stockItem,
            quantityReceived: Number(deliveryItem.quantityReceived),
            quantityAccepted: Number(deliveryItem.quantityAccepted),
            unit: selectedStockItem.stockUnit,
            batchNumber: deliveryItem.batchNumber,
            expiryDate: deliveryItem.expiryDate || null,
            issueType: deliveryItem.issueType,
            issueNotes: deliveryItem.issueNotes,
          };
        }),
        notes: formData.notes,
      };

      await apiFetch("/deliveries", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      await refreshDashboard();
      await refreshStockItems();
      await refreshDeliveries();

      setShowCreateDeliveryForm(false);
    } catch (error) {
      setError(error.message);
    }
  };
  const handleCreateSupplier = async (formData) => {
    try {
      const payload = {
        name: formData.name,
        contactPerson: formData.contactPerson,
        phone: formData.phone,
        email: formData.email,
        deliveryDays: formData.deliveryDays,
        notes: formData.notes,
        isActive: true,
      };
      await apiFetch("/suppliers", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      await refreshSuppliers();
      setShowCreateSupplierForm(false);
    } catch (error) {
      setError(error.message);
    }
  };
  const handleCreateRecipe = async (formData) => {
    try {
      const payload = {
        name: formData.name,
        recipeType: formData.recipeType,
        outputUnit: formData.outputUnit,
        portionsPerOutput:
            formData.portionsPerOutput === ""
                ? null
                : Number(formData.portionsPerOutput),
        ingredients: formData.ingredients.map((ingredient) => {
          const selectedStockItem = stockItems.find(
              (item) => item._id === ingredient.stockItem
          );

          return {
            stockItem: ingredient.stockItem,
            quantity: Number(ingredient.quantity),
            unit: ingredient.unit || selectedStockItem.recipeUnit || selectedStockItem.stockUnit,
            minQuantity:
                ingredient.minQuantity === "" ? null : Number(ingredient.minQuantity),
            maxQuantity:
                ingredient.maxQuantity === "" ? null : Number(ingredient.maxQuantity),
            isOptional: ingredient.isOptional,
            notes: ingredient.notes,
          };
        }),
        notes: formData.notes,
        isActive: true,
      };

      if (formData.recipeType === "prep") {
        payload.outputStockItem = formData.outputStockItem;
        payload.outputQuantity = Number(formData.outputQuantity);
      }

      await apiFetch("/recipes", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      await refreshRecipes();
      setShowCreateRecipeForm(false);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleCreateProductionBatch = async (formData) => {
    try {
      const payload = {
        itemsProduced: formData.itemsProduced.map((item) => ({
          recipe: item.recipe,
          quantityProduced: Number(item.quantityProduced),
          outputUnit: item.outputUnit,
        })),
        notes: formData.notes,
      };

      const data = await apiFetch("/production-batches", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (data.stockWarnings && data.stockWarnings.length > 0) {
        const warningText = data.stockWarnings.map((w) => w.message).join("\n");
        alert(`Production recorded, but some stock looks off:\n\n${warningText}`);
      }

      await refreshDashboard();
      await refreshStockItems();
      await refreshProductionBatches();

      setShowCreateProductionBatchForm(false);
    } catch (error) {
      setError(error.message);
    }
  };
  const handleCreatePrepTask = async (formData) => {
    try {
      await apiFetch("/prep-tasks", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      await refreshPrepTasks();
      setShowCreatePrepTaskForm(false);
    } catch (error) {
      setError(error.message);
    }
  };
  const handleCompleteTask = async (taskId) => {
    try {
      const data = await apiFetch(`/prep-tasks/${taskId}/complete`, {
        method: "PATCH",
      });

      if (data.stockWarnings && data.stockWarnings.length > 0) {
        const warningText = data.stockWarnings.map((w) => w.message).join("\n");
        alert(`Task completed, but some stock looks off:\n\n${warningText}`);
      }

      await refreshDashboard();
      await refreshStockItems();
      await refreshPrepTasks();
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
      <NavBar activePage={activePage} onNavigate={handleNavigate} />

      <PageHeader
        eyebrow="Restaurant Inventory System"
        title="ChefStock Dashboard"
        subtitle="Live stock overview based on deliveries, prep, production and manual adjustments."
      />

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
      {activePage === "suppliers" &&
        (showCreateSupplierForm ? (
          <CreateSupplierForm
            onSubmit={handleCreateSupplier}
            onCancel={() => setShowCreateSupplierForm(false)}
          />
        ) : (
          <SuppliersView
            suppliers={suppliers}
            onAddSupplier={() => setShowCreateSupplierForm(true)}
          />
        ))}
      {activePage === "recipes" &&
        (showCreateRecipeForm ? (
          <CreateRecipeForm
            stockItems={stockItems}
            onSubmit={handleCreateRecipe}
            onCancel={() => setShowCreateRecipeForm(false)}
          />
        ) : (
          <RecipesView
            recipes={recipes}
            onAddRecipe={() => setShowCreateRecipeForm(true)}
          />
        ))}
      {activePage === "prep" &&
          (showCreatePrepTaskForm ? (
              <CreatePrepTaskForm
                  recipes={recipes}
                  onSubmit={handleCreatePrepTask}
                  onCancel={() => setShowCreatePrepTaskForm(false)}
              />
          ) : (
              <PrepTasksView
                  prepTasks={prepTasks}
                  onAddPrepTask={() => setShowCreatePrepTaskForm(true)}
                  onCompleteTask={handleCompleteTask}
              />
          ))}
      {activePage === "production" &&
          (showCreateProductionBatchForm ? (
              <CreateProductionBatchForm
                  recipes={recipes}
                  onSubmit={handleCreateProductionBatch}
                  onCancel={() => setShowCreateProductionBatchForm(false)}
              />
          ) : (
              <ProductionView
                  productionBatches={productionBatches}
                  onAddProductionBatch={() => setShowCreateProductionBatchForm(true)}
              />
          ))}
      {activePage !== "dashboard" &&
        activePage !== "stock-items" &&
        activePage !== "suppliers" &&
        activePage !== "recipes" &&
        activePage !== "prep" &&
          activePage !== "production" &&
        activePage !== "deliveries" && (
          <ComingSoonView title={getPageTitle(activePage)} />
        )}
    </main>
  );
}

export default App;
