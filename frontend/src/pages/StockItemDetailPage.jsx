import { useState } from "react";
import { apiFetch } from "../utils/api";
import { useApi } from "../hooks/useApi";
import StockItemDetailView from "./StockItemDetailView";

// One stock item: its numbers, movement history and Adjust Stock.
function StockItemDetailPage({ stockItemId, onBack }) {
    const item = useApi(`/stock-items/${stockItemId}`);
    const movements = useApi(`/inventory-movements?stockItem=${stockItemId}`);

    const [showAdjustForm, setShowAdjustForm] = useState(false);

    // Errors are thrown back to the form, which shows them.
    const handleAdjust = async (payload) => {
        await apiFetch("/stock-adjustments", { method: "POST", body: JSON.stringify(payload) });

        // The stock number and the history both changed.
        await Promise.all([item.reload(), movements.reload()]);
        setShowAdjustForm(false);
    };

    if (item.loading) return <p className="muted">Loading item...</p>;
    if (item.error && !item.data) return <p className="error">{item.error}</p>;

    return (
        <StockItemDetailView
            item={item.data}
            movements={movements.data?.movements ?? []}
            movementsLoading={movements.loading}
            onBack={onBack}
            showAdjustForm={showAdjustForm}
            onAdjustStockClick={() => setShowAdjustForm(true)}
            onCancelAdjust={() => setShowAdjustForm(false)}
            onSubmitAdjustment={handleAdjust}
        />
    );
}

export default StockItemDetailPage;