import { useEffect, useRef, useState } from "react";
import { formatEuro, formatDate, formatShortDate } from "../utils/format";

const HEIGHT = 220;
// Space around the plot for the axis labels.
const MARGIN = { top: 16, right: 16, bottom: 28, left: 64 };

// Picks 3-6 "round" tick values (e.g. 36, 38, 40, 42) that cover min..max.
function getNiceTicks(min, max) {
    if (min === max) {
        // Every price is the same: make room above and below it.
        min = min * 0.9;
        max = max * 1.1 || 1;
    }

    const roughStep = (max - min) / 4;
    const magnitude = 10 ** Math.floor(Math.log10(roughStep));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => (max - min) / s <= 5);

    const first = Math.floor(min / step) * step;
    const ticks = [];
    for (let value = first; value <= max + step * 0.001; value += step) {
        ticks.push(Number(value.toFixed(10)));
    }
    if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + step);
    return ticks;
}

// Draws price over time as a "step" line: a price stays the same until the
// next delivery changes it, so the line moves flat, then jumps.
function PriceHistoryChart({ history, unit }) {
    const containerRef = useRef(null);
    const [width, setWidth] = useState(600);
    const [activeIndex, setActiveIndex] = useState(null);

    // Measure the container so the chart fills it at any screen width.
    useEffect(() => {
        const observer = new ResizeObserver(([entry]) => {
            setWidth(entry.contentRect.width);
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    const points = history.map((entry) => ({ ...entry, time: new Date(entry.date).getTime() }));
    const prices = points.map((p) => p.unitCost);
    const yTicks = getNiceTicks(Math.min(...prices), Math.max(...prices));

    const plotWidth = Math.max(width - MARGIN.left - MARGIN.right, 50);
    const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    // Scales: turn a date / price into a pixel position.
    const firstTime = points[0].time;
    const lastTime = points[points.length - 1].time;
    const x = (time) =>
        MARGIN.left + (lastTime === firstTime ? plotWidth / 2 : ((time - firstTime) / (lastTime - firstTime)) * plotWidth);
    const yMin = yTicks[0];
    const yMax = yTicks[yTicks.length - 1];
    const y = (price) => MARGIN.top + plotHeight - ((price - yMin) / (yMax - yMin)) * plotHeight;

    // Step path: move to the first point, then for each next point go
    // horizontally to its date (H) and vertically to its price (V).
    const path = points
        .map((p, i) => (i === 0 ? `M ${x(p.time)} ${y(p.unitCost)}` : `H ${x(p.time)} V ${y(p.unitCost)}`))
        .join(" ");

    // Find the delivery closest to the pointer, so the reader only has to aim at a date.
    const handlePointerMove = (event) => {
        const svgLeft = event.currentTarget.getBoundingClientRect().left;
        const pointerX = event.clientX - svgLeft;
        let closest = 0;
        points.forEach((p, i) => {
            if (Math.abs(x(p.time) - pointerX) < Math.abs(x(points[closest].time) - pointerX)) closest = i;
        });
        setActiveIndex(closest);
    };

    // Keyboard: left/right arrows step through the deliveries.
    const handleKeyDown = (event) => {
        if (event.key === "ArrowRight") setActiveIndex((i) => Math.min((i ?? -1) + 1, points.length - 1));
        if (event.key === "ArrowLeft") setActiveIndex((i) => Math.max((i ?? points.length) - 1, 0));
    };

    const active = activeIndex !== null ? points[activeIndex] : null;
    const xLabels = [points[0], points[points.length - 1]];

    return (
        <div className="price-chart" ref={containerRef}>
            <svg
                width={width}
                height={HEIGHT}
                role="img"
                aria-label={`Price per ${unit} over ${points.length} deliveries, from ${formatEuro(prices[0])} to ${formatEuro(prices[prices.length - 1])}. Use the arrow keys to read each delivery.`}
                tabIndex={0}
                onPointerMove={handlePointerMove}
                onPointerLeave={() => setActiveIndex(null)}
                onFocus={() => setActiveIndex(points.length - 1)}
                onBlur={() => setActiveIndex(null)}
                onKeyDown={handleKeyDown}
            >
                {/* Horizontal gridlines + price labels */}
                {yTicks.map((tick) => (
                    <g key={tick}>
                        <line className="chart-grid" x1={MARGIN.left} x2={MARGIN.left + plotWidth} y1={y(tick)} y2={y(tick)} />
                        <text className="chart-axis-label" x={MARGIN.left - 10} y={y(tick)} textAnchor="end" dominantBaseline="middle">
                            {formatEuro(tick)}
                        </text>
                    </g>
                ))}

                {/* First and last date */}
                {xLabels.map((p, i) => (
                    <text
                        key={i}
                        className="chart-axis-label"
                        x={x(p.time)}
                        y={HEIGHT - 6}
                        textAnchor={i === 0 ? "start" : "end"}
                    >
                        {formatShortDate(p.date)}
                    </text>
                ))}

                {/* Crosshair at the active delivery */}
                {active && (
                    <line
                        className="chart-crosshair"
                        x1={x(active.time)}
                        x2={x(active.time)}
                        y1={MARGIN.top}
                        y2={MARGIN.top + plotHeight}
                    />
                )}

                <path className="chart-line" d={path} />

                {points.map((p, i) => (
                    <circle
                        key={p.deliveryId + i}
                        className={`chart-dot ${i === activeIndex ? "active" : ""}`}
                        cx={x(p.time)}
                        cy={y(p.unitCost)}
                        r={i === activeIndex ? 6 : 4}
                    />
                ))}
            </svg>

            {active && (
                <div
                    className="chart-tooltip"
                    style={{
                        left: Math.min(Math.max(x(active.time), 90), width - 90),
                        top: y(active.unitCost) - 12,
                    }}
                >
                    <strong>{formatEuro(active.unitCost)}</strong>
                    <span>{formatDate(active.date)}</span>
                    <span>{active.supplier}</span>
                </div>
            )}
        </div>
    );
}

export default PriceHistoryChart;