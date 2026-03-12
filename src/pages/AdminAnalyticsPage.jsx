import { useState, useEffect } from 'react';
import api from '../api';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAnalytics(); }, [period]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/api/v1/admin/analytics?period=${period}`);
      setAnalytics(data);
    } catch {
      setAnalytics({
        total_meetings: 0, total_hours: 0, active_users: 0,
        avg_meeting_duration_min: 0, cost_total_usd: 0,
        revenue_total_usd: 0, top_users: [], daily_usage: [],
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  const d = analytics || {};
  const margin = d.revenue_total_usd > 0
    ? ((d.revenue_total_usd - d.cost_total_usd) / d.revenue_total_usd * 100).toFixed(0)
    : 0;

  const periodButtons = (
    <div style={{ display: 'flex', gap: 4 }}>
      {['7d', '30d', '90d'].map((p) => (
        <button
          key={p}
          className={`btn ${p === period ? 'btn-primary' : 'btn-ghost'} btn-sm`}
          onClick={() => setPeriod(p)}
        >
          {p === '7d' ? '7 дней' : p === '30d' ? '30 дней' : '90 дней'}
        </button>
      ))}
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Аналитика"
        subtitle="Использование платформы и ключевые метрики"
        breadcrumbs={[{ label: 'Управление', href: '#' }, { label: 'Аналитика' }]}
      >
        {periodButtons}
      </PageHeader>

      {/* Key Metrics */}
      <div className="stat-grid" style={{ marginBottom: 32 }}>
        <StatCard icon="🎤" iconBg="rgba(99,102,241,0.15)" value={d.total_meetings} label="Встреч обработано" />
        <StatCard icon="⏱️" iconBg="rgba(6,182,212,0.15)" value={`${d.total_hours?.toFixed(1) || 0}h`} label="Часов обработки" />
        <StatCard icon="👥" iconBg="rgba(34,197,94,0.15)" value={d.active_users || 0} label="Активных пользователей" />
        <StatCard icon="⏳" iconBg="rgba(245,158,11,0.15)" value={d.avg_meeting_duration_min || 0} label="Средняя длительность (мин)" />
      </div>

      {/* Financial metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <FinanceCard label="Расходы" value={`$${d.cost_total_usd?.toFixed(2) || '0.00'}`} color="var(--color-error)" />
        <FinanceCard label="Выручка" value={`$${d.revenue_total_usd?.toFixed(2) || '0.00'}`} color="var(--color-success)" />
        <FinanceCard label="Маржа" value={`${margin}%`} color={margin >= 50 ? 'var(--color-success)' : margin >= 20 ? 'var(--color-warning)' : 'var(--color-error)'} />
        <FinanceCard label="Себестоимость/час" value={`$${d.total_hours > 0 ? (d.cost_total_usd / d.total_hours).toFixed(4) : '0.00'}`} />
      </div>

      {/* Usage Chart */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h3 className="card-title">График использования</h3>
        </div>
        {(d.daily_usage || []).length === 0 ? (
          <EmptyState icon="📊" title="Нет данных за период" description="Данные появятся после обработки первых встреч" />
        ) : (
          <UsageChart data={d.daily_usage} />
        )}
      </div>

      {/* Top Users */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Топ пользователей</h3>
        </div>
        {(d.top_users || []).length === 0 ? (
          <EmptyState icon="🏆" title="Нет данных" />
        ) : (
          <TopUsersTable users={d.top_users} />
        )}
      </div>
    </div>
  );
}

/* ── Extracted sub-components ─────────────────────────────────── */

function FinanceCard({ label, value, color }) {
  return (
    <div className="card">
      <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, color: color || 'var(--color-text)' }}>
        {value}
      </div>
    </div>
  );
}

function UsageChart({ data }) {
  const maxVal = Math.max(...data.map((d) => d.hours || 0), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 200, padding: '16px 0' }}>
      {data.map((day, idx) => {
        const height = Math.max(4, ((day.hours || 0) / maxVal) * 160);
        return (
          <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-muted)' }}>
              {day.hours?.toFixed(1) || 0}h
            </span>
            <div style={{
              width: '100%', maxWidth: 28, height,
              background: 'linear-gradient(180deg, var(--color-primary-400), var(--color-primary-600))',
              borderRadius: '4px 4px 0 0', transition: 'height 0.3s',
            }} />
            <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
              {day.date?.slice(5) || ''}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function TopUsersTable({ users }) {
  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th>#</th>
            <th>Пользователь</th>
            <th>Встреч</th>
            <th>Часов</th>
          </tr>
        </thead>
        <tbody>
          {users.slice(0, 10).map((u, idx) => (
            <tr key={u.id || idx}>
              <td style={{ fontWeight: 600, color: idx < 3 ? 'var(--color-warning)' : 'var(--color-text-muted)' }}>
                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
              </td>
              <td style={{ fontWeight: 500 }}>{u.name || u.email}</td>
              <td>{u.meetings || 0}</td>
              <td>{u.hours?.toFixed(1) || 0}h</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
