import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import LoginForm from "../pages/auth/LoginForm";
import RegisterOwnerForm from "../pages/auth/RegisterOwnerForm";
import RegisterStaffForm from "../pages/auth/RegisterStaffForm";
import JoinRestaurantForm from "./JoinRestaurantForm";

function RestaurantPicker() {
    const { memberships, selectRestaurant } = useAuth();

    return (
        <main className="page">
            <section className="panel form-panel">
                <div className="panel-header">
                    <div>
                        <h2>Choose a Restaurant</h2>
                        <p className="panel-subtitle">
                            You belong to more than one restaurant. Pick one to continue.
                        </p>
                    </div>
                </div>

                <div className="stock-form">
                    {memberships.map((membership) => (
                        <button
                            key={membership.restaurant._id}
                            type="button"
                            className="secondary-button"
                            style={{ display: "block", width: "100%", marginBottom: "10px", textAlign: "left" }}
                            onClick={() => selectRestaurant(membership.restaurant._id)}
                        >
                            {membership.restaurant.name} — {membership.role}
                        </button>
                    ))}
                </div>
            </section>
        </main>
    );
}
// Shown to someone who is logged in but belongs to no restaurant, e.g. a
// staff member who was removed, or who left their only restaurant.
function NoRestaurantScreen() {
    const { user, logout } = useAuth();

    return (
        <main className="page">
            <section className="panel form-panel narrow-panel">
                <h2>You're not part of a restaurant yet</h2>
                <p className="panel-subtitle">
                    Hi {user.name}. Ask your manager for their restaurant's join code and enter it below.
                </p>

                <JoinRestaurantForm />

                <button type="button" className="link-button" onClick={logout}>
                    Log out
                </button>
            </section>
        </main>
    );
}

function AuthGate({ children }) {
    const { isAuthenticated, initializing, currentRestaurantId, memberships } = useAuth();
    const [mode, setMode] = useState("login");

    if (initializing) {
        return (
            <main className="page">
                <p>Loading ChefStock...</p>
            </main>
        );
    }

    if (!isAuthenticated) {
        return (
            <main className="page">
                {mode === "login" && (
                    <LoginForm
                        onSwitchToRegisterOwner={() => setMode("register-owner")}
                        onSwitchToRegisterStaff={() => setMode("register-staff")}
                    />
                )}
                {mode === "register-owner" && (
                    <RegisterOwnerForm onSwitchToLogin={() => setMode("login")} />
                )}
                {mode === "register-staff" && (
                    <RegisterStaffForm onSwitchToLogin={() => setMode("login")} />
                )}
            </main>
        );
    }
    if (memberships.length === 0) {
        return <NoRestaurantScreen />;
    }
    // Logged in, but no restaurant context yet — only happens for a user
    // with multiple memberships who hasn't picked one this session.
    if (!currentRestaurantId && memberships.length > 1) {
        return <RestaurantPicker />;
    }

    return children;
}

export default AuthGate;