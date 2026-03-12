import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    organization_name: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) {
      setError('Пароль должен содержать минимум 8 символов');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      navigate('/onboarding');
    } catch (err) {
      setError(err.message || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">🚀</div>
          <h1>Создайте аккаунт</h1>
          <p>Начните анализировать встречи с AxioMeet</p>
        </div>

        <div className="auth-card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-name">Ваше имя</label>
              <input
                id="reg-name"
                className="form-input"
                type="text"
                value={form.name}
                onChange={update('name')}
                placeholder="Иван Петров"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-org">Название компании</label>
              <input
                id="reg-org"
                className="form-input"
                type="text"
                value={form.organization_name}
                onChange={update('organization_name')}
                placeholder="ООО Рога и Копыта"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">Email</label>
              <input
                id="reg-email"
                className="form-input"
                type="email"
                value={form.email}
                onChange={update('email')}
                placeholder="your@company.com"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">Пароль</label>
              <input
                id="reg-password"
                className="form-input"
                type="password"
                value={form.password}
                onChange={update('password')}
                placeholder="Минимум 8 символов"
                required
                minLength={8}
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
              {loading ? 'Создание...' : 'Создать аккаунт'}
            </button>

            <div className="form-hint" style={{ textAlign: 'center', marginTop: 12 }}>
              Бесплатно: 3 часа обработки в месяц
            </div>
          </form>
        </div>

        <div className="auth-footer">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </div>
      </div>
    </div>
  );
}
