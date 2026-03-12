import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const COMMANDS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊', path: '/dashboard', keywords: 'главная обзор' },
  { id: 'onboarding', label: 'Onboarding', icon: '🚀', path: '/onboarding', keywords: 'начало шаги' },
  { id: 'users', label: 'Пользователи', icon: '👥', path: '/admin/users', keywords: 'команда team invite' },
  { id: 'billing', label: 'Тарифы и Биллинг', icon: '💳', path: '/admin/billing', keywords: 'план оплата pricing' },
  { id: 'analytics', label: 'Аналитика', icon: '📈', path: '/admin/analytics', keywords: 'метрики данные usage' },
  { id: 'settings', label: 'Настройки', icon: '⚙️', path: '/admin/settings', keywords: 'конфиг org api keys' },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
        setQuery('');
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const filtered = COMMANDS.filter((cmd) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      cmd.label.toLowerCase().includes(q) ||
      cmd.keywords.toLowerCase().includes(q) ||
      cmd.path.toLowerCase().includes(q)
    );
  });

  const handleSelect = (cmd) => {
    navigate(cmd.path);
    setOpen(false);
    setQuery('');
  };

  if (!open) return null;

  return (
    <div className="command-palette-overlay" onClick={() => setOpen(false)}>
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>
        <div className="command-palette-input-wrap">
          <span style={{ color: 'var(--color-text-muted)', fontSize: 18 }}>🔍</span>
          <input
            ref={inputRef}
            className="command-palette-input"
            type="text"
            placeholder="Поиск страниц и команд..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && filtered.length > 0) {
                handleSelect(filtered[0]);
              }
            }}
          />
          <kbd className="command-palette-kbd">Esc</kbd>
        </div>
        <div className="command-palette-list">
          {filtered.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-muted)' }}>
              Ничего не найдено
            </div>
          ) : (
            filtered.map((cmd) => (
              <button
                key={cmd.id}
                className="command-palette-item"
                onClick={() => handleSelect(cmd)}
              >
                <span style={{ fontSize: 18, width: 24 }}>{cmd.icon}</span>
                <span>{cmd.label}</span>
                <span style={{ marginLeft: 'auto', color: 'var(--color-text-muted)', fontSize: 'var(--font-xs)' }}>
                  {cmd.path}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
