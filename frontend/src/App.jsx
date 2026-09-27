import { useEffect, useState } from "react";
import "./App.css";

import AppLayout from "./components/AppLayout";
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
import ManagementView from "./pages/management/ManagementView";

import { getPage, canAccessPage } from "./constants/navigation";
import { useAuth } from "./context/AuthContext";

import { apiFetch } from "./utils/api";

// const API_BASE_URL = "http://localhost:5050/api";

function App() {
  const { currentRestaurantId, role } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [stockItems, setStockItems] = useState([]);
  const [activePage, setActivePage] = useState("dashboard");
  const [suppliers, setSuppliers] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [selectedStockItem, setSelectedStockItem] = useState(null);
  const [editingStockItem, setEditingStockItem] = useState(null);
  const [selectedItemMovements, setSelectedItemMovements] = useState([]);
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [showCreateStockItemForm, setShowCreateStockItemForm] = useState(false);
  const [showCreateDeliveryForm, setShowCreateDeliveryForm] = useState(false);
  const [showCreateSupplierForm, setShowCreateSupplierForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [productionBatches, setProductionBatches] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [showCreateRecipeForm, setShowCreateRecipeForm] = useState(false);
  const [showCreateProductionBatchForm, setShowCreateProductionBatchForm] = useState(false);
  const [prepTasks, setPrepTasks] = useState([]);
  const [showCreatePrepTaskForm, setShowCreatePrepTaskForm] = useState(false);
  const [showAdjustStockForm, setShowAdjustStockForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Reload everything whenever the selected restaurant changes, so switching
  // restaurant in the sidebar shows that restaurant's data straight away.
  useEffect(() => {
    if (!currentRestaurantId) return;

    const fetchDashboard = async () => {
      setLoading(true);
      setError("");
      setSelectedStockItem(null);
      setSelectedItemMovements([]);

      try {
        const [
          dashboardData,
          stockItemsData,
          suppliersData,
          deliveriesData,
          recipesData,
          productionBatchesData,
          prepTasksData,
        ] = await Promise.all([
          apiFetch("/dashboard/summary"),
          apiFetch("/stock-items"),
          apiFetch("/suppliers"),
          apiFetch("/deliveries"),
          apiFetch("/recipes"),
          apiFetch("/production-batches"),
          apiFetch("/prep-tasks"),
        ]);

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
  }, [currentRestaurantId]);

  // If the current page isn't allowed for this role (e.g. after switching to
  // a restaurant where you're staff), fall back to the dashboard.
  useEffect(() => {
    if (role && !canAccessPage(activePage, role)) {
      setActivePage("dashboard");
    }
  }, [role, activePage]);

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
    setShowAdjustStockForm(false);
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
    setEditingRecipe(null);
    setEditingStockItem(null);
    setEditingSupplier(null)
    if (page !== "stock-items") {
      setShowCreateStockItemForm(false);
    }
  };


  const refreshStockItems = async () => {
    const data = await apiFetch("/stock-items");
    setStockItems(data);
    return data;
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
  const handleEditStockItemClick = (item) => {
    setEditingStockItem(item);
    setShowCreateStockItemForm(true);
  };

  const handleDeleteStockItem = async (item) => {
    const confirmed = window.confirm(`Delete stock item "${item.name}"?`);

    if (!confirmed) {
      return;
    }

    try {
      await apiFetch(`/stock-items/${item._id}`, { method: "DELETE" });
      await refreshStockItems();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleSubmitStockItem = async (formData) => {
    try {
      const payload = {
        name: formData.name,
        category: formData.category,
        stockType: formData.stockType,
        stockUnit: formData.stockUnit,
        recipeUnit: formData.recipeUnit,
        packType: formData.packType,
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
        payload.estimatedUnitsPerStockUnit = Number(formData.estimatedUnitsPerStockUnit);
      }

      if (editingStockItem) {
        await apiFetch(`/stock-items/${editingStockItem._id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        payload.currentStock = Number(formData.currentStock);
        await apiFetch("/stock-items", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      await refreshStockItems();
      setShowCreateStockItemForm(false);
      setEditingStockItem(null);
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
  const handleEditSupplierClick = (supplier) => {
    setEditingSupplier(supplier);
    setShowCreateSupplierForm(true);
  };

  const handleUpdateSupplier = async (supplierId, formData) => {
    await apiFetch(`/suppliers/${supplierId}`, {
      method: "PUT",
      body: JSON.stringify(formData),
    });

    await refreshSuppliers();
  };

  const handleDeleteSupplier = async (supplier) => {
    const confirmed = window.confirm(`Delete supplier "${supplier.name}"?`);

    if (!confirmed) {
      return;
    }

    try {
      await apiFetch(`/suppliers/${supplier._id}`, { method: "DELETE" });
      await refreshSuppliers();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleSubmitSupplier = async (formData) => {
    try {
      if (editingSupplier) {
        await handleUpdateSupplier(editingSupplier._id, formData);
      } else {
        await handleCreateSupplier(formData);
        return; // handleCreateSupplier already closes the form itself
      }

      setShowCreateSupplierForm(false);
      setEditingSupplier(null);
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
  const handleEditRecipeClick = (recipe) => {
    setEditingRecipe(recipe);
    setShowCreateRecipeForm(true);
  };

  const handleUpdateRecipe = async (recipeId, payload) => {
    await apiFetch(`/recipes/${recipeId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    await refreshRecipes();
  };

  const handleDeleteRecipe = async (recipe) => {
    const confirmed = window.confirm(`Delete recipe "${recipe.name}"?`);

    if (!confirmed) {
      return;
    }

    try {
      await apiFetch(`/recipes/${recipe._id}`, { method: "DELETE" });
      await refreshRecipes();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleSubmitRecipe = async (formData) => {
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

      if (editingRecipe) {
        await handleUpdateRecipe(editingRecipe._id, payload);
      } else {
        await apiFetch("/recipes", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        await refreshRecipes();
      }

      setShowCreateRecipeForm(false);
      setEditingRecipe(null);
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
  const handleCreateStockAdjustment = async (payload) => {
    try {
      await apiFetch("/stock-adjustments", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      await refreshDashboard();
      const updatedStockItems = await refreshStockItems();

      const updatedItem = updatedStockItems.find(
          (stockItem) => stockItem._id === payload.stockItem
      );
      setSelectedStockItem(updatedItem);

      await loadItemMovements(payload.stockItem);

      setShowAdjustStockForm(false);
    } catch (error) {
      setError(error.message);
    }
  };

  const page = getPage(activePage);
  const implementedPages = [
    "dashboard",
    "stock-items",
    "deliveries",
    "suppliers",
    "recipes",
    "prep",
    "production",
    "management",
  ];

  const renderPageContent = () => {
    if (loading) {
      return <p className="muted">Loading...</p>;
    }

    if (error) {
      return (
        <section className="panel">
          <p className="error">Error: {error}</p>
        </section>
      );
    }

    if (!canAccessPage(activePage, role)) {
      return null;
    }

    return (
      <>
        {activePage === "dashboard" && <DashboardView dashboard={dashboard} />}

        {activePage === "stock-items" &&
            (selectedStockItem ? (
                <StockItemDetailView
                    item={selectedStockItem}
                    movements={selectedItemMovements}
                    movementsLoading={movementsLoading}
                    onBack={handleBackToStockItems}
                    showAdjustForm={showAdjustStockForm}
                    onAdjustStockClick={() => setShowAdjustStockForm(true)}
                    onCancelAdjust={() => setShowAdjustStockForm(false)}
                    onSubmitAdjustment={handleCreateStockAdjustment}
                />
            ) : showCreateStockItemForm ? (
                <CreateStockItemForm
                    editingStockItem={editingStockItem}
                    onSubmit={handleSubmitStockItem}
                    onCancel={() => {
                      setShowCreateStockItemForm(false);
                      setEditingStockItem(null);
                    }}
                />
            ) : (
                <StockItemsView
                    stockItems={stockItems}
                    onStockItemClick={handleStockItemClick}
                    onAddStockItem={() => setShowCreateStockItemForm(true)}
                    onEditStockItem={handleEditStockItemClick}
                    onDeleteStockItem={handleDeleteStockItem}
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
                    editingSupplier={editingSupplier}
                    onSubmit={handleSubmitSupplier}
                    onCancel={() => {
                      setShowCreateSupplierForm(false);
                      setEditingSupplier(null);
                    }}
                />
            ) : (
                <SuppliersView
                    suppliers={suppliers}
                    onAddSupplier={() => setShowCreateSupplierForm(true)}
                    onEditSupplier={handleEditSupplierClick}
                    onDeleteSupplier={handleDeleteSupplier}
                />
            ))}

        {activePage === "recipes" &&
            (showCreateRecipeForm ? (
                <CreateRecipeForm
                    recipes={recipes}
                    stockItems={stockItems}
                    editingRecipe={editingRecipe}
                    onSubmit={handleSubmitRecipe}
                    onCancel={() => {
                      setShowCreateRecipeForm(false);
                      setEditingRecipe(null);
                    }}
                />
            ) : (
                <RecipesView
                    recipes={recipes}
                    onAddRecipe={() => setShowCreateRecipeForm(true)}
                    onEditRecipe={handleEditRecipeClick}
                    onDeleteRecipe={handleDeleteRecipe}
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
        {activePage === "management" && <ManagementView />}

        {!implementedPages.includes(activePage) && (
          <ComingSoonView title={page?.title || "Coming Soon"} />
        )}
      </>
    );
  };

  return (
    <AppLayout activePage={activePage} onNavigate={handleNavigate}>
      {page && (
        <PageHeader eyebrow={page.section} title={page.title} subtitle={page.subtitle} />
      )}

      {renderPageContent()}
    </AppLayout>
  );
}

export default App;
