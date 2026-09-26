import { useAuth } from "../context/AuthContext";
import { getNavSectionsForRole } from "../constants/navigation";
import Icon from "./Icon";

function getInitials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

function Sidebar({ activePage, onNavigate, isOpen, onClose }) {
  const { user, role, currentMembership, memberships, logout, selectRestaurant } = useAuth();
  const sections = getNavSectionsForRole(role);

  return (
    <aside className={`sidebar ${isOpen ? "open" : ""}`} aria-label="Main navigation">
      <div className="sidebar-top">
        <div className="brand">
          <div className="brand-mark">CS</div>
          <div>
            <strong>ChefStock</strong>
            <span>Inventory Manager</span>
          </div>
        </div>

        {/* Only visible on small screens, where the sidebar is a slide-out drawer. */}
        <button
          type="button"
          className="icon-button sidebar-close"
          onClick={onClose}
          aria-label="Close menu"
        >
          <Icon name="close" />
        </button>
      </div>

      {currentMembership && (
        <div className="restaurant-card">
          <span className="restaurant-card-label">Restaurant</span>

          {memberships.length > 1 ? (
            <select
              className="restaurant-select"
              value={currentMembership.restaurant._id}
              onChange={(event) => selectRestaurant(event.target.value)}
              aria-label="Switch restaurant"
            >
              {memberships.map((membership) => (
                <option key={membership.restaurant._id} value={membership.restaurant._id}>
                  {membership.restaurant.name}
                </option>
              ))}
            </select>
          ) : (
            <strong className="restaurant-name">{currentMembership.restaurant.name}</strong>
          )}

          <span className={`role-badge ${role}`}>{role}</span>
        </div>
      )}

      <nav className="sidebar-nav">
        {sections.map((section) => (
          <div className="nav-section" key={section.label}>
            <p className="nav-section-label">{section.label}</p>

            {section.items.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`nav-link ${activePage === item.id ? "active" : ""}`}
                aria-current={activePage === item.id ? "page" : undefined}
                onClick={() => onNavigate(item.id)}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-user">
        <button
          type="button"
          className={`user-button ${activePage === "account" ? "active" : ""}`}
          onClick={() => onNavigate("account")}
          title="My account"
        >
          <span className="avatar">{getInitials(user?.name)}</span>
          <span className="user-text">
            <strong>{user?.name}</strong>
            <span>{user?.email}</span>
          </span>
        </button>

        <button type="button" className="icon-button" onClick={logout} aria-label="Log out" title="Log out">
          <Icon name="logout" />
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
