import { createElement, useCallback, useEffect, useState } from 'react';
import api from '../api';
import PageHeader from '../components/PageHeader';
import {
  AlertCircle, Bot, Building2, CheckCircle2, Copy, ExternalLink, HardDrive,
  Key, Link2, Loader2, Plus, RefreshCw, Save, Trash2, Video, XCircle,
} from 'lucide-react';

function statusMeta(status) {
  if (['connected', 'active', 'healthy'].includes(status)) return { label: 'Подключено', cls: 'conn-badge-active', icon: CheckCircle2 };
  if (['error', 'expired'].includes(status)) return { label: status === 'expired' ? 'Истёк доступ' : 'Ошибка', cls: 'conn-badge-error', icon: AlertCircle };
  return { label: 'Не подключено', cls: 'conn-badge-muted', icon: XCircle };
}

function ConnectionStatus({ status }) {
  const meta = statusMeta(status);
  const Icon = meta.icon;
  return <span className={`conn-badge ${meta.cls}`}><Icon size={12} /> {meta.label}</span>;
}

function ConnectionShell({ icon, color, title, subtitle, status, meta, actions }) {
  return (
    <div className="connection-card-v2">
      <div className="connection-card-main">
        <div className="connection-icon-wrap" style={{ background: `${color}14`, color }}>{createElement(icon, { size: 21 })}</div>
        <div className="connection-card-copy"><div><strong>{title}</strong><ConnectionStatus status={status} /></div><p>{subtitle}</p>{meta && <span>{meta}</span>}</div>
      </div>
      <div className="connection-card-actions">{actions}</div>
    </div>
  );
}

export default function AdminSettingsPage() {
  const [org, setOrg] = useState({ name: '', email: '', webhook_url: '', language: 'ru', timezone: 'Europe/Moscow' });
  const [connections, setConnections] = useState({ zoom_accounts: [], zoom_oauth_available: false, google_drive: null, telegram: null, others: [] });
  const [zoomFormOpen, setZoomFormOpen] = useState(
    () => new URLSearchParams(window.location.search).get('zoom_setup') === '1',
  );
  const [zoomReturnTo] = useState(() => {
    const returnTo = new URLSearchParams(window.location.search).get('return_to');
    return returnTo === '/onboarding' ? returnTo : '';
  });
  const [zoomCredentials, setZoomCredentials] = useState({ label: '', account_id: '', client_id: '', client_secret: '' });
  const [apiKeys, setApiKeys] = useState([]);
  const [driveFolder, setDriveFolder] = useState('');
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState(null);

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    window.setTimeout(() => setMessage(null), 5000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsData, keysData, connectionsData] = await Promise.all([
        api.getAdminSettings(),
        api.get('/api/v1/admin/api-keys').catch(() => ({ api_keys: [] })),
        api.getAdminConnections(),
      ]);
      setOrg({
        name: settingsData.organization_name || settingsData.name || '',
        email: settingsData.contact_email || settingsData.email || '',
        webhook_url: settingsData.webhook_url || '',
        language: settingsData.language || 'ru',
        timezone: settingsData.timezone || 'Europe/Moscow',
      });
      setApiKeys(keysData.api_keys || keysData.keys || []);
      setConnections({
        zoom_accounts: connectionsData.zoom_accounts || [],
        zoom_oauth_available: connectionsData.zoom_oauth_available === true,
        google_drive: connectionsData.google_drive || null,
        telegram: connectionsData.telegram || null,
        others: connectionsData.other_connections || [],
      });
      setDriveFolder(connectionsData.google_drive?.folder_id || '');
    } catch (err) {
      showMessage(err.message || 'Не удалось загрузить настройки', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const params = new URLSearchParams(window.location.search);
    const zoomResult = params.get('zoom');
    if (zoomResult === 'connected') {
      setMessage({ text: 'Zoom подключён. Аккаунт добавлен отдельным источником встреч.', type: 'success' });
    } else if (zoomResult === 'error') {
      setMessage({ text: `Zoom не подключён: ${params.get('reason') || 'авторизация не завершена'}`, type: 'error' });
    }
    if (zoomResult || params.has('zoom_setup') || params.has('return_to')) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [load]);

  const saveSettings = async (event) => {
    event.preventDefault();
    setBusy('settings');
    try {
      await api.updateAdminSettings({
        organization_name: org.name,
        contact_email: org.email,
        webhook_url: org.webhook_url,
        language: org.language,
        timezone: org.timezone,
      });
      showMessage('Настройки организации сохранены');
    } catch (err) {
      showMessage(err.message || 'Не удалось сохранить настройки', 'error');
    } finally {
      setBusy('');
    }
  };

  const connectZoomOAuth = async () => {
    setBusy('zoom-oauth');
    try {
      const result = await api.getZoomConnectUrl();
      const authorizationUrl = result.authorization_url || result.auth_url || result.url;
      if (!authorizationUrl) throw new Error('Сервер не вернул ссылку авторизации Zoom');
      window.location.assign(authorizationUrl);
    } catch (err) {
      showMessage(err.message || 'Не удалось начать подключение Zoom', 'error');
      setBusy('');
    }
  };

  const connectZoomWithCredentials = async (event) => {
    event.preventDefault();
    setBusy('zoom-create');
    try {
      const result = await api.createZoomAccount({
        label: zoomCredentials.label.trim(),
        account_id: zoomCredentials.account_id.trim(),
        client_id: zoomCredentials.client_id.trim(),
        client_secret: zoomCredentials.client_secret.trim(),
      });
      showMessage(result.message || 'Zoom подключён и проверен');
      setZoomCredentials({ label: '', account_id: '', client_id: '', client_secret: '' });
      setZoomFormOpen(false);
      await load();
      if (zoomReturnTo) window.location.assign(zoomReturnTo);
    } catch (err) {
      showMessage(err.message || 'Не удалось подключить Zoom', 'error');
    } finally {
      setBusy('');
    }
  };

  const connectTelegram = async () => {
    setBusy('telegram-connect');
    try {
      const result = await api.getTelegramConnectUrl();
      const authorizationUrl = result.authorization_url || result.bot_url || result.url;
      if (!authorizationUrl) throw new Error('Сервер не вернул ссылку подключения Telegram');
      window.location.assign(authorizationUrl);
    } catch (err) {
      showMessage(err.message || 'Не удалось начать подключение Telegram', 'error');
      setBusy('');
    }
  };

  const testZoom = async (account) => {
    setBusy(`zoom-test-${account.id}`);
    try {
      const result = await api.testZoomAccount(account.id);
      showMessage(result.message || `Zoom «${account.label}» работает`);
      await load();
    } catch (err) {
      showMessage(err.message || 'Zoom не прошёл проверку', 'error');
    } finally {
      setBusy('');
    }
  };

  const disconnectZoom = async (account) => {
    if (!window.confirm(`Отключить Zoom «${account.label}»? Уже обработанные встречи останутся в системе.`)) return;
    setBusy(`zoom-delete-${account.id}`);
    try {
      await api.disconnectZoomAccount(account.id);
      showMessage(`Zoom «${account.label}» отключён`);
      await load();
    } catch (err) {
      showMessage(err.message || 'Не удалось отключить Zoom', 'error');
    } finally {
      setBusy('');
    }
  };

  const testDrive = async () => {
    setBusy('drive-test');
    try {
      const result = await api.testGoogleDrive();
      showMessage(result.message || `Google Drive доступен: ${result.folder_name || result.folder_id}`);
      await load();
    } catch (err) {
      showMessage(err.message || 'Google Drive не прошёл проверку', 'error');
    } finally {
      setBusy('');
    }
  };

  const saveDriveFolder = async () => {
    if (!driveFolder.trim()) return;
    setBusy('drive-save');
    try {
      await api.updateGoogleDriveFolder(driveFolder.trim());
      showMessage('Контрольная папка Google Drive сохранена и проверена');
      await load();
    } catch (err) {
      showMessage(err.message || 'Не удалось сохранить папку Google Drive', 'error');
    } finally {
      setBusy('');
    }
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) return;
    setBusy('key-create');
    try {
      const result = await api.post('/api/v1/admin/api-keys', { name: newKeyName.trim() });
      setCreatedKey(result.api_key?.key || result.api_key || result.key || '');
      setNewKeyName('');
      await load();
    } catch (err) {
      showMessage(err.message || 'Не удалось создать API-ключ', 'error');
    } finally {
      setBusy('');
    }
  };

  const revokeApiKey = async (key) => {
    if (!window.confirm(`Отозвать ключ «${key.name}»?`)) return;
    setBusy(`key-${key.id}`);
    try {
      await api.delete(`/api/v1/admin/api-keys/${key.id}`);
      await load();
    } catch (err) {
      showMessage(err.message || 'Не удалось отозвать ключ', 'error');
    } finally {
      setBusy('');
    }
  };

  if (loading) return <div className="dash-loading"><div className="spinner spinner-lg" /><p>Загрузка настроек…</p></div>;

  return (
    <div className="platform-page">
      <PageHeader title="Настройки" subtitle="Организация, подключения и API-ключи" breadcrumbs={[{ label: 'Управление' }, { label: 'Настройки' }]}>
        <button className="btn btn-secondary btn-sm" onClick={load}><RefreshCw size={14} /> Обновить</button>
      </PageHeader>

      {message && <div className={`workspace-notice workspace-notice-${message.type}`}>{message.text}</div>}

      <div className="card settings-section">
        <div className="card-header"><h3 className="card-title"><Building2 size={17} /> Организация</h3></div>
        <form onSubmit={saveSettings} className="settings-form-grid">
          <label className="form-group"><span className="form-label">Название организации</span><input className="form-input" value={org.name} onChange={(event) => setOrg({ ...org, name: event.target.value })} /></label>
          <label className="form-group"><span className="form-label">Контактный email</span><input className="form-input" type="email" value={org.email} onChange={(event) => setOrg({ ...org, email: event.target.value })} /></label>
          <label className="form-group"><span className="form-label">Webhook URL</span><input className="form-input" value={org.webhook_url} onChange={(event) => setOrg({ ...org, webhook_url: event.target.value })} placeholder="https://…" /></label>
          <label className="form-group"><span className="form-label">Язык протоколов</span><select className="form-input" value={org.language} onChange={(event) => setOrg({ ...org, language: event.target.value })}><option value="ru">Русский</option><option value="en">English</option><option value="de">Deutsch</option><option value="es">Español</option></select></label>
          <label className="form-group"><span className="form-label">Часовой пояс</span><select className="form-input" value={org.timezone} onChange={(event) => setOrg({ ...org, timezone: event.target.value })}><option value="Europe/Moscow">Москва (UTC+3)</option><option value="Asia/Bangkok">Таиланд (UTC+7)</option><option value="Australia/Sydney">Сидней</option><option value="Asia/Novosibirsk">Новосибирск (UTC+7)</option><option value="Asia/Vladivostok">Владивосток (UTC+10)</option></select></label>
          <div className="settings-form-actions"><button type="submit" className="btn btn-primary" disabled={busy === 'settings'}>{busy === 'settings' ? <Loader2 size={15} className="spinning" /> : <Save size={15} />} Сохранить</button></div>
        </form>
      </div>

      <div className="card settings-section">
        <div className="card-header"><h3 className="card-title"><Link2 size={17} /> Подключения</h3><span className="badge badge-info">{connections.zoom_accounts.length} Zoom</span></div>
        <div className="connections-stack">
          {connections.zoom_accounts.map((account) => (
            <ConnectionShell
              key={account.id}
              icon={Video}
              color="#2D8CFF"
              title={account.label || `Zoom ${account.id}`}
              subtitle={`Zoom · ${account.auth_type === 'oauth' ? 'OAuth' : 'Server-to-Server'}`}
              status={account.status}
              meta={`${account.meetings_count || 0} встреч · последняя проверка ${account.last_check_at ? new Date(account.last_check_at).toLocaleString('ru-RU') : 'ещё не выполнялась'}${account.last_error ? ` · ${account.last_error}` : ''}`}
              actions={<><button className="btn btn-secondary btn-sm" onClick={() => testZoom(account)} disabled={busy === `zoom-test-${account.id}`}>Проверить</button><button className="btn btn-ghost btn-sm danger" onClick={() => disconnectZoom(account)} disabled={busy === `zoom-delete-${account.id}`}><Trash2 size={14} /> Отключить</button></>}
            />
          ))}
          <button type="button" className="connection-add" onClick={() => setZoomFormOpen((open) => !open)} disabled={connections.zoom_accounts.length >= 5}><Plus size={17} /> {connections.zoom_accounts.length ? 'Подключить ещё один Zoom' : 'Подключить Zoom'}<span>{connections.zoom_accounts.length}/5</span></button>
          {zoomFormOpen && (
            <form className="zoom-credentials-editor" onSubmit={connectZoomWithCredentials}>
              <div className="zoom-credentials-copy">
                <strong>Реквизиты Zoom Server-to-Server OAuth</strong>
                <span>Введите данные приложения из Zoom Marketplace. Перед сохранением AxioMeet проверит доступ и не покажет Client Secret повторно.</span>
              </div>
              <div className="settings-form-grid">
                <label className="form-group"><span className="form-label">Название подключения</span><input className="form-input" value={zoomCredentials.label} onChange={(event) => setZoomCredentials({ ...zoomCredentials, label: event.target.value })} placeholder="Например, Zoom IT-команды" maxLength={255} /></label>
                <label className="form-group"><span className="form-label">Account ID</span><input className="form-input" value={zoomCredentials.account_id} onChange={(event) => setZoomCredentials({ ...zoomCredentials, account_id: event.target.value })} autoComplete="off" maxLength={255} required /></label>
                <label className="form-group"><span className="form-label">Client ID</span><input className="form-input" value={zoomCredentials.client_id} onChange={(event) => setZoomCredentials({ ...zoomCredentials, client_id: event.target.value })} autoComplete="off" maxLength={255} required /></label>
                <label className="form-group"><span className="form-label">Client Secret</span><input className="form-input" type="password" value={zoomCredentials.client_secret} onChange={(event) => setZoomCredentials({ ...zoomCredentials, client_secret: event.target.value })} autoComplete="new-password" maxLength={255} required /></label>
              </div>
              <div className="zoom-credentials-actions">
                <button type="submit" className="btn btn-primary" disabled={busy === 'zoom-create' || !zoomCredentials.account_id.trim() || !zoomCredentials.client_id.trim() || !zoomCredentials.client_secret.trim()}>{busy === 'zoom-create' ? <Loader2 size={15} className="spinning" /> : <Video size={15} />} Проверить и подключить</button>
                {connections.zoom_oauth_available && <button type="button" className="btn btn-secondary" onClick={connectZoomOAuth} disabled={busy === 'zoom-oauth'}>{busy === 'zoom-oauth' ? <Loader2 size={15} className="spinning" /> : <ExternalLink size={15} />} Войти через Zoom</button>}
                <button type="button" className="btn btn-ghost" onClick={() => setZoomFormOpen(false)} disabled={busy === 'zoom-create' || busy === 'zoom-oauth'}>Отмена</button>
              </div>
            </form>
          )}

          <ConnectionShell
            icon={HardDrive}
            color="#34A853"
            title="Google Drive"
            subtitle="Каноническое хранение протоколов, транскриптов и записей"
            status={connections.google_drive?.status || 'disconnected'}
            meta={connections.google_drive?.folder_name || (connections.google_drive?.folder_id ? `Папка ${connections.google_drive.folder_id}` : 'Папка не выбрана')}
            actions={<>{connections.google_drive?.folder_url && <a className="btn btn-secondary btn-sm" href={connections.google_drive.folder_url} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Открыть</a>}<button className="btn btn-secondary btn-sm" onClick={testDrive} disabled={busy === 'drive-test'}>Проверить</button></>}
          />
          <div className="drive-folder-editor"><input className="form-input" value={driveFolder} onChange={(event) => setDriveFolder(event.target.value)} placeholder="ID папки или ссылка Google Drive" /><button className="btn btn-primary" onClick={saveDriveFolder} disabled={!driveFolder.trim() || busy === 'drive-save'}><Save size={14} /> Сохранить папку</button></div>

          <ConnectionShell
            icon={Bot}
            color="#229ED9"
            title="Telegram"
            subtitle="Уведомления и команды бота"
            status={connections.telegram?.status || 'disconnected'}
            meta={connections.telegram?.bot_username || 'Telegram ещё не привязан к организации'}
            actions={connections.telegram?.status === 'active' && connections.telegram?.bot_url
              ? <a className="btn btn-secondary btn-sm" href={connections.telegram.bot_url} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Открыть бота</a>
              : <button className="btn btn-secondary btn-sm" onClick={connectTelegram} disabled={busy === 'telegram-connect'}>{busy === 'telegram-connect' ? <Loader2 size={14} className="spinning" /> : <Bot size={14} />} Подключить Telegram</button>}
          />
        </div>
      </div>

      <div className="card settings-section">
        <div className="card-header"><h3 className="card-title"><Key size={17} /> API-ключи</h3><span className="badge badge-info">{apiKeys.filter((key) => key.is_active !== false).length}</span></div>
        {createdKey && <div className="created-key"><AlertCircle size={17} /><div><strong>Скопируйте ключ сейчас — повторно он не показывается.</strong><code>{createdKey}</code></div><button className="btn btn-primary btn-sm" onClick={() => navigator.clipboard.writeText(createdKey)}><Copy size={14} /> Копировать</button></div>}
        <div className="api-key-create"><input className="form-input" value={newKeyName} onChange={(event) => setNewKeyName(event.target.value)} placeholder="Название ключа" /><button className="btn btn-primary" onClick={createApiKey} disabled={!newKeyName.trim() || busy === 'key-create'}><Plus size={15} /> Создать</button></div>
        <div className="api-key-list">
          {apiKeys.map((key) => <div key={key.id}><div><strong>{key.name}</strong><span><code>{key.key_prefix || key.prefix}…</code> · {key.is_active === false ? 'отозван' : 'активен'}</span></div>{key.is_active !== false && <button className="btn btn-ghost btn-sm danger" onClick={() => revokeApiKey(key)} disabled={busy === `key-${key.id}`}><Trash2 size={14} /> Отозвать</button>}</div>)}
        </div>
      </div>
    </div>
  );
}
