export const STOCK_UNIT_OPTIONS = [
  "g",
  "kg",
  "ml",
  "l",
  "pcs",
  "pack",
  "box",
  "case",
  "bottle",
  "can",
  "container",
];

export const DELIVERY_DAY_OPTIONS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const PAGE_TITLES = {
  deliveries: "Deliveries",
  prep: "Prep Batches",
  production: "Production Batches",
  adjustments: "Stock Adjustments",
};

export function getPageTitle(activePage) {
  return PAGE_TITLES[activePage] || "Coming Soon";
}
