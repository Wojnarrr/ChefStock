import { useApi } from "../../hooks/useApi";
import { formatEuro } from "../../utils/format";
import StatCard from "../../components/StatCard";
import SpendChart from "./SpendChart";

// "+12% vs this point last month"
const describeChange = (now, before) => {
    if (!before) return "Nothing to compare with yet";

    const change = Math.round(((now - before) / before) * 100);
    if (change === 0) return "Same as this point last month";
    return `${change > 0 ? "+" : ""}${change}% vs this point last month`;
};

function RankedList({ rows, empty }) {
    if (rows.length === 0) return <p className="muted">{empty}</p>;

    return (
        <ol className="ranked-list">
            {rows.map((row) => (
                <li key={row.name}>
                    <span>{row.name}</span>
                    <strong>{formatEuro(row.total)}</strong>
                </li>
            ))}
        </ol>
    );
}

function CostsSection() {
    const { data, loading, error } = useApi("/dashboard/costs");

    if (loading) return <p className="muted">Working out costs...</p>;
    if (error) return <p className="error">{error}</p>;

    return (
        <>
            <section className="stats-grid">
                <StatCard
                    label="Spent this month"
                    value={formatEuro(data.spentThisMonth)}
                    description={describeChange(data.spentThisMonth, data.spentLastMonthSoFar)}
                />
                <StatCard
                    label="Waste this month"
                    value={formatEuro(data.wasteValue)}
                    description="Waste, damaged and expired"
                />
                <StatCard
                    label="Stock on hand"
                    value={formatEuro(data.stockValue)}
                    description="What your stock is worth today"
                />
            </section>

            <section className="content-grid">
                <div className="panel">
                    <h2>Spend per week</h2>
                    <SpendChart weeks={data.weeklySpend} />
                </div>

                <div className="panel">
                    <h2>Where the money goes</h2>
                    <RankedList rows={data.spendBySupplier} empty="No priced deliveries this month." />

                    <h3 className="form-section-title">Most wasted</h3>
                    <RankedList rows={data.topWaste} empty="No waste logged this month." />
                </div>
            </section>
        </>
    );
}

export default CostsSection;