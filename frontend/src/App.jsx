import { useEffect, useState } from "react";
import "./App.css";

import AppLayout from "./components/AppLayout";
import PageHeader from "./components/PageHeader";
import ComingSoonView from "./components/ComingSoonView";

import DashboardPage from "./pages/DashboardPage";
import StockItemsPage from "./pages/StockItemsPage";
import DeliveriesPage from "./pages/DeliveriesPage";
import SuppliersPage from "./pages/SuppliersPage";
import RecipesPage from "./pages/RecipesPage";
import PrepTasksPage from "./pages/PrepTasksPage";
import ProductionPage from "./pages/ProductionPage";
import MenuView from "./pages/menu/MenuView";
import ManagementView from "./pages/management/ManagementView";
import AccountView from "./pages/account/AccountView";

import { getPage, canAccessPage } from "./constants/navigation";
import { useAuth } from "./context/AuthContext";

// Which component shows each page. A page that isn't here shows "Coming soon".
const PAGES = {
  dashboard: DashboardPage,
  "stock-items": StockItemsPage,
  deliveries: DeliveriesPage,
  suppliers: SuppliersPage,
  recipes: RecipesPage,
  prep: PrepTasksPage,
  production: ProductionPage,
  menu: MenuView,
  management: ManagementView,
  account: AccountView,
};

function App() {
  const { currentRestaurantId, role } = useAuth();
  const [activePage, setActivePage] = useState("dashboard");

  // If this page isn't allowed for your role (e.g. after switching to a
  // restaurant where you're staff), fall back to the dashboard.
  useEffect(() => {
    if (role && !canAccessPage(activePage, role)) {
      setActivePage("dashboard");
    }
  }, [role, activePage]);

  const page = getPage(activePage);
  const PageComponent = PAGES[activePage];

  const renderPage = () => {
    if (!canAccessPage(activePage, role)) return null;
    if (!PageComponent) return <ComingSoonView title={page?.title || "Coming Soon"} />;

    // key: switching restaurant rebuilds the page, so it loads that restaurant's data.
    return <PageComponent key={currentRestaurantId} />;
  };

  return (
      <AppLayout activePage={activePage} onNavigate={setActivePage}>
        {page && <PageHeader eyebrow={page.section} title={page.title} subtitle={page.subtitle} />}
        {renderPage()}
      </AppLayout>
  );
}

export default App;