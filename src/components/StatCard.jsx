/**
 * Reusable StatCard component
 */
export default function StatCard({ icon, iconBg, value, label, children }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: iconBg || 'rgba(99,102,241,0.15)' }}>
        {icon}
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {children}
    </div>
  );
}
