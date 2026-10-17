import { useState } from "react";
import { apiFetch } from "../utils/api";
import { useApi } from "../hooks/useApi";
import { formatStockWarnings } from "../utils/format";
import ErrorBanner from "../components/ErrorBanner";
import PrepTasksView from "./PrepTasksView";
import CreatePrepTaskForm from "../forms/CreatePrepTaskForm";

function PrepTasksPage() {
    const prepTasks = useApi("/prep-tasks");
    const recipes = useApi("/recipes");

    const [showForm, setShowForm] = useState(false);
    const [actionError, setActionError] = useState("");
    const [stockWarning, setStockWarning] = useState("");

    // Errors are thrown back to the form, which shows them.
    const handleSave = async (formData) => {
        await apiFetch("/prep-tasks", { method: "POST", body: JSON.stringify(formData) });
        await prepTasks.reload();
        setShowForm(false);
    };

    const handleComplete = async (taskId) => {
        try {
            setActionError("");
            setStockWarning("");

            const data = await apiFetch(`/prep-tasks/${taskId}/complete`, { method: "PATCH" });
            setStockWarning(formatStockWarnings(data.stockWarnings));

            await prepTasks.reload();
        } catch (err) {
            setActionError(err.message);
        }
    };

    const loading = prepTasks.loading || recipes.loading;
    const error = prepTasks.error || recipes.error;

    if (loading) return <p className="muted">Loading prep list...</p>;
    if (error && !prepTasks.data) return <p className="error">{error}</p>;

    return (
        <div className="page-stack">
            <ErrorBanner message={actionError} onDismiss={() => setActionError("")} />
            <ErrorBanner
                tone="warning"
                message={stockWarning && `Task completed, but some stock looks off:\n${stockWarning}`}
                onDismiss={() => setStockWarning("")}
            />

            {showForm && (
                <CreatePrepTaskForm
                    recipes={recipes.data}
                    onSubmit={handleSave}
                    onCancel={() => setShowForm(false)}
                />
            )}

            <PrepTasksView
                prepTasks={prepTasks.data}
                isFormOpen={showForm}
                onAddPrepTask={() => setShowForm(true)}
                onCompleteTask={handleComplete}
            />
        </div>
    );
}

export default PrepTasksPage;