import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import api from '../api';

const STEPS = [
  { key: 'verify_email', title: 'Подтвердите email', icon: '📧', desc: 'Мы отправили код подтверждения на ваш email' },
  { key: 'connect_video', title: 'Подключите Zoom', icon: '🎥', desc: 'Подключите Zoom для автоматической записи и анализа' },
  { key: 'test_video', title: 'Тест видео', icon: '✅', desc: 'Проверяем подключение к Zoom' },
  { key: 'connect_storage', title: 'Подключите хранилище', icon: '💾', desc: 'Яндекс Диск или Google Drive для сохранения результатов' },
  { key: 'test_storage', title: 'Тест хранилища', icon: '✅', desc: 'Проверяем доступ к хранилищу' },
  { key: 'first_meeting', title: 'Первая встреча', icon: '🎉', desc: 'Запланируйте или проведите первую встречу' },
];

export default function OnboardingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [verifyCode, setVerifyCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    setLoading(true);
    try {
      const data = await api.getOnboardingProgress();
      setProgress(data);

      // Find first incomplete step
      if (data.steps) {
        const idx = data.steps.findIndex((s) => s.status !== 'completed' && s.status !== 'skipped');
        setCurrentStep(idx >= 0 ? idx : data.steps.length - 1);
      }

      // If onboarding complete, go to dashboard
      if (data.status === 'completed') {
        navigate('/dashboard');
      }
    } catch (err) {
      if (err.status === 404) {
        // No onboarding initialized — start it
        try {
          await api.startOnboarding();
          await loadProgress();
        } catch {
          // ignore
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    setActionLoading(true);
    setError('');
    try {
      await api.verifyEmail();
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmCode = async () => {
    const code = verifyCode.join('');
    if (code.length !== 6) return;
    setActionLoading(true);
    setError('');
    try {
      await api.confirmEmail(code);
      await loadProgress();
    } catch (err) {
      setError(err.message || 'Неверный код');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCodeInput = (idx, value) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;
    const newCode = [...verifyCode];
    newCode[idx] = value;
    setVerifyCode(newCode);
    // Auto-focus next
    if (value && idx < 5) {
      document.getElementById(`code-${idx + 1}`)?.focus();
    }
    // Auto-submit
    if (idx === 5 && value) {
      const full = newCode.join('');
      if (full.length === 6) {
        setTimeout(() => handleConfirmCode(), 100);
      }
    }
  };

  const handleConnectZoom = () => {
    const orgId = user?.organization_id;
    if (orgId) {
      window.location.href = api.getZoomAuthUrl(orgId);
    }
  };

  const handleConnectYandex = () => {
    const orgId = user?.organization_id;
    if (orgId) {
      window.location.href = api.getYandexAuthUrl(orgId);
    }
  };

  const handleTestConnection = async (type) => {
    setActionLoading(true);
    setError('');
    try {
      await api.testConnection(type);
      await loadProgress();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSkip = async (stepName) => {
    setActionLoading(true);
    try {
      await api.skipStep(stepName);
      await loadProgress();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async (stepName) => {
    setActionLoading(true);
    try {
      await api.completeStep(stepName);
      await loadProgress();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="onboarding-page">
        <div style={{ textAlign: 'center' }}>
          <div className="spinner spinner-lg" style={{ margin: '0 auto' }} />
          <p style={{ marginTop: 16, color: 'var(--color-text-secondary)' }}>Загрузка...</p>
        </div>
      </div>
    );
  }

  const steps = progress?.steps || [];
  const step = STEPS[currentStep] || STEPS[0];

  const renderStepContent = () => {
    switch (step?.key) {
      case 'verify_email':
        return (
          <>
            <p className="onboarding-step-desc">{step.desc}</p>
            <button className="btn btn-secondary" onClick={handleVerifyEmail} disabled={actionLoading} style={{ marginBottom: 24 }}>
              {actionLoading ? <span className="spinner" /> : '📧'} Отправить код повторно
            </button>
            <div className="code-input-group">
              {verifyCode.map((digit, idx) => (
                <input
                  key={idx}
                  id={`code-${idx}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeInput(idx, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !digit && idx > 0) {
                      document.getElementById(`code-${idx - 1}`)?.focus();
                    }
                  }}
                />
              ))}
            </div>
            <div className="onboarding-actions">
              <button className="btn btn-primary btn-lg" onClick={handleConfirmCode} disabled={actionLoading || verifyCode.join('').length < 6}>
                Подтвердить
              </button>
            </div>
          </>
        );

      case 'connect_video':
        return (
          <>
            <p className="onboarding-step-desc">{step.desc}</p>
            <div className="connection-card" style={{ marginBottom: 16 }}>
              <div className="connection-icon" style={{ background: 'rgba(59,130,246,0.15)' }}>🔵</div>
              <div className="connection-info">
                <div className="connection-name">Zoom</div>
                <div className="connection-desc">Автоматическая запись и транскрипция</div>
              </div>
              <button className="btn btn-primary" onClick={handleConnectZoom}>
                Подключить
              </button>
            </div>
            <div className="onboarding-actions">
              <button className="btn btn-ghost" onClick={() => handleSkip('connect_video')}>
                Пропустить
              </button>
            </div>
          </>
        );

      case 'test_video':
        return (
          <>
            <p className="onboarding-step-desc">{step.desc}</p>
            <div className="onboarding-actions">
              <button className="btn btn-primary btn-lg" onClick={() => handleTestConnection('video')} disabled={actionLoading}>
                {actionLoading ? <span className="spinner" /> : '🧪'} Тестировать подключение
              </button>
              <button className="btn btn-ghost" onClick={() => handleSkip('test_video')}>
                Пропустить
              </button>
            </div>
          </>
        );

      case 'connect_storage':
        return (
          <>
            <p className="onboarding-step-desc">{step.desc}</p>
            <div className="connection-card" style={{ marginBottom: 12 }}>
              <div className="connection-icon" style={{ background: 'rgba(245,158,11,0.15)' }}>🟡</div>
              <div className="connection-info">
                <div className="connection-name">Яндекс Диск</div>
                <div className="connection-desc">Облачное хранилище для результатов анализа</div>
              </div>
              <button className="btn btn-primary" onClick={handleConnectYandex}>
                Подключить
              </button>
            </div>
            <div className="onboarding-actions">
              <button className="btn btn-ghost" onClick={() => handleSkip('connect_storage')}>
                Пропустить
              </button>
            </div>
          </>
        );

      case 'test_storage':
        return (
          <>
            <p className="onboarding-step-desc">{step.desc}</p>
            <div className="onboarding-actions">
              <button className="btn btn-primary btn-lg" onClick={() => handleTestConnection('storage')} disabled={actionLoading}>
                {actionLoading ? <span className="spinner" /> : '🧪'} Тестировать хранилище
              </button>
              <button className="btn btn-ghost" onClick={() => handleSkip('test_storage')}>
                Пропустить
              </button>
            </div>
          </>
        );

      case 'first_meeting':
        return (
          <>
            <p className="onboarding-step-desc">Всё готово! Проведите первую встречу в Zoom — AxioMeet автоматически обработает запись.</p>
            <div className="onboarding-actions">
              <button className="btn btn-primary btn-lg" onClick={() => handleComplete('first_meeting')}>
                🎉 Перейти в Dashboard
              </button>
              <button className="btn btn-ghost" onClick={() => handleSkip('first_meeting')}>
                Пропустить
              </button>
            </div>
          </>
        );

      default:
        return <p>Шаг не найден</p>;
    }
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-container">
        {/* Progress dots */}
        <div className="onboarding-progress">
          {STEPS.map((s, idx) => {
            const stepData = steps.find((st) => st.step_name === s.key);
            const isCompleted = stepData?.status === 'completed' || stepData?.status === 'skipped';
            const isActive = idx === currentStep;
            return (
              <div key={s.key} style={{ display: 'flex', alignItems: 'center', flex: idx < STEPS.length - 1 ? 1 : 'none', gap: 4 }}>
                <div
                  className={`onboarding-step-dot ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                  title={s.title}
                />
                {idx < STEPS.length - 1 && (
                  <div className={`onboarding-step-connector ${isCompleted ? 'completed' : ''}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step card */}
        <div className="onboarding-card">
          <div style={{ fontSize: 40, marginBottom: 16 }}>{step.icon}</div>
          <h2 className="onboarding-step-title">{step.title}</h2>
          {error && <div className="form-error" style={{ marginBottom: 16 }}>⚠️ {error}</div>}
          {renderStepContent()}
        </div>

        {/* Step counter */}
        <div style={{ textAlign: 'center', marginTop: 16, color: 'var(--color-text-muted)', fontSize: 'var(--font-sm)' }}>
          Шаг {currentStep + 1} из {STEPS.length}
        </div>
      </div>
    </div>
  );
}
