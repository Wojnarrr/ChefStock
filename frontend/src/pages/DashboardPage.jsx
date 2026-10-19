import { useApi } from "../hooks/useApi";
import DashboardView from "./DashboardView";
import { useAuth } from "../context/AuthContext";
import CostsSection from "./dashboard/CostsSection";

function DashboardPage() {
    const { data, loading, error } = useApi("/dashboard/summary");
    const { role } = useAuth();

    if (loading) return <p className="muted">Loading...</p>;
    if (error) return <p className="error">{error}</p>;

    return (
        <div className="page-stack">
            {role === "owner" && <CostsSection />}
            <DashboardView dashboard={data} />

        </div>
    );}

export default DashboardPage;