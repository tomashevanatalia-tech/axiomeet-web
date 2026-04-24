import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useLang, LangSwitcher } from '../LangContext';

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || t('auth.login.error.default'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <LangSwitcher />
        </div>
        <div className="auth-header">
          <div className="auth-logo">
            <span className="brand-wordmark">AxioMeet</span>
          </div>
          <h1>{t('auth.login.title')}</h1>
          <p>{t('auth.login.subtitle')}</p>
        </div>

        <div className="auth-card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">{t('auth.email')}</label>
              <input
                id="login-email"
                className="form-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                <label className="form-label" htmlFor="login-password" style={{ marginBottom: 0 }}>
                  {t('auth.password')}
                </label>
                <Link
                  to="/forgot-password"
                  style={{
                    fontSize: 'var(--font-xs)',
                    fontWeight: 600,
                    color: 'var(--brand-navy)',
                  }}
                >
                  {t('auth.login.forgot')}
                </Link>
              </div>
              <input
                id="login-password"
                className="form-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.password.placeholder')}
                required
              />
            </div>

            {error && <div className="form-error" style={{ marginBottom: 16 }}>⚠️ {error}</div>}

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? <span className="spinner" /> : null}
              {loading ? t('auth.login.submitting') : t('auth.login.submit')}
            </button>
          </form>
        </div>

        <div className="auth-footer">
          {t('auth.login.footer')} <Link to="/register">{t('auth.login.footer.link')}</Link>
        </div>
      </div>
    </div>
  );
}
