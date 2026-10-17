import { useState } from "react";
import { apiFetch } from "../utils/api";
import { useApi } from "../hooks/useApi";
import { formatStockWarnings } from "../utils/format";
import ErrorBanner from "../components/ErrorBanner";
import ProductionView from "./ProductionBatchesView";
import CreateProductionBatchForm from "../forms/CreateProductionBatchForm";

const toPayload = (formData) => ({
    itemsProduced: formData.itemsProduced.map((item) => ({
        recipe: item.recipe,
        quantityProduced: Number(item.quantityProduced),
        outputUnit: item.outputUnit,
    })),
    notes: formData.notes,
});

function ProductionPage() {
    const batches = useApi("/production-batches");
    const recipes = useApi("/recipes");

    const [showForm, setShowForm] = useState(false);
    const [stockWarning, setStockWarning] = useState("");

    // Errors are thrown back to the form, which shows them.
    const handleSave = async (formData) => {
        setStockWarning("");

        const data = await apiFetch("/production-batches", {
            method: "POST",
            body: JSON.stringify(toPayload(formData)),
        });

        setStockWarning(formatStockWarnings(data.stockWarnings));
        await batches.reload();
        setShowForm(false);
    };

    const loading = batches.loading || recipes.loading;
    const error = batches.error || recipes.error;

    if (loading) return <p className="muted">Loading production...</p>;
    if (error && !batches.data) return <p className="error">{error}</p>;

    return (
        <div className="page-stack">
            <ErrorBanner
                tone="warning"
                message={stockWarning && `Production recorded, but some stock looks off:\n${stockWarning}`}
                onDismiss={() => setStockWarning("")}
            />

            {showForm && (
                <CreateProductionBatchForm
                    recipes={recipes.data}
                    onSubmit={handleSave}
                    onCancel={() => setShowForm(false)}
                />
            )}

            <ProductionView
                productionBatches={batches.data}
                isFormOpen={showForm}
                onAddProductionBatch={() => setShowForm(true)}
            />
        </div>
    );
}

export default ProductionPage;