// Single source of truth for the app's pages: what shows in the sidebar,
// which group it sits in, who can see it, and the header each page shows.
//
// `roles` lists which membership roles can open the page. Hiding a page here
// is only about what people see. The backend still has to enforce the same
// rules (requireOwner etc.), because anyone can call the API directly.

export const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: "dashboard",
        roles: ["owner", "staff"],
        title: "Dashboard",
        subtitle: "Live stock overview based on deliveries, prep, production and adjustments.",
      },
    ],
  },
  {
    label: "Stock",
    items: [
      {
        id: "stock-items",
        label: "Stock Items",
        icon: "stock",
        roles: ["owner", "staff"],
        title: "Stock Items",
        subtitle: "Everything you track, with current levels and minimums.",
      },
      {
        id: "deliveries",
        label: "Deliveries",
        icon: "deliveries",
        roles: ["owner", "staff"],
        title: "Deliveries",
        subtitle: "Log what arrived and from which supplier.",
      },
      {
        id: "adjustments",
        label: "Adjustments",
        icon: "adjustments",
        roles: ["owner", "staff"],
        title: "Stock Adjustments",
        subtitle: "Waste, staff food, damaged and stock-count corrections.",
      },
    ],
  },
  {
    label: "Kitchen",
    items: [
      {
        id: "recipes",
        label: "Recipes",
        icon: "recipes",
        roles: ["owner", "staff"],
        title: "Recipes",
        subtitle: "What goes into each prep item and dish.",
      },
      {
        id: "prep",
        label: "Prep",
        icon: "prep",
        roles: ["owner", "staff"],
        title: "Prep Tasks",
        subtitle: "Today's prep list and what's been completed.",
      },
      {
        id: "production",
        label: "Production",
        icon: "production",
        roles: ["owner", "staff"],
        title: "Production Batches",
        subtitle: "Batches made and the stock they used.",
      },
      {
        id: "menu",
        label: "Menu",
        icon: "tag",
        roles: ["owner"],
        title: "Menu",
        subtitle: "Prices, costs and food cost % for everything you sell.",
      },
    ],
  },
  {
    label: "Admin",
    items: [
      {
        id: "suppliers",
        label: "Suppliers",
        icon: "suppliers",
        roles: ["owner"],
        title: "Suppliers",
        subtitle: "Who you order from and when they deliver.",
      },
      {
        id: "management",
        label: "Management",
        icon: "management",
        roles: ["owner"],
        title: "Management",
        subtitle: "Staff, restaurants and invite codes.",
      },
    ],
  },
];

// Pages that aren't in the sidebar list but can still be opened
// (the account page is reached from the user block at the bottom).
const EXTRA_PAGES = [
  {
    id: "account",
    label: "My Account",
    icon: "account",
    roles: ["owner", "staff"],
    title: "My Account",
    subtitle: "Your details, password and restaurants.",
  },
];

const ALL_PAGES = [
  ...NAV_SECTIONS.flatMap((section) =>
    section.items.map((item) => ({ ...item, section: section.label }))
  ),
  ...EXTRA_PAGES,
];

export function getPage(pageId) {
  return ALL_PAGES.find((page) => page.id === pageId) || null;
}

export function canAccessPage(pageId, role) {
  const page = getPage(pageId);
  return Boolean(page && role && page.roles.includes(role));
}

// Sections filtered down to what this role can see; empty sections are dropped.
export function getNavSectionsForRole(role) {
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => item.roles.includes(role)),
  })).filter((section) => section.items.length > 0);
}
