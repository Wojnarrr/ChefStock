
// Shared formatting helpers, so money and dates look the same everywhere.

const euroFormatter = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" });

export function formatEuro(amount) {
    return euroFormatter.format(amount);
}

// "12 Aug 2026"
export function formatDate(date) {
    return new Date(date).toLocaleDateString("en-IE", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

// "12 Aug" (for chart axes, where space is tight)
export function formatShortDate(date) {
    return new Date(date).toLocaleDateString("en-IE", { day: "numeric", month: "short" });
}