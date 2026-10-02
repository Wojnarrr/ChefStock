import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../utils/api";
import JoinRestaurantForm from "../../components/JoinRestaurantForm";

const EMPTY_PASSWORDS = { currentPassword: "", newPassword: "", confirmPassword: "" };

function AccountView() {
    const { user, memberships, currentRestaurantId, selectRestaurant, refreshMemberships } = useAuth();

    const [passwords, setPasswords] = useState(EMPTY_PASSWORDS);
    const [passwordMessage, setPasswordMessage] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [restaurantsError, setRestaurantsError] = useState("");

    const handlePasswordChange = (event) => {
        setPasswords({ ...passwords, [event.target.name]: event.target.value });
    };

    const handleChangePassword = async (event) => {
        event.preventDefault();
        setPasswordMessage("");
        setPasswordError("");

        // "Confirm password" is only a typo check, so it lives in the frontend.
        // The real rules (length, correct current password) are on the backend.
        if (passwords.newPassword !== passwords.confirmPassword) {
            setPasswordError("New passwords don't match");
            return;
        }

        try {
            await apiFetch("/auth/password", {
                method: "PUT",
                body: JSON.stringify({
                    currentPassword: passwords.currentPassword,
                    newPassword: passwords.newPassword,
                }),
            });
            setPasswords(EMPTY_PASSWORDS);
            setPasswordMessage("Password updated.");
        } catch (err) {
            setPasswordError(err.message);
        }
    };

    const handleLeave = async (membership) => {
        const { restaurant } = membership;
        if (!window.confirm(`Leave ${restaurant.name}? You'll need a new join code to get back in.`)) return;

        try {
            setRestaurantsError("");
            await apiFetch(`/restaurants/${restaurant._id}/membership`, { method: "DELETE" });

            // If you left the restaurant you were in, syncSelectedRestaurant
            // (inside refreshMemberships) picks another one or clears it.
            await refreshMemberships();
        } catch (err) {
            // e.g. "You're the only owner..."
            setRestaurantsError(err.message);
        }
    };

    return (
        <div className="card-grid">
            <section className="panel">
                <h2>Your details</h2>
                <dl className="detail-list">
                    <div>
                        <dt>Name</dt>
                        <dd>{user.name}</dd>
                    </div>
                    <div>
                        <dt>Email</dt>
                        <dd>{user.email}</dd>
                    </div>
                </dl>
            </section>

            <section className="panel">
                <h2>Change password</h2>

                <form className="stock-form" onSubmit={handleChangePassword}>
                    <label>
                        Current password
                        <input
                            type="password"
                            name="currentPassword"
                            value={passwords.currentPassword}
                            onChange={handlePasswordChange}
                            autoComplete="current-password"
                            required
                        />
                    </label>
                    <label className="full-width-label">
                        New password
                        <input
                            type="password"
                            name="newPassword"
                            value={passwords.newPassword}
                            onChange={handlePasswordChange}
                            autoComplete="new-password"
                            minLength={8}
                            required
                        />
                    </label>
                    <label className="full-width-label">
                        Confirm new password
                        <input
                            type="password"
                            name="confirmPassword"
                            value={passwords.confirmPassword}
                            onChange={handlePasswordChange}
                            autoComplete="new-password"
                            required
                        />
                    </label>

                    {passwordError && <p className="error">{passwordError}</p>}
                    {passwordMessage && <p className="success">{passwordMessage}</p>}

                    <div className="form-actions">
                        <button type="submit" className="primary-button">Update password</button>
                    </div>
                </form>
            </section>

            <section className="panel">
                <h2>Your restaurants</h2>
                {restaurantsError && <p className="error">{restaurantsError}</p>}

                <div className="item-list restaurant-list">
                    {memberships.map((membership) => {
                        const { restaurant, role } = membership;
                        const isCurrent = restaurant._id === currentRestaurantId;

                        return (
                            <div className="stock-row" key={restaurant._id}>
                                <div>
                                    <h3>{restaurant.name}</h3>
                                    <p>
                                        <span className="role-tag">{role}</span>
                                        {isCurrent && <span className="current-tag">Current</span>}
                                    </p>
                                </div>

                                <div className="row-actions">
                                    {!isCurrent && (
                                        <button
                                            type="button"
                                            className="link-button"
                                            onClick={() => selectRestaurant(restaurant._id)}
                                        >
                                            Switch
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className="link-button danger"
                                        onClick={() => handleLeave(membership)}
                                    >
                                        Leave
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            <section className="panel">
                <h2>Join another restaurant</h2>
                <p className="panel-subtitle">Ask the restaurant's owner for their join code.</p>
                <JoinRestaurantForm />
            </section>
        </div>
    );
}

export default AccountView;