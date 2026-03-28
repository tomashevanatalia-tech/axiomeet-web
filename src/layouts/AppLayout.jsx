import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import CommandPalette from '../components/CommandPalette';
import {
  LayoutDashboard, Rocket, Mic, Wallet, Monitor, Users, CreditCard,
  BarChart3, Settings, LogOut, Search, Bell, ChevronRight,
} from 'lucide-react';

const NAV_ITEMS = {
  main: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/meetings', icon: Mic, label: 'Встречи' },
    { to: '/billing', icon: Wallet, label: 'Биллинг' },
    { to: '/onboarding', icon: Rocket, label: 'Onboarding' },
  ],
  admin: [
    { to: '/admin/platform', icon: Monitor, label: 'Platform' },
    { to: '/admin/users', icon: Users, label: 'Пользователи' },
    { to: '/admin/billing', icon: CreditCard, label: 'Тарифы' },
    { to: '/admin/analytics', icon: BarChart3, label: 'Аналитика' },
    { to: '/admin/settings', icon: Settings, label: 'Настройки' },
  ],
};

const BREADCRUMB_MAP = {
  '/dashboard': [{ label: 'Dashboard' }],
  '/meetings': [{ label: 'Основное' }, { label: 'Встречи' }],
  '/billing': [{ label: 'Основное' }, { label: 'Биллинг' }],
  '/onboarding': [{ label: 'Основное' }, { label: 'Onboarding' }],
  '/admin/platform': [{ label: 'Управление' }, { label: 'Platform' }],
  '/admin/users': [{ label: 'Управление' }, { label: 'Пользователи' }],
  '/admin/billing': [{ label: 'Управление' }, { label: 'Тарифы' }],
  '/admin/analytics': [{ label: 'Управление' }, { label: 'Аналитика' }],
  '/admin/settings': [{ label: 'Управление' }, { label: 'Настройки' }],
};

function SidebarNavItem({ to, icon: Icon, label }) {
  return (
    <NavLink to={to} className={({ isActive }) => isActive ? 'active' : ''}>
      <span className="nav-icon"><Icon size={18} strokeWidth={1.8} /></span>
      {label}
    </NavLink>
  );
}

function SidebarSearch() {
  const openSearch = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
  };
  return (
    <div className="sidebar-search" onClick={openSearch} role="button" tabIndex={0}>
      <Search size={14} />
      <span>Поиск...</span>
      <kbd>⌘K</kbd>
    </div>
  );
}

function TopBar() {
  const location = useLocation();
  const crumbs = BREADCRUMB_MAP[location.pathname] || [];

  return (
    <div className="app-top-bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {crumbs.map((c, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {i > 0 && <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />}
            <span style={{
              fontSize: 'var(--font-sm)',
              fontWeight: i === crumbs.length - 1 ? 600 : 400,
              color: i === crumbs.length - 1 ? 'var(--text-primary)' : 'var(--text-muted)',
            }}>
              {c.label}
            </span>
          </span>
        ))}
      </div>
      <div className="top-bar-actions">
        <button className="notification-btn" title="Уведомления">
          <Bell size={18} />
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
      <CommandPalette />

      {/* Sidebar */}
      <aside className="app-sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">🎙️</div>
          <span className="logo-text">AxioMeet</span>
        </div>

        <SidebarSearch />

        <div className="sidebar-section-label">Основное</div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.main.map((item) => (
            <SidebarNavItem key={item.to} {...item} />
          ))}
        </nav>

        {user?.role === 'admin' && (
          <>
            <div className="sidebar-section-label">Управление</div>
            <nav className="sidebar-nav">
              {NAV_ITEMS.admin.map((item) => (
                <SidebarNavItem key={item.to} {...item} />
              ))}
            </nav>
          </>
        )}

        <div style={{ flex: 1 }} />

        <nav className="sidebar-nav" style={{ marginBottom: 8 }}>
          <button onClick={handleLogout}>
            <span className="nav-icon"><LogOut size={18} strokeWidth={1.8} /></span>
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
