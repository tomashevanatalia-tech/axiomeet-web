import { useState, useEffect } from 'react';
import api from '../api';
import {
  Activity, Brain, Mic, Zap, Bot, Sparkles,
  Video, HardDrive, Send, Globe, Server, Layout,
  Database, Building2, Users, FileText, CheckCircle2,
  AlertTriangle, XCircle, ExternalLink, RefreshCw,
  Shield, TrendingUp, BarChart3
} from 'lucide-react';

const ICON_MAP = {
  brain: Brain, mic: Mic, zap: Zap, bot: Bot, sparkles: Sparkles,
  video: Video, 'hard-drive': HardDrive, send: Send, globe: Globe,
  server: Server, layout: Layout, database: Database,
};

const STATUS_CONFIG = {
  configured: { label: 'Настроен', cls: 'status-ok', Icon: CheckCircle2 },
  connected: { label: 'Подключён', cls: 'status-ok', Icon: CheckCircle2 },
  running: { label: 'Работает', cls: 'status-ok', Icon: CheckCircle2 },
  missing: { label: 'Не настроен', cls: 'status-err', Icon: XCircle },
  not_configured: { label: 'Не настроен', cls: 'status-warn', Icon: AlertTriangle },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.missing;
  return (
    <span className={`plat-badge ${cfg.cls}`}>
      <cfg.Icon size={12} /> {cfg.label}
    </span>
  );
}

function MetricCard({ icon: Icon, value, label, color }) {
  return (
    <div className="plat-metric" style={{ '--mc': color }}>
      <div className="plat-metric-icon" style={{ background: `${color}15`, color }}>
        <Icon size={20} />
      </div>
      <div className="plat-metric-val">{value}</div>
      <div className="plat-metric-label">{label}</div>
    </div>
  );
}

function ServiceCard({ svc }) {
  const Icon = ICON_MAP[svc.icon] || Zap;
  return (
    <div className="plat-svc-card">
      <div className="plat-svc-top">
        <div className="plat-svc-icon" style={{ background: svc.status === 'configured' || svc.status === 'connected' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)' }}>
          <Icon size={18} style={{ color: svc.status === 'configured' || svc.status === 'connected' ? '#22c55e' : '#ef4444' }} />
        </div>
        <div className="plat-svc-info">
          <div className="plat-svc-name">{svc.name}</div>
          <div className="plat-svc-purpose">{svc.purpose}</div>
        </div>
        <StatusBadge status={svc.status} />
      </div>
      {svc.key_masked && (
        <div className="plat-svc-detail">
          <span className="plat-svc-key">Key: <code>{svc.key_masked}</code></span>
        </div>
      )}
      {svc.service_email && (
        <div className="plat-svc-detail">
          <span className="plat-svc-key">SA: <code>{svc.service_email}</code></span>
        </div>
      )}
      {svc.account_id && (
        <div className="plat-svc-detail">
          <span className="plat-svc-key">Account: <code>{svc.account_id}</code></span>
          {svc.has_webhook && <span className="plat-webhook-badge">WH1 ✓</span>}
          {svc.has_webhook_2 && <span className="plat-webhook-badge">WH2 ✓</span>}
        </div>
      )}
      <div className="plat-svc-actions">
        {svc.dashboard_url && (
          <a href={svc.dashboard_url} target="_blank" rel="noopener noreferrer" className="plat-link">
            <ExternalLink size={12} /> Dashboard
          </a>
        )}
        {svc.provider_url && svc.provider_url !== svc.dashboard_url && (
          <a href={svc.provider_url} target="_blank" rel="noopener noreferrer" className="plat-link">
            <ExternalLink size={12} /> Console
          </a>
        )}
      </div>
    </div>
  );
}

function OrgRow({ org }) {
  const planColors = { free: '#71717a', starter: '#3b82f6', pro: '#6366f1', enterprise: '#10b981' };
  return (
    <tr>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Building2 size={14} />
          <strong>{org.name}</strong>
        </div>
      </td>
      <td>
        <span className="plat-badge" style={{ background: `${planColors[org.plan] || '#71717a'}18`, color: planColors[org.plan] || '#71717a' }}>
          {(org.plan || 'free').toUpperCase()}
        </span>
      </td>
      <td>{org.users_count}</td>
      <td>{org.meetings_count}</td>
      <td className="muted">{org.created_at ? new Date(org.created_at).toLocaleDateString('ru-RU') : '—'}</td>
    </tr>
  );
}

function InfraCard({ svc }) {
  const Icon = ICON_MAP[svc.icon] || Server;
  return (
    <div className="plat-infra-card">
      <Icon size={16} />
      <div className="plat-infra-info">
        <span className="plat-infra-name">{svc.name}</span>
        {svc.url && <a href={svc.url} target="_blank" rel="noopener noreferrer" className="plat-infra-url">{new URL(svc.url).hostname}</a>}
      </div>
      <StatusBadge status={svc.status} />
    </div>
  );
}

export default function PlatformOverviewPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await api.getPlatformStatus();
      if (result.error) throw new Error(result.error);
      setData(result);
    } catch (err) {
      setError(err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="dash-loading"><div className="spinner spinner-lg" /><p>Загрузка инфраструктуры...</p></div>
  );

  if (error) return (
    <div className="dash-error">
      <AlertTriangle size={48} strokeWidth={1.5} />
      <h3>Ошибка загрузки</h3>
      <p>{error}</p>
      <button className="btn btn-primary" onClick={load}><RefreshCw size={16} /> Повторить</button>
    </div>
  );

  const m = data?.metrics || {};

  return (
    <div className="platform-page">
      <div className="dash-welcome">
        <div>
          <h1 className="dash-title"><Activity size={24} /> Platform Overview</h1>
          <p className="dash-subtitle">Управление инфраструктурой AxioMeet SaaS</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={load}>
          <RefreshCw size={14} /> Обновить
        </button>
      </div>

      {/* Key Metrics */}
      <div className="stat-grid-4">
        <MetricCard icon={Building2} value={m.total_orgs} label="Организаций" color="#6366f1" />
        <MetricCard icon={Users} value={m.total_users} label="Пользователей" color="#06b6d4" />
        <MetricCard icon={FileText} value={m.total_meetings} label="Всего встреч" color="#f59e0b" />
        <MetricCard icon={CheckCircle2} value={m.published_meetings} label="Опубликовано" color="#10b981" />
      </div>

      {/* AI Services */}
      <section className="plat-section">
        <h2 className="plat-section-title"><Brain size={18} /> AI Сервисы</h2>
        <div className="plat-svc-grid">
          {(data?.ai_services || []).map(svc => <ServiceCard key={svc.id} svc={svc} />)}
        </div>
      </section>

      {/* Platform Integrations */}
      <section className="plat-section">
        <h2 className="plat-section-title"><Shield size={18} /> Платформенные интеграции</h2>
        <div className="plat-svc-grid">
          {(data?.platform_integrations || []).map(svc => <ServiceCard key={svc.id} svc={svc} />)}
        </div>
      </section>

      {/* Client OAuth */}
      <section className="plat-section">
        <h2 className="plat-section-title"><Globe size={18} /> Client OAuth</h2>
        <div className="plat-svc-grid plat-svc-grid-2">
          {(data?.client_oauth || []).map(svc => <ServiceCard key={svc.id} svc={svc} />)}
        </div>
      </section>

      {/* Infrastructure */}
      <section className="plat-section">
        <h2 className="plat-section-title"><Server size={18} /> Инфраструктура Railway</h2>
        <div className="plat-infra-grid">
          {(data?.railway_services || []).map(svc => <InfraCard key={svc.id} svc={svc} />)}
        </div>
      </section>

      {/* Organizations */}
      <section className="plat-section">
        <h2 className="plat-section-title"><Building2 size={18} /> Организации</h2>
        <div className="meetings-card">
          <div className="table-wrapper">
            <table className="meetings-table">
              <thead>
                <tr>
                  <th>Организация</th>
                  <th>План</th>
                  <th>Пользователи</th>
                  <th>Встречи</th>
                  <th>Создана</th>
                </tr>
              </thead>
              <tbody>
                {(data?.organizations || []).map(org => <OrgRow key={org.id} org={org} />)}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
