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
    </nav>
  );
}

export default NavBar;
