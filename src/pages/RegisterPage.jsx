import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useLang, LangSwitcher } from '../LangContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const { lang, t } = useLang();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedPlan = searchParams.get('plan');
  const selectedPlan = ['trial', 'starter', 'business'].includes(requestedPlan) ? requestedPlan : 'trial';
  const source = (searchParams.get('source') || 'direct').slice(0, 100);
  const [form, setForm] = useState({
    email: '',
    password: '',
    display_name: '',
    organization_name: '',
    personal_data_consent: false,
    terms_accepted: false,
    selected_plan: selectedPlan,
    source,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const toggle = (field) => (e) => setForm({ ...form, [field]: e.target.checked });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) {
      setError(t('auth.register.password.short'));
      return;
    }
    setLoading(true);
    try {
      await register(form);
      localStorage.setItem('axiomeet_selected_plan', selectedPlan);
      navigate('/onboarding');
    } catch (err) {
      setError(err.message || t('auth.register.error.default'));
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
            <span className="brand-wordmark">{lang === 'ru' ? 'Аксиомит (AxioMeet)' : 'AxioMeet'}</span>
          </div>
          <h1>{t('auth.register.title')}</h1>
          <p>{t('auth.register.subtitle')}</p>
        </div>

        <div className="auth-card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-name">{t('auth.register.name')}</label>
              <input
                id="reg-name"
                className="form-input"
                type="text"
                value={form.display_name}
                onChange={update('display_name')}
                placeholder={t('auth.register.name.placeholder')}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-org">{t('auth.register.org')}</label>
              <input
                id="reg-org"
                className="form-input"
                type="text"
                value={form.organization_name}
                onChange={update('organization_name')}
                placeholder={t('auth.register.org.placeholder')}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">{t('auth.email')}</label>
              <input
                id="reg-email"
                className="form-input"
                type="email"
                value={form.email}
                onChange={update('email')}
                placeholder={t('auth.register.email.placeholder')}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">{t('auth.password')}</label>
              <input
                id="reg-password"
                className="form-input"
                type="password"
                value={form.password}
                onChange={update('password')}
                placeholder={t('auth.register.password.placeholder')}
                required
                minLength={8}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 13, lineHeight: 1.45, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.personal_data_consent}
                  onChange={toggle('personal_data_consent')}
                  required
                  style={{ marginTop: 3 }}
                />
                <span>
                  {t('auth.register.pd.prefix')}{' '}
                  <a href="https://axiomeet.ru/consent" target="_blank" rel="noopener noreferrer">{t('auth.register.pd.consent')}</a>{' '}
                  {t('auth.register.pd.and')}{' '}
                  <a href="https://axiomeet.ru/privacy" target="_blank" rel="noopener noreferrer">{t('auth.register.pd.policy')}</a>.
                </span>
              </label>
            </div>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 13, lineHeight: 1.45, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.terms_accepted}
                  onChange={toggle('terms_accepted')}
                  required
                  style={{ marginTop: 3 }}
                />
                <span>
                  {t('auth.register.terms.prefix')}{' '}
                  <a href="https://axiomeet.ru/oferta" target="_blank" rel="noopener noreferrer">{t('auth.register.terms.offer')}</a>{' '}
                  {t('auth.register.terms.and')}{' '}
                  <a href="https://axiomeet.ru/terms" target="_blank" rel="noopener noreferrer">{t('auth.register.terms.rules')}</a>.
                </span>
              </label>
            </div>

            {error && <div className="form-error" style={{ marginBottom: 16 }}>⚠️ {error}</div>}

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? <span className="spinner" /> : null}
              {loading ? t('auth.register.submitting') : t('auth.register.submit')}
            </button>

            <div className="form-hint" style={{ textAlign: 'center', marginTop: 12 }}>
              {t('auth.register.hint')}
            </div>
          </form>
        </div>

        <div className="auth-footer">
          {t('auth.register.footer')} <Link to="/login">{t('auth.register.footer.link')}</Link>
        </div>
      </div>
    </div>
  );
}
