import { LangSwitcher, useLang } from '../LangContext';

/**
 * Shared chrome for auth pages (login / register / forgot / reset).
 * Renders the brand wordmark + hero background and wraps children in the
 * `.auth-card` surface so individual pages stay focused on their form.
 */
export default function AuthShell({ title, subtitle, children, footer }) {
  const { lang } = useLang();

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <LangSwitcher />
        </div>
        <div className="auth-header">
          <div className="auth-logo">
            <span className="brand-wordmark">{lang === 'ru' ? 'Аксиомит (AxioMeet)' : 'AxioMeet'}</span>
          </div>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>

        <div className="auth-card">{children}</div>

        {footer && <div className="auth-footer">{footer}</div>}
      </div>
    </div>
  );
}
