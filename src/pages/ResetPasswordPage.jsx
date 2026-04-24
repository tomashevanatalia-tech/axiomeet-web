import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useLang } from '../LangContext';
import api from '../api';
import AuthShell from '../components/AuthShell';

export default function ResetPasswordPage() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState('idle'); // idle | submitting | done
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) setError(t('auth.reset.error.notoken'));
  }, [token, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError(t('auth.reset.error.notoken'));
      return;
    }
    if (password.length < 8) {
      setError(t('auth.reset.error.short'));
      return;
    }
    if (password !== confirm) {
      setError(t('auth.reset.error.mismatch'));
      return;
    }

    setStatus('submitting');
    try {
      await api.resetPassword(token, password);
      setStatus('done');
      setTimeout(() => navigate('/login', { replace: true }), 2500);
    } catch (err) {
      setError(err.message || t('auth.reset.error.default'));
      setStatus('idle');
    }
  };

  return (
    <AuthShell
      title={t('auth.reset.title')}
      subtitle={t('auth.reset.subtitle')}
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
          {t('auth.reset.success')}
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="reset-password">
              {t('auth.reset.new')}
            </label>
            <input
              id="reset-password"
              className="form-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.register.password.placeholder')}
              required
              minLength={8}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reset-confirm">
              {t('auth.reset.confirm')}
            </label>
            <input
              id="reset-confirm"
              className="form-input"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={t('auth.register.password.placeholder')}
              required
              minLength={8}
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
            disabled={status === 'submitting' || !token}
          >
            {status === 'submitting' ? <span className="spinner" /> : null}
            {status === 'submitting' ? t('auth.reset.submitting') : t('auth.reset.submit')}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
