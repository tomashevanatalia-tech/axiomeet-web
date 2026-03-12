import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import api from '../api';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const result = await api.getDashboard();
      setData(result);
    } catch (err) {
      setError(err.message);
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

  if (error) {
    return (
      <div className="empty-state">
        <div className="empty-icon">⚠️</div>
        <div className="empty-title">Ошибка загрузки</div>
        <div className="empty-desc">{error}</div>
        <button className="btn btn-primary" onClick={loadDashboard}>Повторить</button>
      </div>
    );
  }

  const usage = data?.usage || {};
  const connections = data?.connections || [];
  const meetings = data?.recent_meetings || [];
  const onboarding = data?.onboarding || {};

  const usagePercent = usage.usage_percent || 0;
  const progressClass = usagePercent > 80 ? 'danger' : usagePercent > 60 ? 'warning' : '';

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">
          Добро пожаловать, {user?.name || 'User'} 👋
        </p>
      </div>

      {/* Stats Grid */}
      <div className="stat-grid" style={{ marginBottom: 32 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)' }}>⏱️</div>
          <div className="stat-value">{usage.hours_used || 0}h</div>
          <div className="stat-label">
            Использовано из {usage.hours_limit > 0 ? `${usage.hours_limit}h` : '∞'}
          </div>
          <div className="progress-bar" style={{ marginTop: 12 }}>
            <div
              className={`progress-bar-fill ${progressClass}`}
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.15)' }}>🔗</div>
          <div className="stat-value">{connections.filter((c) => c.status === 'active').length}</div>
          <div className="stat-label">Активных подключений</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(6,182,212,0.15)' }}>🎤</div>
          <div className="stat-value">{meetings.length}</div>
          <div className="stat-label">Недавних встреч</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)' }}>📋</div>
          <div className="stat-value" style={{ fontSize: 'var(--font-xl)' }}>
            {(usage.plan || 'free').toUpperCase()}
          </div>
          <div className="stat-label">Тарифный план</div>
        </div>
      </div>

      {/* Connections */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h3 className="card-title">Подключения</h3>
        </div>
        {connections.length === 0 ? (
          <div className="empty-state" style={{ padding: '24px 0' }}>
            <div className="empty-icon">🔌</div>
            <div className="empty-title">Нет подключений</div>
            <div className="empty-desc">Подключите Zoom или Яндекс Диск для начала работы</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {connections.map((conn) => (
              <div key={conn.id} className="connection-card">
                <div className="connection-icon" style={{
                  background: conn.provider === 'zoom' ? 'rgba(59,130,246,0.15)' :
                    conn.provider === 'yandex_disk' ? 'rgba(245,158,11,0.15)' :
                    'rgba(99,102,241,0.15)'
                }}>
                  {conn.provider === 'zoom' ? '🔵' : conn.provider === 'yandex_disk' ? '🟡' : '🔗'}
                </div>
                <div className="connection-info">
                  <div className="connection-name">
                    {conn.provider === 'zoom' ? 'Zoom' :
                     conn.provider === 'yandex_disk' ? 'Яндекс Диск' :
                     conn.provider}
                  </div>
                  <div className="connection-desc">{conn.type}</div>
                </div>
                <span className={`badge ${conn.status === 'active' ? 'badge-success' : 'badge-error'}`}>
                  {conn.status === 'active' ? 'Активно' : conn.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Meetings */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Недавние встречи</h3>
        </div>
        {meetings.length === 0 ? (
          <div className="empty-state" style={{ padding: '24px 0' }}>
            <div className="empty-icon">🎤</div>
            <div className="empty-title">Нет встреч</div>
            <div className="empty-desc">После подключения Zoom ваши встречи появятся здесь</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Тема</th>
                  <th>Статус</th>
                  <th>Длительность</th>
                  <th>Дата</th>
                </tr>
              </thead>
              <tbody>
                {meetings.map((m) => (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 500 }}>{m.topic || 'Без темы'}</td>
                    <td>
                      <span className={`badge ${
                        m.status === 'COMPLETED' ? 'badge-success' :
                        m.status === 'PROCESSING' ? 'badge-warning' :
                        m.status === 'ERROR' ? 'badge-error' :
                        'badge-info'
                      }`}>
                        {m.status || m.state || '—'}
                      </span>
                    </td>
                    <td>
                      {m.duration_seconds
                        ? `${Math.round(m.duration_seconds / 60)} мин`
                        : '—'}
                    </td>
                    <td style={{ color: 'var(--color-text-muted)' }}>
                      {m.created_at ? new Date(m.created_at).toLocaleDateString('ru-RU') : '—'}
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
