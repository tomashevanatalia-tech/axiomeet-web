/**
 * Reusable PageHeader component
 * Renders title, subtitle, breadcrumbs, and optional action buttons
 */
export default function PageHeader({ title, subtitle, children, breadcrumbs }) {
  return (
    <div className="page-header">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, idx) => (
            <span key={idx} className="breadcrumb-item">
              {idx > 0 && <span className="breadcrumb-sep">/</span>}
              {crumb.href ? (
                <a href={crumb.href}>{crumb.label}</a>
              ) : (
                <span className="breadcrumb-current">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div>
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        {children && <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>{children}</div>}
      </div>
    </div>
  );
}
