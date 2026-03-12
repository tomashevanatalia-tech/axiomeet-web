import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';

const ROLES = [
  { value: 'admin', label: 'Администратор', color: 'badge-error' },
  { value: 'manager', label: 'Менеджер', color: 'badge-warning' },
  { value: 'member', label: 'Участник', color: 'badge-info' },
  { value: 'viewer', label: 'Наблюдатель', color: 'badge-primary' },
];

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'member' });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMsg, setInviteMsg] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      const data = await api.get('/api/v1/admin/users');
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteLoading(true);
    setInviteMsg('');
    try {
      await api.post('/api/v1/admin/users/invite', inviteForm);
      setInviteMsg('✅ Приглашение отправлено');
      setInviteForm({ email: '', role: 'member' });
      setShowInvite(false);
      await loadUsers();
    } catch (err) {
      setInviteMsg(`⚠️ ${err.message}`);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/api/v1/admin/users/${userId}/role`, { role: newRole });
      setUsers(users.map((u) => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeactivate = async (userId) => {
    if (!window.confirm('Деактивировать пользователя?')) return;
    try {
      await api.put(`/api/v1/admin/users/${userId}/deactivate`);
      await loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const filtered = users.filter((u) =>
    !search ||
    (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.name || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Пользователи"
        subtitle="Управление доступом и ролями"
        breadcrumbs={[{ label: 'Управление', href: '#' }, { label: 'Пользователи' }]}
      >
        <button className="btn btn-primary" onClick={() => setShowInvite(!showInvite)}>
          ➕ Пригласить
        </button>
      </PageHeader>

      {/* Invite modal */}
      {showInvite && (
        <div className="card" style={{ marginBottom: 24, borderColor: 'var(--color-primary-500)' }}>
          <h3 className="card-title" style={{ marginBottom: 16 }}>Пригласить пользователя</h3>
          <form onSubmit={handleInvite} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: 1, minWidth: 200, margin: 0 }}>
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                placeholder="colleague@company.com"
                required
              />
            </div>
            <div className="form-group" style={{ minWidth: 160, margin: 0 }}>
              <label className="form-label">Роль</label>
              <select
                className="form-input"
                value={inviteForm.role}
                onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary" disabled={inviteLoading}>
              {inviteLoading ? <span className="spinner" /> : 'Отправить'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setShowInvite(false)}>
              Отмена
            </button>
          </form>
          {inviteMsg && <p style={{ marginTop: 8, fontSize: 'var(--font-sm)' }}>{inviteMsg}</p>}
        </div>
      )}

      {/* Search bar */}
      <div style={{ marginBottom: 16 }}>
        <input
          className="form-input"
          type="text"
          placeholder="🔍 Поиск по имени или email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 400 }}
        />
      </div>

      {error && <div className="form-error" style={{ marginBottom: 16 }}>⚠️ {error}</div>}

      {/* Users table */}
      <div className="card">
        {filtered.length === 0 ? (
          <EmptyState icon="👥" title="Нет пользователей" description="Пригласите коллег для совместной работы" />
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Пользователь</th>
                  <th>Email</th>
                  <th>Роль</th>
                  <th>Статус</th>
                  <th>Последний вход</th>
                  <th style={{ width: 100 }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const initials = (u.name || u.email || '??')
                    .split(/[\s@]/)
                    .map((w) => w[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);
                  const roleInfo = ROLES.find((r) => r.value === u.role) || ROLES[2];
                  const isCurrentUser = u.id === user?.id;

                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: 'var(--radius-full)',
                            background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-400))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 'var(--font-xs)', fontWeight: 600,
                          }}>{initials}</div>
                          <span style={{ fontWeight: 500 }}>
                            {u.name || '—'}
                            {isCurrentUser && <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-xs)', marginLeft: 6 }}>(вы)</span>}
                          </span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--color-text-secondary)' }}>{u.email}</td>
                      <td>
                        {isCurrentUser ? (
                          <span className={`badge ${roleInfo.color}`}>{roleInfo.label}</span>
                        ) : (
                          <select
                            className="form-input"
                            style={{ padding: '2px 8px', fontSize: 'var(--font-xs)', width: 'auto' }}
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          >
                            {ROLES.map((r) => (
                              <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${u.is_active !== false ? 'badge-success' : 'badge-error'}`}>
                          {u.is_active !== false ? 'Активен' : 'Деактивирован'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-xs)' }}>
                        {u.last_login ? new Date(u.last_login).toLocaleDateString('ru-RU') : '—'}
                      </td>
                      <td>
                        {!isCurrentUser && u.is_active !== false && (
                          <button className="btn btn-ghost btn-sm" onClick={() => handleDeactivate(u.id)} title="Деактивировать">
                            🚫
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stats footer */}
      <div style={{ marginTop: 16, display: 'flex', gap: 24, color: 'var(--color-text-muted)', fontSize: 'var(--font-sm)' }}>
        <span>Всего: {users.length}</span>
        <span>Активных: {users.filter((u) => u.is_active !== false).length}</span>
        <span>Админов: {users.filter((u) => u.role === 'admin').length}</span>
      </div>
    </div>
  );
}
