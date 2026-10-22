import { useEffect, useState } from "react";
import { apiFetch } from "../../utils/api";
import { formatEuro } from "../../utils/format";
import StatCard from "../../components/StatCard";
import MenuItemForm from "./MenuItemForm";
import { getFoodCostStatus } from "./menuStatus";

// "1 of 8 · Margherita tray" and/or "1 can · Coke can", one line each.
function MadeFrom({ item }) {
    const lines = [];

    if (item.recipe) {
        const ofTotal = item.recipe.portionsPerOutput ? ` of ${item.recipe.portionsPerOutput}` : "";
        lines.push(`${item.portions}${ofTotal} · ${item.recipe.name}`);
    }

    for (const extra of item.extras) {
        const unit = extra.stockItem?.recipeUnit ? ` ${extra.stockItem.recipeUnit}` : "";
        lines.push(`${extra.quantity}${unit} · ${extra.stockItem?.name || "Removed item"}`);
    }

    return lines.map((line, i) => (
        <span key={i} className={i === 0 ? "made-from-main" : "cell-subtext"}>
      {line}
    </span>
    ));
}
function MenuView() {
    const [menu, setMenu] = useState(null); // { menuItems, vatRate, targetFoodCostPercent }
    const [recipes, setRecipes] = useState([]);
    const [stockItems, setStockItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // null = showing the list; "new" = adding; a menu item = editing it.
    const [formMode, setFormMode] = useState(null);

    const loadMenu = async () => {
        const data = await apiFetch("/menu-items");
        setMenu(data);
    };

    useEffect(() => {
        const loadEverything = async () => {
            try {
                const [menuData, recipeData, stockData] = await Promise.all([
                    apiFetch("/menu-items"),
                    apiFetch("/recipes"),
                    apiFetch("/stock-items"),
                ]);
                setMenu(menuData);
                setRecipes(recipeData);
                setStockItems(stockData);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadEverything();
    }, []);

    // Errors are thrown back to the form, which shows them next to the fields.
    const handleSave = async (payload) => {
        if (formMode === "new") {
            await apiFetch("/menu-items", { method: "POST", body: JSON.stringify(payload) });
        } else {
            await apiFetch(`/menu-items/${formMode._id}`, { method: "PUT", body: JSON.stringify(payload) });
        }

        await loadMenu(); // costs are worked out by the server, so re-fetch
        setFormMode(null);
    };

    const handleRemove = async (item) => {
        if (!window.confirm(`Remove ${item.name} from the menu?`)) return;

        try {
            await apiFetch(`/menu-items/${item._id}`, { method: "DELETE" });
            await loadMenu();
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <p className="muted">Loading menu...</p>;
    if (error && !menu) return <p className="error">{error}</p>;

    if (formMode) {
        return (
            <MenuItemForm
                recipes={recipes}
                stockItems={stockItems}
                editingItem={formMode === "new" ? null : formMode}
                onSubmit={handleSave}
                onCancel={() => setFormMode(null)}
            />
        );
    }

    const { menuItems, vatRate, targetFoodCostPercent: target } = menu;

    // Summary numbers. The average only uses fully priced items, so a missing
    // price can't drag it down and make things look better than they are.
    const priced = menuItems.filter((item) => item.costing.isComplete && item.costing.foodCostPercent !== null);
    const averageFoodCost = priced.length
        ? priced.reduce((sum, item) => sum + item.costing.foodCostPercent, 0) / priced.length
        : null;
    const overTarget = priced.filter((item) => item.costing.foodCostPercent > target).length;
    const missingNames = [...new Set(menuItems.flatMap((item) => item.costing.missing))];

    return (
        <>
            {vatRate === null && (
                <p className="notice">
                    Your VAT rate isn't set, so food cost % below is worked out on prices <strong>including</strong> VAT and
                    looks lower than it really is. Set it in Management → Restaurant.
                </p>
            )}

            <div className="stats-grid menu-stats">
                <StatCard
                    label="Average food cost"
                    value={averageFoodCost === null ? "—" : `${averageFoodCost.toFixed(1)}%`}
                    description={`Target ${target}% · ${priced.length} fully priced ${priced.length === 1 ? "item" : "items"}`}
                />
                <StatCard
                    label="Over target"
                    value={overTarget}
                    description={overTarget === 1 ? "item costs more than your target" : "items cost more than your target"}
                />
                <StatCard
                    label="Missing prices"
                    value={missingNames.length}
                    description={
                        missingNames.length ? `No price yet: ${missingNames.slice(0, 3).join(", ")}${missingNames.length > 3 ? "…" : ""}` : "Every ingredient has a price"
                    }
                />
            </div>

            <section className="panel">
                <div className="panel-header">
                    <div>
                        <h2>Menu items</h2>
                        <p className="panel-subtitle">
                            Costs use your latest delivery prices. Profit and food cost % are{" "}
                            {vatRate === null ? "on prices including VAT" : `on prices excluding ${vatRate}% VAT`}.
                        </p>
                    </div>
                    <div className="panel-actions">
                        <button type="button" className="primary-button" onClick={() => setFormMode("new")}>
                            Add menu item
                        </button>
                    </div>
                </div>

                {error && <p className="error">{error}</p>}

                {menuItems.length === 0 ? (
                    <p className="muted">No menu items yet. Add your first one to see what it costs to make.</p>
                ) : (
                    <div className="table-wrapper">
                        <table className="stock-table menu-table">
                            <thead>
                            <tr>
                                <th>Item</th>
                                <th>Made from</th>
                                <th className="number">Price</th>
                                <th className="number">Cost</th>
                                <th className="number">Profit</th>
                                <th className="number">Food cost</th>
                                <th>Status</th>
                                <th></th>
                            </tr>
                            </thead>
                            <tbody>
                            {menuItems.map((item) => {
                                const { costing } = item;
                                const status = getFoodCostStatus(costing, target);

                                return (
                                    <tr key={item._id}>
                                        <td>
                                            <strong>{item.name}</strong>
                                            {item.category && <span className="cell-subtext">{item.category}</span>}
                                        </td>
                                        <td><MadeFrom item={item} /></td>
                                        <td className="number">
                                            {formatEuro(item.sellPrice)}
                                            {item.vatRate !== null && item.vatRate !== undefined && (
                                                <span className="cell-subtext">{item.vatRate}% VAT</span>
                                            )}
                                        </td>
                                        <td className="number">{formatEuro(costing.cost)}</td>
                                        <td className="number">{formatEuro(costing.grossProfit)}</td>
                                        <td className="number">
                                            {costing.foodCostPercent === null
                                                ? "—"
                                                : // With missing prices the real cost is higher, so this is a minimum.
                                                `${costing.isComplete ? "" : "≥ "}${costing.foodCostPercent.toFixed(1)}%`}
                                        </td>
                                        <td>
                        <span className={`food-cost-status ${status.key}`}>
                          <span aria-hidden="true">{status.symbol}</span> {status.label}
                        </span>
                                            {!costing.isComplete && (
                                                <span className="cell-subtext">No price: {costing.missing.join(", ")}</span>
                                            )}
                                        </td>
                                        <td className="table-actions">
                                            <button type="button" className="link-button" onClick={() => setFormMode(item)}>
                                                Edit
                                            </button>
                                            <button type="button" className="link-button danger" onClick={() => handleRemove(item)}>
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </>
    );
}

export default MenuView;