import { useState } from "react";
import { apiFetch } from "../utils/api";
import { useApi } from "../hooks/useApi";
import DeliveriesView from "./DeliveriesView";
import CreateDeliveryForm from "../forms/CreateDeliveryForm";

// Turns what the form holds into what the API expects.
const toPayload = (formData, stockItems) => {
    const today = new Date().toLocaleDateString("en-CA");

    return {
        supplier: formData.supplier,
        // Leave the date out for today's deliveries so the server stamps the
        // exact time. Only send it when back-dating.
        deliveryDate: formData.deliveryDate === today ? undefined : formData.deliveryDate,
        invoiceNumber: formData.invoiceNumber,
        notes: formData.notes,
        items: formData.items.map((line) => {
            const stockItem = stockItems.find((item) => item._id === line.stockItem);

            return {
                stockItem: line.stockItem,
                unit: stockItem.stockUnit,
                quantityReceived: Number(line.quantity),
                quantityAccepted: line.hasProblem ? Number(line.quantityKept) : Number(line.quantity),
                // Empty box = no price entered = null (not 0, which would mean "free").
                unitCost: line.unitCost === "" ? null : Number(line.unitCost),
                issueType: line.hasProblem ? line.issueType : "none",
                issueNotes: line.hasProblem ? line.issueNotes : "",
            };
        }),
    };
};

function DeliveriesPage() {
    const deliveries = useApi("/deliveries");
    const suppliers = useApi("/suppliers");
    const stockItems = useApi("/stock-items");

    const [showForm, setShowForm] = useState(false);

    // Errors are thrown back to the form, which shows them.
    const handleSave = async (formData) => {
        await apiFetch("/deliveries", {
            method: "POST",
            body: JSON.stringify(toPayload(formData, stockItems.data)),
        });

        // A delivery changes stock levels and last prices, so reload both.
        await Promise.all([deliveries.reload(), stockItems.reload()]);
        setShowForm(false);
    };

    const loading = deliveries.loading || suppliers.loading || stockItems.loading;
    const error = deliveries.error || suppliers.error || stockItems.error;

    if (loading) return <p className="muted">Loading deliveries...</p>;
    if (error && !deliveries.data) return <p className="error">{error}</p>;

    return (
        <div className="page-stack">
            {showForm && (
                <CreateDeliveryForm
                    suppliers={suppliers.data}
                    stockItems={stockItems.data}
                    onSubmit={handleSave}
                    onCancel={() => setShowForm(false)}
                />
            )}

            <DeliveriesView
                deliveries={deliveries.data}
                isFormOpen={showForm}
                onAddDelivery={() => setShowForm(true)}
            />
        </div>
    );
}

export default DeliveriesPage;