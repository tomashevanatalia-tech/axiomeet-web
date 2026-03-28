import { useState, useEffect } from 'react';
import api from '../api';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import {
  BarChart3, Clock, Users, Timer, DollarSign, TrendingUp,
  TrendingDown, Percent, Calculator, RefreshCw,
} from 'lucide-react';

function StatCard({ icon: Icon, value, label, accentColor, trend }) {
  return (
    <div className="stat-card" style={{ '--accent': accentColor }}>
      <div className="stat-card-top">
        <div className="stat-card-icon" style={{ background: `${accentColor}15`, color: accentColor }}>
          <Icon size={20} />
        </div>
        {trend !== undefined && trend !== null && (
          <span className="stat-trend" style={{ color: trend >= 0 ? '#10b981' : '#ef4444' }}>
            {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
    </div>
  );
}

function FinanceCard({ icon: Icon, label, value, color, subtitle }) {
  return (
    <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 'var(--radius-md)',
          background: `${color}15`, color, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={18} />
        </div>
        <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, color: color || 'var(--text-primary)', letterSpacing: '-0.025em' }}>
        {value}
      </div>
      {subtitle && (
        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: 4 }}>{subtitle}</div>
      )}
    </div>
  );
}

function UsageChart({ data }) {
  const maxVal = Math.max(...data.map((d) => d.hours || 0), 1);
  return (
    <div style={{ padding: '16px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 200 }}>
        {data.map((day, idx) => {
          const height = Math.max(4, ((day.hours || 0) / maxVal) * 160);
          return (
            <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', fontWeight: 500 }}>
                {day.hours?.toFixed(1) || 0}h
              </span>
              <div
                style={{
                  width: '100%', maxWidth: 28, height,
                  background: 'linear-gradient(180deg, var(--primary-400), var(--primary-600))',
                  borderRadius: '4px 4px 0 0',
                  transition: 'height 0.5s ease',
                  opacity: 0.9,
                }}
                title={`${day.date}: ${day.hours?.toFixed(2) || 0}h`}
              />
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                {day.date?.slice(5) || ''}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TopUsersTable({ users }) {
  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th style={{ width: 50 }}>#</th>
            <th>Пользователь</th>
            <th>Встреч</th>
            <th>Часов</th>
          </tr>
        </thead>
        <tbody>
          {users.slice(0, 10).map((u, idx) => (
            <tr key={u.id || idx}>
              <td style={{ fontWeight: 700, color: idx < 3 ? 'var(--warning)' : 'var(--text-muted)' }}>
                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
              </td>
              <td>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.name || u.email}</div>
                {u.name && u.email && (
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>{u.email}</div>
                )}
              </td>
              <td style={{ fontWeight: 500 }}>{u.meetings || 0}</td>
              <td>
                <span style={{ fontWeight: 600, color: 'var(--primary-600)' }}>{u.hours?.toFixed(1) || 0}h</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

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
      <div className="dash-loading">
        <div className="spinner spinner-lg" />
        <p>Загрузка аналитики...</p>
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
          className={`btn ${p === period ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setPeriod(p)}
        >
          {p === '7d' ? '7 дней' : p === '30d' ? '30 дней' : '90 дней'}
        </button>
      ))}
      <button className="btn btn-ghost btn-sm" onClick={loadAnalytics} title="Обновить">
        <RefreshCw size={14} />
      </button>
    </div>
  );

  return (
    <div className="platform-page">
      <PageHeader
        title="Аналитика"
        subtitle="Использование платформы и ключевые метрики"
        breadcrumbs={[{ label: 'Управление', href: '#' }, { label: 'Аналитика' }]}
      >
        {periodButtons}
      </PageHeader>

      {/* Key Metrics */}
      <div className="stat-grid-4" style={{ marginBottom: 24 }}>
        <StatCard icon={BarChart3} value={d.total_meetings} label="Встреч обработано" accentColor="#6366f1" />
        <StatCard icon={Clock} value={`${d.total_hours?.toFixed(1) || 0}h`} label="Часов обработки" accentColor="#06b6d4" />
        <StatCard icon={Users} value={d.active_users || 0} label="Активных пользователей" accentColor="#10b981" />
        <StatCard icon={Timer} value={`${d.avg_meeting_duration_min || 0} мин`} label="Средняя длительность" accentColor="#f59e0b" />
      </div>

      {/* Financial metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <FinanceCard
          icon={TrendingDown} label="Расходы"
          value={`$${d.cost_total_usd?.toFixed(2) || '0.00'}`}
          color="var(--error)"
        />
        <FinanceCard
          icon={TrendingUp} label="Выручка"
          value={`$${d.revenue_total_usd?.toFixed(2) || '0.00'}`}
          color="var(--success)"
        />
        <FinanceCard
          icon={Percent} label="Маржа"
          value={`${margin}%`}
          color={margin >= 50 ? 'var(--success)' : margin >= 20 ? 'var(--warning)' : 'var(--error)'}
        />
        <FinanceCard
          icon={Calculator} label="Себестоимость / час"
          value={`$${d.total_hours > 0 ? (d.cost_total_usd / d.total_hours).toFixed(4) : '0.00'}`}
          color="var(--primary-600)"
          subtitle="Средняя стоимость обработки"
        />
      </div>

      {/* Usage Chart */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h3 className="card-title"><BarChart3 size={16} /> График использования</h3>
          <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', background: 'var(--bg-input)', padding: '3px 10px', borderRadius: 'var(--radius-full)' }}>
            {period === '7d' ? 'Последние 7 дней' : period === '30d' ? 'Последние 30 дней' : 'Последние 90 дней'}
          </span>
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
          <h3 className="card-title"><Users size={16} /> Топ пользователей</h3>
          <span className="badge badge-info">{(d.top_users || []).length} чел.</span>
        </div>
        {(d.top_users || []).length === 0 ? (
          <EmptyState icon="🏆" title="Нет данных" description="Пользователи появятся после обработки встреч" />
        ) : (
          <TopUsersTable users={d.top_users} />
        )}
      </div>
    </div>
  );
}
