function PageHeader({ eyebrow, title, subtitle }) {
  return (
    <header className="dashboard-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {subtitle && <p className="subtitle">{subtitle}</p>}
      </div>
    </header>
  );
}

export default PageHeader;
