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

export const STOCK_ADJUSTMENT_REASONS = [
  { value: "stock_count_correction", label: "Stock Count Correction" },
  { value: "waste", label: "Waste" },
  { value: "staff_food", label: "Staff Food" },
  { value: "damaged", label: "Damaged" },
  { value: "expired", label: "Expired" },
  { value: "missing", label: "Missing" },
  { value: "other", label: "Other" },
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
