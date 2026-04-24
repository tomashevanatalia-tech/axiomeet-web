import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../LangContext';
import api from '../api';
import AuthShell from '../components/AuthShell';

export default function ForgotPasswordPage() {
  const { t } = useLang();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | submitting | done
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setStatus('submitting');
    try {
      await api.forgotPassword(email);
      setStatus('done');
    } catch (err) {
      setError(err.message || t('auth.forgot.error.default'));
      setStatus('idle');
    }
  };

  return (
    <AuthShell
      title={t('auth.forgot.title')}
      subtitle={t('auth.forgot.subtitle')}
      footer={<Link to="/login">{t('auth.forgot.back')}</Link>}
    >
      {status === 'done' ? (
        <div
          style={{
            background: 'var(--success-bg)',
            color: 'var(--success-text)',
            padding: '14px 16px',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-sm)',
            lineHeight: 1.55,
          }}
        >
          {t('auth.forgot.success')}
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="forgot-email">
              {t('auth.email')}
            </label>
            <input
              id="forgot-email"
              className="form-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoFocus
            />
          </div>

          {error && (
            <div className="form-error" style={{ marginBottom: 16 }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%' }}
            disabled={status === 'submitting'}
          >
            {status === 'submitting' ? <span className="spinner" /> : null}
            {status === 'submitting' ? t('auth.forgot.submitting') : t('auth.forgot.submit')}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
