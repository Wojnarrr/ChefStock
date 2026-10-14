import { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";
import { formatEuro, formatDate } from "../utils/format";
import StatCard from "./StatCard";
import PriceHistoryChart from "./PriceHistoryChart";

function PriceHistoryPanel({ item }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadHistory = async () => {
            try {
                const data = await apiFetch(`/stock-items/${item._id}/price-history`);
                setHistory(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadHistory();
    }, [item._id]);

    if (loading) return <p className="muted">Loading prices...</p>;
    if (error) return <p className="error">{error}</p>;

    if (history.length === 0) {
        return (
            <p className="muted">
                No prices recorded yet. Add a cost per {item.stockUnit} when you log a delivery.
            </p>
        );
    }

    const latest = history[history.length - 1];
    const prices = history.map((entry) => entry.unitCost);

    // The most recent delivery where the price was DIFFERENT from today's.
    // (Comparing with just the previous delivery would show "no change" whenever
    // the last two deliveries happened to cost the same.)
    const lastDifferentIndex = history.findLastIndex((entry) => entry.unitCost !== latest.unitCost);

    let changeValue = "No change";
    let changeDescription = `Same price across ${history.length} ${history.length === 1 ? "delivery" : "deliveries"}`;

    if (lastDifferentIndex !== -1) {
        const before = history[lastDifferentIndex];
        const changedOn = history[lastDifferentIndex + 1]; // the delivery where the new price started
        const change = latest.unitCost - before.unitCost;
        const percent = before.unitCost > 0 ? (change / before.unitCost) * 100 : 0;

        // An arrow and a sign, not just a colour, so the direction is clear to everyone.
        const arrow = change > 0 ? "▲" : "▼";
        const sign = change > 0 ? "+" : "−";
        changeValue = `${arrow} ${sign}${formatEuro(Math.abs(change))}`;
        changeDescription = `${sign}${Math.abs(percent).toFixed(1)}% on ${formatDate(changedOn.date)} (was ${formatEuro(before.unitCost)})`;
    }

    return (
        <>
            <div className="detail-stats-grid">
                <StatCard
                    label="Latest price"
                    value={formatEuro(latest.unitCost)}
                    description={`Per ${item.stockUnit} · ${latest.supplier}, ${formatDate(latest.date)}`}
                />
                <StatCard label="Change" value={changeValue} description={changeDescription} />
                <StatCard
                    label="Lowest price"
                    value={formatEuro(Math.min(...prices))}
                    description={`Highest ${formatEuro(Math.max(...prices))} · ${history.length} ${history.length === 1 ? "delivery" : "deliveries"}`}
                />
            </div>

            {history.length > 1 && <PriceHistoryChart history={history} unit={item.stockUnit} />}

            {/* The same numbers as a table, for anyone who can't use the chart. */}
            <details className="chart-table">
                <summary>Show all prices as a table</summary>
                <table className="stock-table">
                    <thead>
                    <tr>
                        <th>Date</th>
                        <th>Supplier</th>
                        <th>Price per {item.stockUnit}</th>
                    </tr>
                    </thead>
                    <tbody>
                    {[...history].reverse().map((entry, i) => (
                        <tr key={entry.deliveryId + i}>
                            <td>{formatDate(entry.date)}</td>
                            <td>{entry.supplier}</td>
                            <td>{formatEuro(entry.unitCost)}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </details>
        </>
    );
}

export default PriceHistoryPanel;