import { useEffect, useState } from "react";
import "./App.css";

import AppLayout from "./components/AppLayout";
import PageHeader from "./components/PageHeader";
import ComingSoonView from "./components/ComingSoonView";

import DashboardView from "./pages/DashboardView";
import StockItemsView from "./pages/StockItemsView";
import StockItemDetailView from "./pages/StockItemDetailView";
import RecipesView from "./pages/RecipesView";
import ProductionView from "./pages/ProductionBatchesView.jsx";
import PrepTasksView from "./pages/PrepTasksView";
import CreatePrepTaskForm from "./forms/CreatePrepTaskForm";
import CreateStockItemForm from "./forms/CreateStockItemForm";
import CreateRecipeForm from "./forms/CreateRecipeForm";
import CreateProductionBatchForm from "./forms/CreateProductionBatchForm";
import ManagementView from "./pages/management/ManagementView";
import AccountView from "./pages/account/AccountView";
import MenuView from "./pages/menu/MenuView";
import SuppliersPage from "./pages/SuppliersPage.jsx";
import DeliveriesPage from "./pages/DeliveriesPage.jsx";
import RecipesPage from "./pages/RecipesPage.jsx";

import { getPage, canAccessPage } from "./constants/navigation";
import { useAuth } from "./context/AuthContext";

import { apiFetch } from "./utils/api";

function App() {
  const { currentRestaurantId, role } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [stockItems, setStockItems] = useState([]);
  const [activePage, setActivePage] = useState("dashboard");
  const [suppliers, setSuppliers] = useState([]);
  const [selectedStockItem, setSelectedStockItem] = useState(null);
  const [editingStockItem, setEditingStockItem] = useState(null);
  const [selectedItemMovements, setSelectedItemMovements] = useState([]);
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [showCreateStockItemForm, setShowCreateStockItemForm] = useState(false);
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
  const [actionError, setActionError] = useState("");

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
    setShowCreateRecipeForm(false);
    setShowCreateProductionBatchForm(false);
    setShowCreatePrepTaskForm(false);
    setEditingRecipe(null);
    setEditingStockItem(null);
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


  const handleEditStockItemClick = (item) => {
    setEditingStockItem(item);
    setShowCreateStockItemForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  // The form builds the payload and shows any error itself, so this just
  // sends it. Errors are thrown back to the form instead of replacing the page.
  const handleSubmitStockItem = async (payload) => {
    if (editingStockItem) {
      await apiFetch(`/stock-items/${editingStockItem._id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    } else {
      await apiFetch("/stock-items", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }

    await refreshStockItems();
    setShowCreateStockItemForm(false);
    setEditingStockItem(null);
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
      const isPrep = formData.recipeType === "prep";
      const outputItem = stockItems.find((item) => item._id === formData.outputStockItem);

      const payload = {
        name: formData.name,
        recipeType: formData.recipeType,
        // Prep output is added straight onto the item's stock, so it has to
        // be in that item's stock unit.
        outputUnit: isPrep ? outputItem.stockUnit : formData.outputUnit,
        portionsPerOutput:
            !isPrep && formData.portionsPerOutput !== "" ? Number(formData.portionsPerOutput) : null,
        outputStockItem: isPrep ? formData.outputStockItem : null,
        outputQuantity: isPrep ? Number(formData.outputQuantity) : null,
        ingredients: formData.ingredients.map((ingredient) => {
          const stockItem = stockItems.find((item) => item._id === ingredient.stockItem);

          return {
            stockItem: ingredient.stockItem,
            quantity: Number(ingredient.quantity),
            // Always the item's own recipe unit: that's what the backend converts from.
            unit: stockItem.recipeUnit || stockItem.stockUnit,
            isOptional: ingredient.isOptional,
          };
        }),
        notes: formData.notes,
        isActive: true,
      };

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

  };
  const handleCreateProductionBatch = async (formData) => {
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

  };
  const handleCreatePrepTask = async (formData) => {
      await apiFetch("/prep-tasks", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      await refreshPrepTasks();
      setShowCreatePrepTaskForm(false);
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
    "account",
    "menu",
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
            ) : (
                <div className="page-stack">
                  {showCreateStockItemForm && (
                      <CreateStockItemForm
                          key={editingStockItem?._id ?? "new"}
                          editingStockItem={editingStockItem}
                          stockItems={stockItems}
                          suppliers={suppliers}
                          onSubmit={handleSubmitStockItem}
                          onCancel={() => {
                            setShowCreateStockItemForm(false);
                            setEditingStockItem(null);
                          }}
                      />
                  )}

                  <StockItemsView
                      stockItems={stockItems}
                      isFormOpen={showCreateStockItemForm}
                      onStockItemClick={handleStockItemClick}
                      onAddStockItem={() => setShowCreateStockItemForm(true)}
                      onEditStockItem={handleEditStockItemClick}
                      onDeleteStockItem={handleDeleteStockItem}
                  />
                </div>
            ))}

        {activePage === "deliveries" && <DeliveriesPage />}

        {activePage === "suppliers" && <SuppliersPage />}

        {activePage === "recipes" && <RecipesPage />}

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
        {activePage === "account" && <AccountView />}
        {activePage === "menu" && <MenuView key={currentRestaurantId} />}

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
      {actionError && (
          <div className="alert" role="alert">
            <span>{actionError}</span>
            <button type="button" className="link-button" onClick={() => setActionError("")}>
              Dismiss
            </button>
          </div>
      )}
      {renderPageContent()}
    </AppLayout>
  );
}

export default App;
