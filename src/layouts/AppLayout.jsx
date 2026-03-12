import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import CommandPalette from '../components/CommandPalette';

const NAV_ITEMS = {
  main: [
    { to: '/dashboard', icon: '📊', label: 'Dashboard' },
    { to: '/onboarding', icon: '🚀', label: 'Onboarding' },
  ],
  admin: [
    { to: '/admin/platform', icon: '🖥️', label: 'Platform' },
    { to: '/admin/users', icon: '👥', label: 'Пользователи' },
    { to: '/admin/billing', icon: '💳', label: 'Тарифы и Биллинг' },
    { to: '/admin/analytics', icon: '📈', label: 'Аналитика' },
    { to: '/admin/settings', icon: '⚙️', label: 'Настройки' },
  ],
};

const BREADCRUMB_MAP = {
  '/dashboard': [{ label: 'Dashboard' }],
  '/admin/users': [{ label: 'Управление', href: '#' }, { label: 'Пользователи' }],
  '/admin/billing': [{ label: 'Управление', href: '#' }, { label: 'Тарифы и Биллинг' }],
  '/admin/analytics': [{ label: 'Управление', href: '#' }, { label: 'Аналитика' }],
  '/admin/settings': [{ label: 'Управление', href: '#' }, { label: 'Настройки' }],
};

function SidebarNavItem({ to, icon, label }) {
  return (
    <NavLink to={to} className={({ isActive }) => isActive ? 'active' : ''}>
      <span className="nav-icon">{icon}</span>
      {label}
    </NavLink>
  );
}

function TopBar() {
  const openSearch = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
  };

  return (
    <div className="app-top-bar">
      <div className="top-bar-search" onClick={openSearch} role="button" tabIndex={0}>
        <span>🔍</span>
        <span>Поиск страниц и команд...</span>
        <kbd>Ctrl+K</kbd>
      </div>
      <div className="top-bar-actions">
        <button className="notification-btn" title="Уведомления">
          🔔
          <span className="notification-badge" />
        </button>
      </div>
    </div>
  );
}

function UserInitials({ name }) {
  const initials = name
    ? name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : '??';
  return <div className="user-avatar">{initials}</div>;
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      {/* Command Palette */}
      <CommandPalette />

      {/* Sidebar */}
      <aside className="app-sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">🎙️</div>
          <span className="logo-text">AxioMeet</span>
        </div>

        <div className="sidebar-section-label">Основное</div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.main.map((item) => (
            <SidebarNavItem key={item.to} {...item} />
          ))}
        </nav>

        <div className="sidebar-section-label">Управление</div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.admin.map((item) => (
            <SidebarNavItem key={item.to} {...item} />
          ))}
        </nav>

        <div style={{ flex: 1 }} />

        <nav className="sidebar-nav" style={{ marginBottom: 8 }}>
          <button onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            Выйти
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <UserInitials name={user?.name} />
            <div className="user-info">
              <div className="user-name">{user?.name || 'User'}</div>
              <div className="user-email">{user?.email || ''}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="app-main">
        <TopBar />
        <Outlet context={{ breadcrumbs: BREADCRUMB_MAP[location.pathname] || [] }} />
      </main>
    </div>
  );
}
