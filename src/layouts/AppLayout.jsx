import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="app-sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">🎙️</div>
          <span className="logo-text">AxioMeet</span>
        </div>

        <div className="sidebar-section-label">Навигация</div>
        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
            <span className="nav-icon">📊</span>
            Dashboard
          </NavLink>
          <NavLink to="/onboarding" className={({ isActive }) => isActive ? 'active' : ''}>
            <span className="nav-icon">🚀</span>
            Onboarding
          </NavLink>
        </nav>

        <div className="sidebar-section-label">Аккаунт</div>
        <nav className="sidebar-nav">
          <button onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            Выйти
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <div className="user-name">{user?.name || 'User'}</div>
              <div className="user-email">{user?.email || ''}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
