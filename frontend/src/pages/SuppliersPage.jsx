import { useState } from "react";
import { apiFetch } from "../utils/api";
import { useApi } from "../hooks/useApi";
import ErrorBanner from "../components/ErrorBanner";
import SuppliersView from "./SuppliersView";
import CreateSupplierForm from "../forms/CreateSupplierForm";

// Everything for the Suppliers page: its data, the form, saving and deleting.
function SuppliersPage() {
    const { data: suppliers, loading, error, reload } = useApi("/suppliers");

    // null = form closed, "new" = adding, a supplier object = editing it.
    const [formMode, setFormMode] = useState(null);
    const [actionError, setActionError] = useState("");

    // Errors are thrown back to the form, which shows them.
    const handleSave = async (formData) => {
        const isNew = formMode === "new";

        await apiFetch(isNew ? "/suppliers" : `/suppliers/${formMode._id}`, {
            method: isNew ? "POST" : "PUT",
            body: JSON.stringify(formData),
        });

        await reload();
        setFormMode(null);
    };

    const handleDelete = async (supplier) => {
        if (!window.confirm(`Delete supplier "${supplier.name}"?`)) return;

        try {
            setActionError("");
            await apiFetch(`/suppliers/${supplier._id}`, { method: "DELETE" });
            await reload();
        } catch (err) {
            setActionError(err.message);
        }
    };

    const handleEdit = (supplier) => {
        setFormMode(supplier);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    if (loading) return <p className="muted">Loading suppliers...</p>;
    if (error && !suppliers) return <p className="error">{error}</p>;

    return (
        <div className="page-stack">
            <ErrorBanner message={actionError} onDismiss={() => setActionError("")} />

            {formMode && (
                <CreateSupplierForm
                    key={formMode === "new" ? "new" : formMode._id}
                    editingSupplier={formMode === "new" ? null : formMode}
                    onSubmit={handleSave}
                    onCancel={() => setFormMode(null)}
                />
            )}

            <SuppliersView
                suppliers={suppliers}
                isFormOpen={Boolean(formMode)}
                onAddSupplier={() => setFormMode("new")}
                onEditSupplier={handleEdit}
                onDeleteSupplier={handleDelete}
            />
        </div>
    );
}

export default SuppliersPage;