import { useState, useEffect } from 'react';
import api from '../api';

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
      // Use placeholder data for UI
      setAnalytics({
        total_meetings: 0,
        total_hours: 0,
        total_users: 0,
        active_users: 0,
        avg_meeting_duration_min: 0,
        cost_total_usd: 0,
        revenue_total_usd: 0,
        top_users: [],
        daily_usage: [],
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

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Аналитика</h1>
          <p className="page-subtitle">Использование платформы и ключевые метрики</p>
        </div>
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
      </div>

      {/* Key Metrics */}
      <div className="stat-grid" style={{ marginBottom: 32 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)' }}>🎤</div>
          <div className="stat-value">{d.total_meetings}</div>
          <div className="stat-label">Встреч обработано</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(6,182,212,0.15)' }}>⏱️</div>
          <div className="stat-value">{d.total_hours?.toFixed(1) || 0}h</div>
          <div className="stat-label">Часов обработки</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.15)' }}>👥</div>
          <div className="stat-value">{d.active_users || 0}</div>
          <div className="stat-label">Активных пользователей</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)' }}>⏳</div>
          <div className="stat-value">{d.avg_meeting_duration_min || 0}</div>
          <div className="stat-label">Средняя длительность (мин)</div>
        </div>
      </div>

      {/* Financial metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div className="card">
          <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-muted)', marginBottom: 4 }}>Расходы</div>
          <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, color: 'var(--color-error)' }}>
            ${d.cost_total_usd?.toFixed(2) || '0.00'}
          </div>
        </div>
        <div className="card">
          <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-muted)', marginBottom: 4 }}>Выручка</div>
          <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, color: 'var(--color-success)' }}>
            ${d.revenue_total_usd?.toFixed(2) || '0.00'}
          </div>
        </div>
        <div className="card">
          <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-muted)', marginBottom: 4 }}>Маржа</div>
          <div style={{
            fontSize: 'var(--font-2xl)', fontWeight: 800,
            color: margin >= 50 ? 'var(--color-success)' : margin >= 20 ? 'var(--color-warning)' : 'var(--color-error)',
          }}>
            {margin}%
          </div>
        </div>
        <div className="card">
          <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-muted)', marginBottom: 4 }}>Себестоимость/час</div>
          <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 800 }}>
            ${d.total_hours > 0 ? (d.cost_total_usd / d.total_hours).toFixed(4) : '0.00'}
          </div>
        </div>
      </div>

      {/* Usage Chart (CSS bars) */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h3 className="card-title">График использования</h3>
        </div>
        {(d.daily_usage || []).length === 0 ? (
          <div className="empty-state" style={{ padding: '32px 0' }}>
            <div className="empty-icon">📊</div>
            <div className="empty-title">Нет данных за период</div>
            <div className="empty-desc">Данные появятся после обработки первых встреч</div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 200, padding: '16px 0' }}>
            {d.daily_usage.map((day, idx) => {
              const maxVal = Math.max(...d.daily_usage.map((d) => d.hours || 0), 1);
              const height = Math.max(4, (day.hours / maxVal) * 160);
              return (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-muted)' }}>
                    {day.hours?.toFixed(1) || 0}h
                  </span>
                  <div style={{
                    width: '100%', maxWidth: 28, height,
                    background: 'linear-gradient(180deg, var(--color-primary-400), var(--color-primary-600))',
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.3s',
                  }} />
                  <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
                    {day.date?.slice(5) || ''}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Top Users */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Топ пользователей</h3>
        </div>
        {(d.top_users || []).length === 0 ? (
          <div className="empty-state" style={{ padding: '32px 0' }}>
            <div className="empty-icon">🏆</div>
            <div className="empty-title">Нет данных</div>
          </div>
        ) : (
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
                {d.top_users.slice(0, 10).map((u, idx) => (
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
        )}
      </div>
    </div>
  );
}
