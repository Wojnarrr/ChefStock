function StatCard({ label, value, description }) {
    return (
        <article className="stat-card">
            <p>{label}</p>
            <strong>{value}</strong>
            {description && <span>{description}</span>}
        </article>
    );
}

export default StatCard;