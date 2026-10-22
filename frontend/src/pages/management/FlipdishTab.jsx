import { useState } from "react";
import { apiFetch } from "../../utils/api";
import { useApi } from "../../hooks/useApi";
import { formatDate, formatEuro } from "../../utils/format";

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
    const [manualStoreId, setManualStoreId] = useState("");
    const [choices, setChoices] = useState({}); // flipdishKey -> chosen menu item id

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

    const handleChooseStore = (storeId) =>
        run("store", async () => {
            await apiFetch("/flipdish/store", { method: "PUT", body: JSON.stringify({ storeId }) });
            await status.reload();
            setMessage("Store saved. Now import your orders.");
        });

    const handleSync = () =>
        run("sync", async () => {
            const result = await apiFetch("/flipdish/sync", { method: "POST" });
            await Promise.all([status.reload(), unmatched.reload()]);
            setMessage(
                `Fetched ${result.fetched} orders since ${formatDate(result.from)}: ` +
                    `${result.created} new, ${result.updated} updated.`
            );
        });

    const handleLoadSamples = () =>
        run("samples", async () => {
            setSamples(await apiFetch("/flipdish/sample-orders"));
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

    const { configured, connected, stores, storeId, lastSyncAt } = status.data;
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
                                                <td>{store.id}</td>
                                                <td className="table-actions">
                                                    {store.id === storeId ? (
                                                        <span className="muted">Selected</span>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            className="secondary-button"
                                                            disabled={busy !== ""}
                                                            onClick={() => handleChooseStore(store.id)}
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
                    <h2>2. Import orders</h2>
                    <p className="panel-subtitle">
                        {lastSyncAt
                            ? `Last imported ${new Date(lastSyncAt).toLocaleString("en-IE")}.`
                            : "Nothing imported yet. The first import brings in the last 30 days."}
                    </p>

                    <div className="form-actions">
                        <button type="button" className="secondary-button" disabled={busy !== ""} onClick={handleLoadSamples}>
                            {busy === "samples" ? "Loading..." : "Show 3 recent orders"}
                        </button>
                        <button type="button" className="primary-button" disabled={busy !== ""} onClick={handleSync}>
                            {busy === "sync" ? "Importing..." : "Import orders now"}
                        </button>
                    </div>

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
                    </p>

                    {unmatched.loading && <p className="muted">Loading...</p>}
                    {unmatched.data?.length === 0 && (
                        <p className="muted">
                            {lastSyncAt ? "Everything that sold is linked." : "Import orders first."}
                        </p>
                    )}

                    {unmatched.data?.length > 0 && (
                        <div className="table-wrapper">
                            <table className="stock-table">
                                <thead>
                                    <tr>
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
                                                <strong>{item.name}</strong>
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
                    {menuItems.length === 0 && !menu.loading && (
                        <p className="muted">Add your menu items on the Menu page first, then link them here.</p>
                    )}
                </section>
            )}
        </>
    );
}

export default FlipdishTab;
