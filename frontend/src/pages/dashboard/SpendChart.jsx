import { formatEuro, formatShortDate } from "../../utils/format";

// One bar per week. Each bar's height is its share of the biggest week.
function SpendChart({ weeks }) {
    const biggest = Math.max(...weeks.map((week) => week.total));

    if (biggest === 0) return <p className="muted">No priced deliveries in the last 8 weeks.</p>;

    // Screen readers get the numbers as text, since they can't see bar heights.
    const summary = weeks
        .map((week) => `Week of ${formatShortDate(week.weekStart)}: ${formatEuro(week.total)}`)
        .join(", ");

    return (
        <div className="spend-chart" role="img" aria-label={summary}>
            {weeks.map((week) => (
                <div className="spend-column" key={week.weekStart}>
                    <div className="spend-track">
                        <div
                            className="spend-bar"
                            style={{ height: `${(week.total / biggest) * 100}%` }}
                            tabIndex={0}
                        >
                            <span className="spend-tooltip">{formatEuro(week.total)}</span>
                        </div>
                    </div>
                    <span className="spend-label">{formatShortDate(week.weekStart)}</span>
                </div>
            ))}
        </div>
    );
}

export default SpendChart;