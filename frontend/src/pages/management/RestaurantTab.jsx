import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../utils/api";

function RestaurantTab() {
    const { currentMembership, refreshMemberships, selectRestaurant } = useAuth();
    const restaurant = currentMembership.restaurant;

    const [details, setDetails] = useState({
        name: restaurant.name,
        address: restaurant.address || "",
        vatRate: restaurant.vatRate ?? "",
        targetFoodCostPercent: restaurant.targetFoodCostPercent ?? 30,
    });
    const [newRestaurant, setNewRestaurant] = useState({ name: "", address: "" });
    const [copied, setCopied] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const clearFeedback = () => {
        setMessage("");
        setError("");
    };

    const handleCopy = async () => {
        await navigator.clipboard.writeText(restaurant.joinCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleRegenerate = async () => {
        if (!window.confirm("Generate a new code? The current code will stop working.")) return;

        try {
            clearFeedback();
            await apiFetch("/restaurants/current/join-code", { method: "POST" });
            await refreshMemberships(); // the new code arrives with the memberships
            setMessage("New join code generated.");
        } catch (err) {
            setError(err.message);
        }
    };

    const handleSaveDetails = async (event) => {
        event.preventDefault();

        try {
            clearFeedback();
            await apiFetch("/restaurants/current", {
                method: "PUT",
                body: JSON.stringify({
                    ...details,
                    // An empty box means "not set" (null), not 0% VAT.
                    vatRate: details.vatRate === "" ? null : Number(details.vatRate),
                    targetFoodCostPercent: Number(details.targetFoodCostPercent),
                }),
            });
            await refreshMemberships(); // so the sidebar shows the new name
            setMessage("Restaurant details saved.");
        } catch (err) {
            setError(err.message);
        }
    };

    const handleCreateRestaurant = async (event) => {
        event.preventDefault();

        try {
            clearFeedback();
            const data = await apiFetch("/restaurants", {
                method: "POST",
                body: JSON.stringify(newRestaurant),
            });
            await refreshMemberships();
            selectRestaurant(data.restaurantId); // switch straight to the new one
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <>
            {message && <p className="success">{message}</p>}
            {error && <p className="error">{error}</p>}

            <div className="management-grid">
                <section className="panel">
                    <h2>Invite staff</h2>
                    <p className="panel-subtitle">
                        Staff enter this code when they register to join {restaurant.name}.
                    </p>

                    <div className="invite-code-row">
                        <code className="invite-code">{restaurant.joinCode}</code>
                        <button type="button" className="secondary-button" onClick={handleCopy}>
                            {copied ? "Copied!" : "Copy"}
                        </button>
                    </div>

                    <button type="button" className="link-button danger" onClick={handleRegenerate}>
                        Generate a new code
                    </button>
                </section>

                <section className="panel">
                    <h2>Restaurant details</h2>

                    <form className="stock-form" onSubmit={handleSaveDetails}>
                        <label>
                            Name
                            <input
                                value={details.name}
                                onChange={(event) => setDetails({ ...details, name: event.target.value })}
                                required
                            />
                        </label>
                        <label className="full-width-label">
                            Address
                            <input
                                value={details.address}
                                onChange={(event) => setDetails({ ...details, address: event.target.value })}
                            />
                        </label>
                        <div className="form-grid full-width-label">
                            <label>
                                VAT in menu prices (%)
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="100"
                                    value={details.vatRate}
                                    onChange={(event) => setDetails({ ...details, vatRate: event.target.value })}
                                    placeholder="e.g. 13.5"
                                />
                            </label>
                            <label>
                                Target food cost (%)
                                <input
                                    type="number"
                                    step="1"
                                    min="1"
                                    max="100"
                                    value={details.targetFoodCostPercent}
                                    onChange={(event) =>
                                        setDetails({ ...details, targetFoodCostPercent: event.target.value })
                                    }
                                    required
                                />
                            </label>
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="primary-button">Save</button>
                        </div>
                    </form>
                </section>

                <section className="panel">
                    <h2>Add another restaurant</h2>
                    <p className="panel-subtitle">You'll be its owner, and can switch between restaurants in the sidebar.</p>

                    <form className="stock-form" onSubmit={handleCreateRestaurant}>
                        <label>
                            Name
                            <input
                                value={newRestaurant.name}
                                onChange={(event) => setNewRestaurant({ ...newRestaurant, name: event.target.value })}
                                required
                            />
                        </label>
                        <label className="full-width-label">
                            Address
                            <input
                                value={newRestaurant.address}
                                onChange={(event) => setNewRestaurant({ ...newRestaurant, address: event.target.value })}
                            />
                        </label>

                        <div className="form-actions">
                            <button type="submit" className="primary-button">Create restaurant</button>
                        </div>
                    </form>
                </section>
            </div>
        </>
    );
}

export default RestaurantTab;