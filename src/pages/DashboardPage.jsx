import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import api from '../api';
import {
  LayoutDashboard, Clock, Zap, Video, FileText, Users,
  TrendingUp, Calendar, ArrowRight, Shield, Building2,
  CheckCircle2, AlertCircle, Wifi, WifiOff, RefreshCw,
  BarChart3, Mic, Globe, HardDrive
} from 'lucide-react';

const STATUS_MAP = {
  PUBLISHED: { label: 'Готово', cls: 'badge-success', icon: CheckCircle2 },
  READY: { label: 'Готово', cls: 'badge-success', icon: CheckCircle2 },
  PROCESSING: { label: 'Обработка', cls: 'badge-warning', icon: RefreshCw },
  ERROR: { label: 'Ошибка', cls: 'badge-error', icon: AlertCircle },
  SKIPPED_NO_VIDEO: { label: 'Пропущено', cls: 'badge-muted', icon: AlertCircle },
};

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function StatCard({ icon: Icon, value, label, sublabel, accentColor, trend }) {
  return (
    <div className="stat-card" style={{ '--accent': accentColor }}>
      <div className="stat-card-top">
        <div className="stat-card-icon" style={{ background: `${accentColor}15`, color: accentColor }}>
          <Icon size={20} />
        </div>
        {trend && (
          <span className="stat-trend" style={{ color: trend > 0 ? '#10b981' : '#ef4444' }}>
            <TrendingUp size={14} />
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
      {sublabel && <div className="stat-card-sublabel">{sublabel}</div>}
    </div>
  );
}

function OrgBanner({ usage, orgName }) {
  const plan = (usage?.plan || 'free').toUpperCase();
  const isUnlimited = usage?.hours_limit === -1 || plan === 'ENTERPRISE';
  const isPro = plan === 'PRO';

  return (
    <div className="org-banner">
      <div className="org-banner-left">
        <div className="org-logo">
          <Building2 size={24} />
        </div>
        <div>
          <h2 className="org-name">{orgName || 'Организация'}</h2>
          <div className="org-plan-row">
            <span className={`plan-badge plan-${plan.toLowerCase()}`}>
              <Shield size={12} />
              {plan}
            </span>
            <span className="org-access">
              {isUnlimited ? '∞ Безлимит' : isPro ? `${usage?.hours_limit || 100}ч / мес` : `${usage?.hours_limit || 3}ч / мес`}
            </span>
          </div>
        </div>
      </div>
      <div className="org-banner-right">
        <div className="org-period">
          <Calendar size={14} />
          <span>
            {usage?.period_start ? new Date(usage.period_start).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }) : 'Текущий период'}
          </span>
        </div>
      </div>
    </div>
  );
}

function UsageGauge({ usage }) {
  const used = usage?.hours_used || 0;
  const limit = usage?.hours_limit || 100;
  const isUnlimited = limit === -1;
  const pct = isUnlimited ? 0 : Math.min((used / limit) * 100, 100);
  const remaining = isUnlimited ? '∞' : Math.max(0, limit - used).toFixed(1);
  const gaugeColor = pct > 80 ? '#ef4444' : pct > 60 ? '#f59e0b' : '#6366f1';

  return (
    <div className="usage-gauge-card">
      <div className="usage-gauge-header">
        <h3><Clock size={16} /> Использование ресурсов</h3>
        <span className="usage-period-label">Текущий период</span>
      </div>
      <div className="usage-gauge-body">
        <div className="gauge-circle-wrap">
          <svg viewBox="0 0 120 120" className="gauge-svg">
            <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth="10" />
            <circle
              cx="60" cy="60" r="50" fill="none"
              stroke={gaugeColor}
              strokeWidth="10"
              strokeDasharray={`${pct * 3.14} ${314 - pct * 3.14}`}
              strokeDashoffset="0"
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
              style={{ transition: 'stroke-dasharray 1s ease' }}
            />
          </svg>
          <div className="gauge-center">
            <span className="gauge-value">{used.toFixed(1)}</span>
            <span className="gauge-unit">часов</span>
          </div>
        </div>
        <div className="gauge-stats">
          <div className="gauge-stat">
            <span className="gauge-stat-label">Использовано</span>
            <span className="gauge-stat-value">{used.toFixed(1)}ч</span>
          </div>
          <div className="gauge-stat">
            <span className="gauge-stat-label">Осталось</span>
            <span className="gauge-stat-value">{remaining}{!isUnlimited && 'ч'}</span>
          </div>
          <div className="gauge-stat">
            <span className="gauge-stat-label">Лимит</span>
            <span className="gauge-stat-value">{isUnlimited ? '∞' : `${limit}ч`}</span>
          </div>
        </div>
      </div>
      {!isUnlimited && (
        <div className="usage-bar-wrap">
          <div className="usage-bar">
            <div className="usage-bar-fill" style={{ width: `${pct}%`, background: gaugeColor }} />
          </div>
          <span className="usage-bar-label">{pct.toFixed(0)}% использовано</span>
        </div>
      )}
    </div>
  );
}

function ConnectionsCard({ connections }) {
  const providers = [
    { key: 'zoom', name: 'Zoom', icon: Video, color: '#2D8CFF', desc: 'Запись и транскрибация встреч' },
    { key: 'google_drive', name: 'Google Drive', icon: HardDrive, color: '#34A853', desc: 'Хранение протоколов и записей' },
    { key: 'yandex_disk', name: 'Яндекс Диск', icon: Globe, color: '#FC3F1D', desc: 'Альтернативное хранилище' },
  ];

  const activeMap = {};
  (connections || []).forEach(c => { activeMap[c.provider] = c; });

  return (
    <div className="connections-card">
      <div className="card-header-row">
        <h3><Wifi size={16} /> Подключения</h3>
        <span className="connections-count">{Object.keys(activeMap).length} / {providers.length}</span>
      </div>
      <div className="connections-list">
        {providers.map(p => {
          const conn = activeMap[p.key];
          const active = conn && conn.status === 'active';
          return (
            <div key={p.key} className={`connection-row ${active ? 'active' : ''}`}>
              <div className="connection-icon-wrap" style={{ background: `${p.color}15`, color: p.color }}>
                <p.icon size={18} />
              </div>
              <div className="connection-details">
                <div className="connection-name">{p.name}</div>
                <div className="connection-desc">{p.desc}</div>
              </div>
              {active ? (
                <span className="conn-badge conn-badge-active"><CheckCircle2 size={12} /> Подключён</span>
              ) : (
                <span className="conn-badge conn-badge-inactive"><WifiOff size={12} /> Нет</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MeetingsTable({ meetings }) {
  if (!meetings || meetings.length === 0) {
    return (
      <div className="meetings-card">
        <div className="card-header-row">
          <h3><Mic size={16} /> Последние встречи</h3>
        </div>
        <div className="empty-meetings">
          <Mic size={40} strokeWidth={1} />
          <p>Нет обработанных встреч</p>
          <span>Подключите Zoom или загрузите запись, чтобы начать</span>
        </div>
      </div>
    );
  }

  return (
    <div className="meetings-card">
      <div className="card-header-row">
        <h3><Mic size={16} /> Последние встречи</h3>
        <button className="btn-link">
          Все встречи <ArrowRight size={14} />
        </button>
      </div>
      <div className="table-wrapper">
        <table className="meetings-table">
          <thead>
            <tr>
              <th>Тема</th>
              <th>Статус</th>
              <th>Дата</th>
              <th>Время</th>
            </tr>
          </thead>
          <tbody>
            {meetings.map(m => {
              const st = STATUS_MAP[m.status || m.state] || { label: m.status || m.state || '—', cls: 'badge-muted' };
              const StIcon = st.icon || FileText;
              return (
                <tr key={m.id}>
                  <td className="meeting-topic">
                    <FileText size={14} />
                    {m.topic || 'Без темы'}
                  </td>
                  <td>
                    <span className={`status-chip ${st.cls}`}>
                      <StIcon size={12} />
                      {st.label}
                    </span>
                  </td>
                  <td className="muted">{formatDate(m.created_at)}</td>
                  <td className="muted">{formatTime(m.created_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const [dashData, usageData, connectionsData, meetingsData] = await Promise.all([
        api.getDashboard().catch(() => ({})),
        api.getUsage().catch(() => null),
        api.getConnections().catch(() => null),
        api.getMeetings(20).catch(() => null),
      ]);

      // Normalize connections — API may return array or { connections: [...] }
      let connections = connectionsData ?? dashData?.connections ?? [];
      if (connections && !Array.isArray(connections)) {
        connections = connections.connections ?? connections.items ?? [];
      }

      // Normalize meetings — API may return array or { meetings: [...] }
      let recent_meetings = meetingsData ?? dashData?.recent_meetings ?? dashData?.meetings ?? [];
      if (recent_meetings && !Array.isArray(recent_meetings)) {
        recent_meetings = recent_meetings.meetings ?? recent_meetings.items ?? [];
      }

      // Normalize usage — may be top-level or nested
      const usage = usageData ?? dashData?.usage ?? dashData?.stats ?? {};

      setData({ ...dashData, usage, connections, recent_meetings });
    } catch (err) {
      setError(err.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dash-loading">
        <div className="spinner spinner-lg" />
        <p>Загрузка данных...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dash-error">
        <AlertCircle size={48} strokeWidth={1.5} />
        <h3>Ошибка загрузки</h3>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={loadDashboard}>
          <RefreshCw size={16} /> Повторить
        </button>
      </div>
    );
  }

  const usage = data?.usage || {};
  const connections = data?.connections || [];
  const meetings = data?.recent_meetings || [];
  const meetingsPublished = meetings.filter(m => m.state === 'PUBLISHED' || m.status === 'READY').length;

  return (
    <div className="dashboard-page">
      {/* Welcome */}
      <div className="dash-welcome">
        <div>
          <h1 className="dash-title">
            <LayoutDashboard size={24} />
            Dashboard
          </h1>
          <p className="dash-subtitle">Добро пожаловать, {user?.name || 'User'} 👋</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={loadDashboard}>
          <RefreshCw size={14} /> Обновить
        </button>
      </div>

      {/* Org Banner */}
      <OrgBanner usage={usage} orgName={data?.organization_name || data?.org?.name || data?.org_name || 'Организация'} />

      {/* Stats Row */}
      <div className="stat-grid-4">
        <StatCard
          icon={Clock}
          value={`${(usage.hours_used || 0).toFixed(1)}ч`}
          label="Использовано"
          sublabel={`из ${usage.hours_limit > 0 ? usage.hours_limit + 'ч' : '∞'}`}
          accentColor="#6366f1"
        />
        <StatCard
          icon={Mic}
          value={meetings.length}
          label="Встреч сегодня"
          sublabel="Последние результаты"
          accentColor="#06b6d4"
        />
        <StatCard
          icon={FileText}
          value={meetingsPublished}
          label="Протоколов"
          sublabel="Готово к рассылке"
          accentColor="#10b981"
        />
        <StatCard
          icon={Users}
          value={connections.filter(c => c.status === 'active').length}
          label="Подключений"
          sublabel="Активных интеграций"
          accentColor="#f59e0b"
        />
      </div>

      {/* Two Column Layout */}
      <div className="dash-two-col">
        <UsageGauge usage={usage} />
        <ConnectionsCard connections={connections} />
      </div>

      {/* Meetings */}
      <MeetingsTable meetings={meetings} />
    </div>
  );
}
