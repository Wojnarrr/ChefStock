import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../utils/api";

// Used in two places: the My Account page, and the screen shown to someone
// who isn't in any restaurant yet.
function JoinRestaurantForm() {
    const { refreshMemberships, selectRestaurant } = useAuth();
    const [joinCode, setJoinCode] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            setError("");
            setSubmitting(true);

            const data = await apiFetch("/restaurants/join", {
                method: "POST",
                body: JSON.stringify({ joinCode }),
            });

            await refreshMemberships();
            selectRestaurant(data.restaurantId); // switch to the restaurant you just joined
            setJoinCode("");
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form className="stock-form" onSubmit={handleSubmit}>
            <label>
                Join code
                <input
                    value={joinCode}
                    onChange={(event) => setJoinCode(event.target.value)}
                    placeholder="REST-A1B2C3"
                    required
                />
            </label>

            {error && <p className="error">{error}</p>}

            <div className="form-actions">
                <button type="submit" className="primary-button" disabled={submitting}>
                    {submitting ? "Joining..." : "Join restaurant"}
                </button>
            </div>
        </form>
    );
}

export default JoinRestaurantForm;