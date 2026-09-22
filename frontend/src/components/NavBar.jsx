import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
    { id: "dashboard", label: "Dashboard" },
    { id: "stock-items", label: "Stock Items" },
    { id: "deliveries", label: "Deliveries" },
    { id: "suppliers", label: "Suppliers" },
    { id: "recipes", label: "Recipes" },
    { id: "prep", label: "Prep" },
    { id: "production", label: "Production" },
    { id: "adjustments", label: "Adjustments" },
];

function NavBar({ activePage, onNavigate }) {
    const { user, currentMembership, memberships, logout, selectRestaurant } = useAuth();

    return (
        <nav className="app-nav">
            <div className="brand">
                <div className="brand-mark">CS</div>
                <div>
                    <strong>ChefStock</strong>
                    <span>Inventory Manager</span>
                </div>
            </div>

            <div className="nav-links">
                {NAV_ITEMS.map((item) => (
                    <button
                        key={item.id}
                        className={`nav-link ${activePage === item.id ? "active" : ""}`}
                        onClick={() => onNavigate(item.id)}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            <div className="nav-account">
                {currentMembership && (
                    <span className="muted">
            {currentMembership.restaurant.name} · {currentMembership.role}
          </span>
                )}

                {memberships.length > 1 && (
                    <select
                        value={currentMembership?.restaurant._id || ""}
                        onChange={(event) => selectRestaurant(event.target.value)}
                    >
                        {memberships.map((membership) => (
                            <option key={membership.restaurant._id} value={membership.restaurant._id}>
                                {membership.restaurant.name}
                            </option>
                        ))}
                    </select>
                )}

                <span className="muted">{user?.name}</span>
                <button type="button" className="secondary-button" onClick={logout}>
                    Log Out
                </button>
            </div>
        </nav>
    );
}

export default NavBar;