// How a menu item's food cost compares with the restaurant's target.
// Each status has a label and a symbol as well as a colour, so it's
// readable without relying on colour alone.
export function getFoodCostStatus(costing, target) {
    if (!costing.isComplete) {
        return { key: "missing", symbol: "?", label: "Missing prices" };
    }
    if (costing.foodCostPercent === null) {
        return { key: "missing", symbol: "?", label: "No sell price" };
    }
    if (costing.foodCostPercent <= target) {
        return { key: "ok", symbol: "✓", label: "On target" };
    }
    if (costing.foodCostPercent <= target + 5) {
        return { key: "warn", symbol: "!", label: "Close to target" };
    }
    return { key: "over", symbol: "✕", label: "Over target" };
}