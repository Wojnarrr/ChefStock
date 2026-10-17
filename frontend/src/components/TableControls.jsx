export function TableControls({ controls, placeholder = "Search..." }) {
    const { query, setQuery, sortKey, setSortKey, sortOptions, filterKey, setFilterKey, filters, filterCounts } =
        controls;

    return (
        <div className="table-controls">
            <input
                type="search"
                className="table-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={placeholder}
                aria-label="Search"
            />

            {filters && (
                <div className="filter-chips" role="group" aria-label="Show">
                    {Object.entries(filters).map(([key, filter]) => (
                        <button
                            key={key}
                            type="button"
                            className={`filter-chip ${filterKey === key ? "active" : ""}`}
                            aria-pressed={filterKey === key}
                            onClick={() => setFilterKey(key)}
                        >
                            {filter.label} <span>{filterCounts[key]}</span>
                        </button>
                    ))}
                </div>
            )}

            <label className="table-sort">
                Sort
                <select value={sortKey} onChange={(event) => setSortKey(event.target.value)}>
                    {Object.entries(sortOptions).map(([key, option]) => (
                        <option key={key} value={key}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </label>
        </div>
    );
}

export function Pagination({ controls }) {
    const { page, pageCount, setPage } = controls;
    if (pageCount <= 1) return null;

    return (
        <nav className="pagination" aria-label="Pages">
            <button type="button" className="secondary-button" disabled={page === 1} onClick={() => setPage(page - 1)}>
                ← Previous
            </button>
            <span>
        Page {page} of {pageCount}
      </span>
            <button
                type="button"
                className="secondary-button"
                disabled={page === pageCount}
                onClick={() => setPage(page + 1)}
            >
                Next →
            </button>
        </nav>
    );
}