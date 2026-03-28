import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import {
  Settings, Building2, Mail, Globe, Languages, Clock,
  Link2, Video, HardDrive, Bot, Key, Plus, Copy, Trash2,
  CheckCircle2, Save, Loader2, ExternalLink, AlertCircle,
} from 'lucide-react';

function ConnectionCard({ icon: Icon, name, description, color, status, onAction, actionLabel }) {
  const isConnected = status === 'connected';
  return (
    <div className="connection-row" style={{ padding: 14 }}>
      <div className="connection-icon-wrap" style={{ background: `${color}15`, color }}>
        <Icon size={20} />
      </div>
      <div className="connection-details">
        <div className="connection-name">{name}</div>
        <div className="connection-desc">{description}</div>
      </div>
      {status === 'soon' ? (
        <span className="badge badge-info">Скоро</span>
      ) : isConnected ? (
        <span className="conn-badge conn-badge-active"><CheckCircle2 size={12} /> Подключён</span>
      ) : (
        <button className="btn btn-secondary btn-sm" onClick={onAction}>
          <Link2 size={14} /> {actionLabel || 'Настроить'}
        </button>
      )}
    </div>
  );
}

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [org, setOrg] = useState({
    name: '', email: '', webhook_url: '',
    language: 'ru', timezone: 'Europe/Moscow',
  });
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState('');

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      const [orgData, keysData] = await Promise.all([
        api.get('/api/v1/admin/settings').catch(() => ({})),
        api.get('/api/v1/admin/api-keys').catch(() => ({ keys: [] })),
      ]);
      if (orgData) setOrg((prev) => ({ ...prev, ...orgData }));
      setApiKeys(keysData.keys || []);
    } catch {
      // API error — показываем пустые данные
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg('');
    try {
      await api.put('/api/v1/admin/settings', org);
      setSaveMsg('success');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err) {
      setSaveMsg(err.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;
    try {
      const data = await api.post('/api/v1/admin/api-keys', { name: newKeyName });
      setCreatedKey(data.api_key || data.key || '');
      setNewKeyName('');
      await loadSettings();
    } catch (err) {
      setSaveMsg(err.message || 'Ошибка создания ключа');
    }
  };

  const handleRevokeKey = async (keyId) => {
    if (!window.confirm('Отозвать API-ключ? Это действие необратимо.')) return;
    try {
      await api.delete(`/api/v1/admin/api-keys/${keyId}`);
      await loadSettings();
    } catch (err) {
      setSaveMsg(err.message || 'Ошибка отзыва ключа');
    }
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(createdKey);
    setCreatedKey('');
  };

  if (loading) {
    return (
      <div className="dash-loading">
        <div className="spinner spinner-lg" />
        <p>Загрузка настроек...</p>
      </div>
    );
  }

  return (
    <div className="platform-page">
      <PageHeader
        title="Настройки"
        subtitle="Конфигурация организации, интеграций и API"
        breadcrumbs={[{ label: 'Управление', href: '#' }, { label: 'Настройки' }]}
      />

      {/* ── Organization Settings ────────────────────────── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h3 className="card-title"><Building2 size={16} /> Организация</h3>
        </div>
        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Название организации</label>
              <input
                className="form-input" value={org.name}
                onChange={(e) => setOrg({ ...org, name: e.target.value })}
                placeholder="AxioMeet Inc."
              />
            </div>
            <div className="form-group">
              <label className="form-label">Контактный email</label>
              <input
                className="form-input" type="email" value={org.email}
                onChange={(e) => setOrg({ ...org, email: e.target.value })}
                placeholder="admin@company.com"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Webhook URL</label>
              <input
                className="form-input" value={org.webhook_url}
                onChange={(e) => setOrg({ ...org, webhook_url: e.target.value })}
                placeholder="https://your-app.com/webhook"
              />
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: 2 }}>
                Отправка уведомлений о завершении обработки встречи
              </span>
            </div>
            <div className="form-group">
              <label className="form-label">Язык протоколов</label>
              <select className="form-input" value={org.language} onChange={(e) => setOrg({ ...org, language: e.target.value })}>
                <option value="ru">🇷🇺 Русский</option>
                <option value="en">🇬🇧 English</option>
                <option value="de">🇩🇪 Deutsch</option>
                <option value="es">🇪🇸 Español</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Часовой пояс</label>
              <select className="form-input" value={org.timezone} onChange={(e) => setOrg({ ...org, timezone: e.target.value })}>
                <option value="Europe/Kaliningrad">Калининград (UTC+2)</option>
                <option value="Europe/Moscow">Москва (UTC+3)</option>
                <option value="Asia/Yekaterinburg">Екатеринбург (UTC+5)</option>
                <option value="Asia/Novosibirsk">Новосибирск (UTC+7)</option>
                <option value="Asia/Vladivostok">Владивосток (UTC+10)</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <Loader2 size={16} className="spinning" /> : <Save size={16} />}
              Сохранить
            </button>
            {saveMsg === 'success' && (
              <span style={{ fontSize: 'var(--font-sm)', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={14} /> Настройки сохранены
              </span>
            )}
            {saveMsg && saveMsg !== 'success' && (
              <span style={{ fontSize: 'var(--font-sm)', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <AlertCircle size={14} /> {saveMsg}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* ── Integrations ────────────────────────── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h3 className="card-title"><Link2 size={16} /> Подключения</h3>
          <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', background: 'var(--bg-input)', padding: '3px 10px', borderRadius: 'var(--radius-full)' }}>
            Интеграции
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <ConnectionCard
            icon={Video} name="Zoom" description="Запись и транскрипция встреч"
            color="#2D8CFF"
            onAction={() => { window.location.href = api.getZoomAuthUrl(user?.organization_id); }}
          />
          <ConnectionCard
            icon={HardDrive} name="Яндекс Диск" description="Сохранение результатов анализа"
            color="#FC3F1D"
            onAction={() => { window.location.href = api.getYandexAuthUrl(user?.organization_id); }}
          />
          <ConnectionCard
            icon={HardDrive} name="Google Drive" description="Хранение протоколов и записей"
            color="#34A853"
            status="soon"
          />
          <ConnectionCard
            icon={Bot} name="Telegram Bot" description="Уведомления о встречах в Telegram"
            color="#6366f1" status="soon"
          />
        </div>
      </div>

      {/* ── API Keys ────────────────────────── */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title"><Key size={16} /> API Ключи</h3>
          <span className="badge badge-info">{apiKeys.length} ключей</span>
        </div>

        {/* Create new key */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1, margin: 0 }}>
            <label className="form-label">Название нового ключа</label>
            <input
              className="form-input" value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Production API"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateKey()}
            />
          </div>
          <button className="btn btn-primary" onClick={handleCreateKey} disabled={!newKeyName.trim()}>
            <Plus size={16} /> Создать
          </button>
        </div>

        {/* Show just-created key */}
        {createdKey && (
          <div style={{
            background: 'var(--success-bg)', border: '1px solid var(--success)',
            borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 16,
          }}>
            <div style={{ fontSize: 'var(--font-sm)', color: 'var(--success-text)', fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Key size={14} /> Новый ключ создан — скопируйте, он показывается один раз!
            </div>
            <code style={{
              display: 'block', padding: 10, background: 'var(--bg-card)',
              borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-sm)',
              wordBreak: 'break-all', userSelect: 'all',
              border: '1px solid var(--border-color)',
            }}>
              {createdKey}
            </code>
            <button className="btn btn-secondary btn-sm" style={{ marginTop: 10 }} onClick={handleCopyKey}>
              <Copy size={14} /> Скопировать и закрыть
            </button>
          </div>
        )}

        {/* Key list */}
        {apiKeys.length === 0 ? (
          <EmptyState icon="🔑" title="Нет API ключей" description="Создайте ключ для интеграции с внешними сервисами" />
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Ключ</th>
                  <th>Создан</th>
                  <th>Последнее использование</th>
                  <th style={{ width: 100 }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {apiKeys.map((k) => (
                  <tr key={k.id}>
                    <td style={{ fontWeight: 600 }}>{k.name}</td>
                    <td>
                      <code style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                        {k.prefix || '****'}...
                      </code>
                    </td>
                    <td style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                      {k.created_at ? new Date(k.created_at).toLocaleDateString('ru-RU') : '—'}
                    </td>
                    <td style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                      {k.last_used ? new Date(k.last_used).toLocaleDateString('ru-RU') : 'Никогда'}
                    </td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleRevokeKey(k.id)}
                        style={{ color: 'var(--error)' }}
                        title="Отозвать ключ"
                      >
                        <Trash2 size={14} /> Отозвать
                      </button>
                    </td>
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
