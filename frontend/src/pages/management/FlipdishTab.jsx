import { useState } from "react";
import { apiFetch } from "../../utils/api";
import { useApi } from "../../hooks/useApi";
import { formatDate, formatEuro } from "../../utils/format";

// A sale's modifiers can have their own modifiers (size -> extra topping),
// so this component calls itself for each level.
function ModifierList({ modifiers }) {
    if (!modifiers?.length) return null;

    return (
        <ul>
            {modifiers.map((modifier, index) => (
                <li key={index}>
                    {modifier.quantity > 1 ? `${modifier.quantity} x ` : ""}
                    {modifier.name} {modifier.unitPrice ? formatEuro(modifier.unitPrice) : ""}{" "}
                    <code>{modifier.id}</code>
                    <ModifierList modifiers={modifier.modifiers} />
                </li>
            ))}
        </ul>
    );
}

// Everything for connecting a restaurant to Flipdish:
// 1. check the login works and pick the store
// 2. import orders, and look at a few real ones
// 3. link Flipdish items to ChefStock menu items
function FlipdishTab() {
    const status = useApi("/flipdish/status");
    const unmatched = useApi("/flipdish/unmatched");
    const menu = useApi("/menu-items");

    const [busy, setBusy] = useState(""); // which button is working: "store", "sync", "samples", or a flipdishKey
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [samples, setSamples] = useState(null);
    const [salesSample, setSalesSample] = useState(null); // { orgId, propertyId, byChannel, byProperty, sales }
    const [salesError, setSalesError] = useState("");
    const [chosenOrgId, setChosenOrgId] = useState("");
    const [manualStoreId, setManualStoreId] = useState("");
    const [choices, setChoices] = useState({}); // flipdishKey -> chosen menu item id
    const [selected, setSelected] = useState([]); // flipdishKeys ticked for "Create menu items"

    // Runs one action, keeping track of the button and any error.
    const run = async (name, action) => {
        setBusy(name);
        setMessage("");
        setError("");
        try {
            await action();
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy("");
        }
    };

    // storeId for online orders; orgId + propertyId for till (POS) sales.
    const handleChooseStore = (storeId, propertyId = null) =>
        run("store", async () => {
            const orgId = chosenOrgId || status.data.orgs?.[0]?.id || null;
            await apiFetch("/flipdish/store", {
                method: "PUT",
                body: JSON.stringify({ storeId, propertyId, orgId }),
            });
            await status.reload();
            setMessage("Store saved. Now import your orders.");
        });

    const handleSync = () =>
        run("sync", async () => {
            const result = await apiFetch("/flipdish/sync", { method: "POST" });
            await Promise.all([status.reload(), unmatched.reload()]);
            const channels = Object.entries(result.byChannel || {})
                .map(([channel, count]) => `${channel} ${count}`)
                .join(", ");
            setMessage(
                `Fetched ${result.fetched} sales since ${formatDate(result.from)}` +
                    (channels ? ` (${channels})` : "") +
                    `: ${result.created} new, ${result.updated} updated.` +
                    (result.removedOldOrders ? ` Removed ${result.removedOldOrders} orders from the old import.` : "")
            );
        });

    const handleLoadSamples = () =>
        run("samples", async () => {
            setSamples(await apiFetch("/flipdish/sample-orders"));
        });

    // Shows its error right under the buttons: the page-level message is
    // at the top, often scrolled out of sight.
    const handleLoadSalesSample = async () => {
        setBusy("sales");
        setSalesError("");
        try {
            setSalesSample(await apiFetch("/flipdish/sample-sales"));
            await status.reload(); // the org/property may have just been found and saved
        } catch (err) {
            setSalesSample(null);
            setSalesError(err.message);
        } finally {
            setBusy("");
        }
    };

    const toggleSelected = (flipdishKey) =>
        setSelected((current) =>
            current.includes(flipdishKey) ? current.filter((key) => key !== flipdishKey) : [...current, flipdishKey]
        );

    const handleCreateMenuItems = () =>
        run("create", async () => {
            const result = await apiFetch("/flipdish/create-menu-items", {
                method: "POST",
                body: JSON.stringify({ flipdishKeys: selected }),
            });
            setSelected([]);
            await Promise.all([unmatched.reload(), menu.reload()]);

            const withRecipe = result.items.filter((item) => item.recipeName).length;
            setMessage(
                `Created ${result.created} menu items (${withRecipe} with a recipe). ` +
                    `Check them on the Menu page under "Flipdish import": add extras like boxes and cans, ` +
                    `and a recipe where one is missing.`
            );
        });

    const handleMatch = (flipdishKey) =>
        run(flipdishKey, async () => {
            const result = await apiFetch("/flipdish/match", {
                method: "POST",
                body: JSON.stringify({ flipdishKey, menuItemId: choices[flipdishKey] }),
            });
            await unmatched.reload();
            setMessage(`Linked. ${result.salesUpdated} past orders updated.`);
        });

    if (status.loading) return <p className="muted">Checking Flipdish...</p>;
    if (status.error) return <p className="error">{status.error}</p>;

    const { configured, connected, stores = [], storeId, orgs = [], lastSyncAt } = status.data;
    const currentStore = stores.find((store) => store.id === storeId);
    const menuItems = menu.data?.menuItems ?? [];

    return (
        <>
            {message && <p className="success">{message}</p>}
            {error && <p className="error">{error}</p>}

            <section className="panel">
                <h2>1. Connect</h2>

                {!configured && (
                    <>
                        <p className="panel-subtitle">Flipdish isn't set up on the server yet.</p>
                        <ol>
                            <li>
                                In the Flipdish portal: your avatar → <strong>Developer tools</strong> →{" "}
                                <strong>OAuth apps</strong> → <strong>Add New</strong>.
                            </li>
                            <li>
                                Copy the Client ID and Secret Key into <code>backend/.env</code> as{" "}
                                <code>FLIPDISH_CLIENT_ID</code> and <code>FLIPDISH_CLIENT_SECRET</code>.
                            </li>
                            <li>Restart the backend and reload this page.</li>
                        </ol>
                    </>
                )}

                {configured && !connected && (
                    <p className="error">Couldn't log in to Flipdish: {status.data.error}</p>
                )}

                {connected && (
                    <>
                        <p className="panel-subtitle">
                            Connected to Flipdish.{" "}
                            {currentStore
                                ? `Importing orders from ${currentStore.name}.`
                                : storeId
                                  ? `Importing orders from store ${storeId}.`
                                  : "Choose the store to import orders from."}
                        </p>

                        {orgs.length > 1 && (
                            <label>
                                Organisation
                                <select value={chosenOrgId} onChange={(event) => setChosenOrgId(event.target.value)}>
                                    {orgs.map((org) => (
                                        <option key={org.id} value={org.id}>
                                            {org.name || org.id}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        )}
                        {status.data.orgsError && (
                            <p className="muted">Couldn't load organisations, so till sales won't work yet: {status.data.orgsError}</p>
                        )}

                        {stores.length > 0 ? (
                            <div className="table-wrapper">
                                <table className="stock-table">
                                    <thead>
                                        <tr>
                                            <th>Store</th>
                                            <th>Store id</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stores.map((store) => (
                                            <tr key={store.id}>
                                                <td>
                                                    <strong>{store.name}</strong>
                                                    {store.address && <span className="cell-subtext">{store.address}</span>}
                                                </td>
                                                <td>
                                                    {store.id}
                                                    {store.propertyId && (
                                                        <span className="cell-subtext">property {store.propertyId}</span>
                                                    )}
                                                </td>
                                                <td className="table-actions">
                                                    {store.id === storeId ? (
                                                        <span className="muted">Selected</span>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            className="secondary-button"
                                                            disabled={busy !== ""}
                                                            onClick={() => handleChooseStore(store.id, store.propertyId)}
                                                        >
                                                            Use this store
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            // Some logins can't list stores; then type the id from the portal URL.
                            <form
                                className="stock-form"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    handleChooseStore(Number(manualStoreId));
                                }}
                            >
                                <label>
                                    Store id (from the Flipdish portal)
                                    <input
                                        type="number"
                                        min="1"
                                        value={manualStoreId}
                                        onChange={(event) => setManualStoreId(event.target.value)}
                                        required
                                    />
                                </label>
                                <div className="form-actions">
                                    <button type="submit" className="primary-button" disabled={busy !== ""}>
                                        Save store
                                    </button>
                                </div>
                            </form>
                        )}
                    </>
                )}
            </section>

            {connected && storeId && (
                <section className="panel">
                    <h2>2. Import sales</h2>
                    <p className="panel-subtitle">
                        {lastSyncAt
                            ? `Last imported ${new Date(lastSyncAt).toLocaleString("en-IE")}.`
                            : "Nothing imported yet. The first import brings in the last 14 days, from the till and online."}
                    </p>

                    <div className="form-actions">
                        <button type="button" className="secondary-button" disabled={busy !== ""} onClick={handleLoadSamples}>
                            {busy === "samples" ? "Loading..." : "Show 3 recent online orders (old API)"}
                        </button>
                        <button
                            type="button"
                            className="secondary-button"
                            disabled={busy !== ""}
                            onClick={handleLoadSalesSample}
                        >
                            {busy === "sales" ? "Loading..." : "Show recent sales (all channels)"}
                        </button>
                        <button type="button" className="primary-button" disabled={busy !== ""} onClick={handleSync}>
                            {busy === "sync" ? "Importing..." : "Import sales now"}
                        </button>
                    </div>

                    {salesError && <p className="error">{salesError}</p>}

                    {salesSample && (
                        <div className="detail-section">
                            <h3>Recent sales from every channel (no customer details)</h3>
                            <p className="panel-subtitle">
                                Org {salesSample.orgId}
                                {salesSample.propertyId ? ` · property ${salesSample.propertyId}` : ""}. By property:{" "}
                                {Object.entries(salesSample.byProperty)
                                    .map(([property, count]) => `${property} ${count}`)
                                    .join(" · ") || "none"}
                            </p>
                            <p className="panel-subtitle">
                                Last {Object.values(salesSample.byChannel).reduce((sum, count) => sum + count, 0)} sales by
                                channel:{" "}
                                {Object.entries(salesSample.byChannel)
                                    .map(([channel, count]) => `${channel} ${count}`)
                                    .join(" · ") || "none"}
                            </p>
                            {salesSample.sales.map((sale) => (
                                <div key={sale.saleId} className="detail-section">
                                    <p>
                                        <strong>{sale.channel}</strong> · {sale.status} ·{" "}
                                        {new Date(sale.createdAt).toLocaleString("en-IE")}
                                        {sale.total != null && ` · ${formatEuro(sale.total)}`}
                                    </p>
                                    <ul>
                                        {sale.items.map((item, index) => (
                                            <li key={index}>
                                                {item.quantity} x {item.name} {formatEuro(item.unitPrice)}{" "}
                                                <code>{item.menuItemId}</code>
                                                <ModifierList modifiers={item.modifiers} />
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}

                    {samples && (
                        <div className="detail-section">
                            <h3>Recent orders (no customer details)</h3>
                            {samples.length === 0 && <p className="muted">No orders in the last 7 days.</p>}
                            {samples.map((order) => (
                                <div key={order.orderId} className="detail-section">
                                    <p>
                                        <strong>Order {order.orderId}</strong> · {order.orderState} ·{" "}
                                        {new Date(order.placedTime).toLocaleString("en-IE")} · {formatEuro(order.amount)}
                                        {order.storeId !== storeId && (
                                            <span className="error"> · from a different store ({order.storeId})!</span>
                                        )}
                                    </p>
                                    <ul>
                                        {order.items.map((item, index) => (
                                            <li key={index}>
                                                {item.name} {formatEuro(item.price)} <code>{item.flipdishKey}</code>
                                                {item.options.length > 0 && (
                                                    <span className="cell-subtext">
                                                        {item.options
                                                            .map((option) => (option.isSize ? `size: ${option.name}` : option.name))
                                                            .join(", ")}
                                                    </span>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {connected && storeId && (
                <section className="panel">
                    <h2>3. Link Flipdish items to your menu</h2>
                    <p className="panel-subtitle">
                        Items that sold on Flipdish but aren't linked to a ChefStock menu item yet, most sold first.
                        Link each to an existing menu item, or tick them and let ChefStock create the menu items.
                    </p>

                    {unmatched.loading && <p className="muted">Loading...</p>}
                    {unmatched.data?.length === 0 && (
                        <p className="muted">
                            {lastSyncAt ? "Everything that sold is linked." : "Import sales first."}
                        </p>
                    )}

                    {unmatched.data?.length > 0 && (
                        <div className="form-actions">
                            <button
                                type="button"
                                className="secondary-button"
                                disabled={busy !== ""}
                                onClick={() =>
                                    setSelected(
                                        selected.length === unmatched.data.length
                                            ? []
                                            : unmatched.data.map((item) => item.flipdishKey)
                                    )
                                }
                            >
                                {selected.length === unmatched.data.length ? "Untick all" : "Tick all"}
                            </button>
                            <button
                                type="button"
                                className="primary-button"
                                disabled={selected.length === 0 || busy !== ""}
                                onClick={handleCreateMenuItems}
                            >
                                {busy === "create" ? "Creating..." : `Create ${selected.length} menu items`}
                            </button>
                        </div>
                    )}

                    {unmatched.data?.length > 0 && (
                        <div className="table-wrapper">
                            <table className="stock-table">
                                <thead>
                                    <tr>
                                        <th></th>
                                        <th>Flipdish item</th>
                                        <th className="number">Sold</th>
                                        <th>ChefStock menu item</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {unmatched.data.map((item) => (
                                        <tr key={item.flipdishKey}>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    aria-label={`Create a menu item for ${item.name}`}
                                                    checked={selected.includes(item.flipdishKey)}
                                                    onChange={() => toggleSelected(item.flipdishKey)}
                                                />
                                            </td>
                                            <td>
                                                <strong>{item.name}</strong>
                                                {item.lastPrice != null && ` ${formatEuro(item.lastPrice)}`}
                                                <span className="cell-subtext">
                                                    {item.suggestion
                                                        ? `New item would use: ${item.suggestion.recipeName}, ${item.suggestion.portions} ${
                                                              item.suggestion.portions === 1 ? "portion" : "portions"
                                                          }`
                                                        : "New item would have no recipe (fine for drinks)"}
                                                </span>
                                                <span className="cell-subtext">
                                                    <code>{item.flipdishKey}</code> · last sold {formatDate(item.lastSold)}
                                                </span>
                                            </td>
                                            <td className="number">{item.timesSold}</td>
                                            <td>
                                                <select
                                                    value={choices[item.flipdishKey] || ""}
                                                    onChange={(event) =>
                                                        setChoices({ ...choices, [item.flipdishKey]: event.target.value })
                                                    }
                                                >
                                                    <option value="">Choose...</option>
                                                    {menuItems.map((menuItem) => (
                                                        <option key={menuItem._id} value={menuItem._id}>
                                                            {menuItem.name}
                                                            {menuItem.flipdishItemId ? " (already linked)" : ""}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="table-actions">
                                                <button
                                                    type="button"
                                                    className="primary-button"
                                                    disabled={!choices[item.flipdishKey] || busy !== ""}
                                                    onClick={() => handleMatch(item.flipdishKey)}
                                                >
                                                    {busy === item.flipdishKey ? "Linking..." : "Link"}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                </section>
            )}
        </>
    );
}

export default FlipdishTab;
