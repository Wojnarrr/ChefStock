import { useApi } from "../hooks/useApi";
import DashboardView from "./DashboardView";

function DashboardPage() {
    const { data, loading, error } = useApi("/dashboard/summary");

    if (loading) return <p className="muted">Loading...</p>;
    if (error) return <p className="error">{error}</p>;

    return <DashboardView dashboard={data} />;
}

export default DashboardPage;