import { useState } from "react";

// Searches, filters, sorts and splits a list into pages, all in the browser.
// Fine for a few hundred rows; lists that grow forever should be paged by the server.
export function useTableControls(items, { getSearchText, sortOptions, filters, pageSize = 15 }) {
    const filterKeys = filters ? Object.keys(filters) : [];

    const [query, setQuery] = useState("");
    const [sortKey, setSortKey] = useState(Object.keys(sortOptions)[0]);
    const [filterKey, setFilterKey] = useState(filterKeys[0] ?? null);
    const [page, setPage] = useState(1);

    // Changing what you're looking at always goes back to page 1.
    const andResetPage = (setter) => (value) => {
        setter(value);
        setPage(1);
    };

    const search = query.trim().toLowerCase();

    const matching = items
        .filter((item) => !filterKey || filters[filterKey].test(item))
        .filter((item) => !search || getSearchText(item).toLowerCase().includes(search));

    // Copy before sorting: .sort() changes the array it's called on.
    const sorted = [...matching].sort(sortOptions[sortKey].compare);

    const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
    // If the list got shorter (e.g. you deleted the last row on page 3), don't stay on an empty page.
    const currentPage = Math.min(page, pageCount);
    const rows = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    // How many items each filter button would show, e.g. "Low or out 3".
    const filterCounts = Object.fromEntries(
        filterKeys.map((key) => [key, items.filter(filters[key].test).length])
    );

    return {
        rows,
        total: sorted.length,
        query,
        setQuery: andResetPage(setQuery),
        sortKey,
        setSortKey: andResetPage(setSortKey),
        sortOptions,
        filterKey,
        setFilterKey: andResetPage(setFilterKey),
        filters,
        filterCounts,
        page: currentPage,
        pageCount,
        setPage,
    };
}