import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [org, setOrg] = useState({ name: '', email: '', webhook_url: '', language: 'ru', timezone: 'Europe/Moscow' });
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
      // ignore
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
      setSaveMsg('✅ Настройки сохранены');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err) {
      setSaveMsg(`⚠️ ${err.message}`);
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
      setSaveMsg(`⚠️ ${err.message}`);
    }
  };

  const handleRevokeKey = async (keyId) => {
    if (!window.confirm('Отозвать API-ключ?')) return;
    try {
      await api.delete(`/api/v1/admin/api-keys/${keyId}`);
      await loadSettings();
    } catch (err) {
      setSaveMsg(`⚠️ ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Настройки</h1>
        <p className="page-subtitle">Конфигурация организации, интеграций и API</p>
      </div>

      {/* Organization Settings */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h3 className="card-title">Организация</h3>
        </div>
        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Название организации</label>
              <input className="form-input" value={org.name} onChange={(e) => setOrg({ ...org, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Контактный email</label>
              <input className="form-input" type="email" value={org.email} onChange={(e) => setOrg({ ...org, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Webhook URL</label>
              <input className="form-input" value={org.webhook_url} onChange={(e) => setOrg({ ...org, webhook_url: e.target.value })} placeholder="https://your-app.com/webhook" />
              <span className="form-hint">Отправка уведомлений о завершении обработки</span>
            </div>
            <div className="form-group">
              <label className="form-label">Язык</label>
              <select className="form-input" value={org.language} onChange={(e) => setOrg({ ...org, language: e.target.value })}>
                <option value="ru">Русский</option>
                <option value="en">English</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Часовой пояс</label>
              <select className="form-input" value={org.timezone} onChange={(e) => setOrg({ ...org, timezone: e.target.value })}>
                <option value="Europe/Moscow">Москва (UTC+3)</option>
                <option value="Europe/Kaliningrad">Калининград (UTC+2)</option>
                <option value="Asia/Yekaterinburg">Екатеринбург (UTC+5)</option>
                <option value="Asia/Novosibirsk">Новосибирск (UTC+7)</option>
                <option value="Asia/Vladivostok">Владивосток (UTC+10)</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner" /> : '💾'} Сохранить
            </button>
            {saveMsg && <span style={{ fontSize: 'var(--font-sm)' }}>{saveMsg}</span>}
          </div>
        </form>
      </div>

      {/* Integrations */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h3 className="card-title">Подключения</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="connection-card">
            <div className="connection-icon" style={{ background: 'rgba(59,130,246,0.15)' }}>🔵</div>
            <div className="connection-info">
              <div className="connection-name">Zoom</div>
              <div className="connection-desc">Запись и транскрипция встреч</div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => window.location.href = api.getZoomAuthUrl(user?.organization_id)}>
              ⚙️ Настроить
            </button>
          </div>
          <div className="connection-card">
            <div className="connection-icon" style={{ background: 'rgba(245,158,11,0.15)' }}>🟡</div>
            <div className="connection-info">
              <div className="connection-name">Яндекс Диск</div>
              <div className="connection-desc">Сохранение результатов анализа</div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => window.location.href = api.getYandexAuthUrl(user?.organization_id)}>
              ⚙️ Настроить
            </button>
          </div>
          <div className="connection-card">
            <div className="connection-icon" style={{ background: 'rgba(99,102,241,0.15)' }}>🤖</div>
            <div className="connection-info">
              <div className="connection-name">Telegram Bot</div>
              <div className="connection-desc">Уведомления о встречах в Telegram</div>
            </div>
            <span className="badge badge-info">Скоро</span>
          </div>
        </div>
      </div>

      {/* API Keys */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">API Ключи</h3>
        </div>

        {/* Create new key */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1, margin: 0 }}>
            <label className="form-label">Название ключа</label>
            <input className="form-input" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} placeholder="Production API" />
          </div>
          <button className="btn btn-primary" onClick={handleCreateKey} disabled={!newKeyName.trim()}>
            🔑 Создать
          </button>
        </div>

        {/* Show just-created key */}
        {createdKey && (
          <div style={{
            background: 'rgba(34,197,94,0.1)', border: '1px solid var(--color-success)',
            borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 16,
          }}>
            <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-success)', fontWeight: 600, marginBottom: 4 }}>
              🔑 Новый ключ создан (скопируйте, он показывается только один раз!):
            </div>
            <code style={{
              display: 'block', padding: 8, background: 'var(--color-bg)',
              borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-sm)',
              wordBreak: 'break-all', userSelect: 'all',
            }}>
              {createdKey}
            </code>
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => {
              navigator.clipboard.writeText(createdKey);
              setCreatedKey('');
            }}>
              📋 Скопировать и закрыть
            </button>
          </div>
        )}

        {/* Key list */}
        {apiKeys.length === 0 ? (
          <div className="empty-state" style={{ padding: '24px 0' }}>
            <div className="empty-icon">🔑</div>
            <div className="empty-title">Нет API ключей</div>
            <div className="empty-desc">Создайте ключ для интеграции с внешними сервисами</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Ключ</th>
                  <th>Создан</th>
                  <th>Последнее использование</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {apiKeys.map((k) => (
                  <tr key={k.id}>
                    <td style={{ fontWeight: 500 }}>{k.name}</td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--color-text-muted)', fontSize: 'var(--font-xs)' }}>
                      {k.prefix || '****'}...
                    </td>
                    <td style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-muted)' }}>
                      {k.created_at ? new Date(k.created_at).toLocaleDateString('ru-RU') : '—'}
                    </td>
                    <td style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-muted)' }}>
                      {k.last_used ? new Date(k.last_used).toLocaleDateString('ru-RU') : 'Никогда'}
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleRevokeKey(k.id)} style={{ color: 'var(--color-error)' }}>
                        Отозвать
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
