/**
 * Reusable EmptyState component
 */
export default function EmptyState({ icon, title, description, children }) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-icon">{icon}</div>}
      {title && <div className="empty-title">{title}</div>}
      {description && <div className="empty-desc">{description}</div>}
      {children}
    </div>
  );
}
