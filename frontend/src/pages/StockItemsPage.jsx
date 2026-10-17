import { useState } from "react";
import { apiFetch } from "../utils/api";
import { useApi } from "../hooks/useApi";
import ErrorBanner from "../components/ErrorBanner";
import StockItemsView from "./StockItemsView";
import StockItemDetailPage from "./StockItemDetailPage";
import CreateStockItemForm from "../forms/CreateStockItemForm";

function StockItemsPage() {
    const stockItems = useApi("/stock-items");
    const suppliers = useApi("/suppliers");

    // null = form closed, "new" = adding, a stock item object = editing it.
    const [formMode, setFormMode] = useState(null);
    // The item whose detail page is open, or null for the list.
    const [selectedId, setSelectedId] = useState(null);
    const [actionError, setActionError] = useState("");

    // Errors are thrown back to the form, which shows them.
    const handleSave = async (payload) => {
        const isNew = formMode === "new";

        await apiFetch(isNew ? "/stock-items" : `/stock-items/${formMode._id}`, {
            method: isNew ? "POST" : "PUT",
            body: JSON.stringify(payload),
        });

        await stockItems.reload();
        setFormMode(null);
    };

    const handleDelete = async (item) => {
        if (!window.confirm(`Delete stock item "${item.name}"?`)) return;

        try {
            setActionError("");
            await apiFetch(`/stock-items/${item._id}`, { method: "DELETE" });
            await stockItems.reload();
        } catch (err) {
            setActionError(err.message);
        }
    };

    const handleEdit = (item) => {
        setFormMode(item);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Coming back from an item: reload, because Adjust Stock may have changed it.
    const handleBack = () => {
        setSelectedId(null);
        stockItems.reload();
    };

    if (selectedId) {
        return <StockItemDetailPage stockItemId={selectedId} onBack={handleBack} />;
    }

    const loading = stockItems.loading || suppliers.loading;
    const error = stockItems.error || suppliers.error;

    if (loading) return <p className="muted">Loading stock...</p>;
    if (error && !stockItems.data) return <p className="error">{error}</p>;

    return (
        <div className="page-stack">
            <ErrorBanner message={actionError} onDismiss={() => setActionError("")} />

            {formMode && (
                <CreateStockItemForm
                    key={formMode === "new" ? "new" : formMode._id}
                    editingStockItem={formMode === "new" ? null : formMode}
                    stockItems={stockItems.data}
                    suppliers={suppliers.data}
                    onSubmit={handleSave}
                    onCancel={() => setFormMode(null)}
                />
            )}

            <StockItemsView
                stockItems={stockItems.data}
                isFormOpen={Boolean(formMode)}
                onStockItemClick={(item) => setSelectedId(item._id)}
                onAddStockItem={() => setFormMode("new")}
                onEditStockItem={handleEdit}
                onDeleteStockItem={handleDelete}
            />
        </div>
    );
}

export default StockItemsPage;