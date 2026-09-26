import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Icon from "./Icon";
import { getPage } from "../constants/navigation";

// The logged-in app shell: sidebar on the left, page content on the right.
// On small screens the sidebar turns into a drawer opened from a top bar.
function AppLayout({ activePage, onNavigate, children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const page = getPage(activePage);

  // Close the drawer with Escape.
  useEffect(() => {
    if (!menuOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  const handleNavigate = (pageId) => {
    onNavigate(pageId);
    setMenuOpen(false);
  };

  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
      />

      {menuOpen && <div className="sidebar-backdrop" onClick={() => setMenuOpen(false)} />}

      <div className="app-main">
        <header className="mobile-topbar">
          <button
            type="button"
            className="icon-button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Icon name="menu" />
          </button>
          <strong>{page?.label || "ChefStock"}</strong>
        </header>

        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}

export default AppLayout;
