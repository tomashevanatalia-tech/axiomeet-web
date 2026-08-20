import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import api from '../api';
import {
  AlertCircle, BarChart3, Brain, CheckCircle2, ClipboardList,
  FileText, Gauge, Loader2, Mail, MessageSquare, PartyPopper,
  Play, Users as UsersIcon, Video,
} from 'lucide-react';

const STEPS = [
  { key: 'verify_email', title: 'Подтвердите email', icon: Mail, desc: 'Защитим аккаунт и отправим результаты на верный адрес' },
  { key: 'connect_zoom', title: 'Подключите Zoom', icon: Video, desc: 'По реквизитам Server-to-Server OAuth из Zoom Marketplace' },
  { key: 'choose_template', title: 'Выберите шаблон', icon: FileText, desc: 'Настройте структуру будущих протоколов' },
  { key: 'first_result', title: 'Получите первый результат', icon: PartyPopper, desc: 'Обработаем демо-запись прямо сейчас' },
];

const TEMPLATES = [
  { id: 'standard', name: 'Стандартный', icon: ClipboardList, desc: 'Повестка, решения, задачи', color: '#6366f1' },
  { id: 'sales_call', name: 'Продажи', icon: BarChart3, desc: 'Квалификация, возражения, next steps', color: '#10b981' },
  { id: 'interview', name: 'Собеседование', icon: UsersIcon, desc: 'Компетенции и рекомендации', color: '#f59e0b' },
  { id: 'one_on_one', name: '1-on-1', icon: MessageSquare, desc: 'Результаты, блокеры, обратная связь', color: '#06b6d4' },
  { id: 'standup', name: 'Стендап', icon: Gauge, desc: 'Сделано, планы, блокеры', color: '#ec4899' },
  { id: 'brainstorm', name: 'Мозговой штурм', icon: Brain, desc: 'Идеи и приоритеты', color: '#8b5cf6' },
];

const SUCCESS_STATES = new Set(['PUBLISHED']);
const FAILURE_STATES = new Set(['FAILED', 'ERROR', 'DEAD_LETTER']);

function TemplateCard({ template, selected, onSelect }) {
  const Icon = template.icon;
  return (
    <button
      type="button"
      onClick={() => onSelect(template.id)}
      style={{
        padding: 16,
        borderRadius: 'var(--radius-lg)',
        border: selected ? `2px solid ${template.color}` : '1px solid var(--border-color)',
        background: selected ? `${template.color}08` : 'var(--bg-card)',
        cursor: 'pointer',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
      }}
    >
      <span style={{
        width: 36, height: 36, borderRadius: 'var(--radius-md)',
        background: `${template.color}15`, color: template.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={18} />
      </span>
      <span>
        <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', gap: 6, alignItems: 'center' }}>
          {template.name} {selected && <CheckCircle2 size={14} />}
        </span>
        <span style={{ display: 'block', fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginTop: 3 }}>
          {template.desc}
        </span>
      </span>
    </button>
  );
}

export default function OnboardingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(
    () => localStorage.getItem('axiomeet_protocol_template') || 'standard',
  );
  const [demoUuid, setDemoUuid] = useState('');
  const [demoState, setDemoState] = useState('');

  const refreshDemo = useCallback(async (uuid) => {
    if (!uuid) return;
    const data = await api.getMeetings(50);
    const meeting = (data.meetings || []).find((item) => item.uuid === uuid);
    if (meeting) setDemoState(meeting.state || meeting.status || 'RECEIVED');
  }, []);

  const loadInitialState = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let progress;
      try {
        progress = await api.getOnboardingProgress();
      } catch (err) {
        if (err.status !== 404) throw err;
        await api.startOnboarding();
        progress = await api.getOnboardingProgress();
      }

      const [connectionsData, meetingsData] = await Promise.all([
        api.getConnections().catch(() => ({ connections: [] })),
        api.getMeetings(50).catch(() => ({ meetings: [] })),
      ]);

      const verified = (progress.steps || []).some(
        (item) => item.step_name === 'verify_email' && item.status === 'completed',
      );
      const zoomConnected = (connectionsData.connections || []).some(
        (item) => item.provider === 'zoom' && item.status === 'active',
      );
      const zoomDeferred = localStorage.getItem('axiomeet_zoom_deferred') === 'true';
      const templateChosen = Boolean(localStorage.getItem('axiomeet_protocol_template'));
      const demo = (meetingsData.meetings || []).find((item) => item.uuid?.startsWith('demo-'));

      if (demo) {
        setDemoUuid(demo.uuid);
        setDemoState(demo.state || demo.status || 'RECEIVED');
      }

      if (!verified) setCurrentStep(0);
      else if (!zoomConnected && !zoomDeferred) setCurrentStep(1);
      else if (!templateChosen) setCurrentStep(2);
      else setCurrentStep(3);
    } catch (err) {
      setError(err.message || 'Не удалось загрузить настройку аккаунта');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadInitialState(); }, [loadInitialState]);

  useEffect(() => {
    if (!demoUuid || SUCCESS_STATES.has(demoState) || FAILURE_STATES.has(demoState)) return undefined;
    const poll = window.setInterval(() => {
      refreshDemo(demoUuid).catch(() => {});
    }, 5000);
    return () => window.clearInterval(poll);
  }, [demoUuid, demoState, refreshDemo]);

  const sendVerification = async () => {
    setActionLoading(true);
    setError('');
    try {
      await api.verifyEmail();
      setVerificationSent(true);
    } catch (err) {
      setError(err.message || 'Не удалось отправить код');
    } finally {
      setActionLoading(false);
    }
  };

  const confirmVerification = async () => {
    if (!/^\d{6}$/.test(verificationCode)) {
      setError('Введите код из 6 цифр');
      return;
    }
    setActionLoading(true);
    setError('');
    try {
      await api.confirmEmail(verificationCode);
      setCurrentStep(1);
    } catch (err) {
      setError(err.message || 'Код не подошёл');
    } finally {
      setActionLoading(false);
    }
  };

  const connectZoom = () => {
    if (!['owner', 'admin'].includes(user?.role)) {
      setError('Подключить Zoom может владелец или администратор организации.');
      return;
    }
    navigate('/admin/settings?zoom_setup=1&return_to=%2Fonboarding');
  };

  const deferZoom = () => {
    localStorage.setItem('axiomeet_zoom_deferred', 'true');
    setCurrentStep(2);
  };

  const saveTemplate = () => {
    localStorage.setItem('axiomeet_protocol_template', selectedTemplate);
    setCurrentStep(3);
  };

  const createDemo = async () => {
    setActionLoading(true);
    setError('');
    try {
      const result = await api.createDemoMeeting(selectedTemplate);
      setDemoUuid(result.meeting_uuid);
      setDemoState(result.state || 'RECEIVED');
      await refreshDemo(result.meeting_uuid);
    } catch (err) {
      setError(err.message || 'Не удалось запустить демо-встречу');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="onboarding-page"><div className="spinner spinner-lg" /></div>;
  }

  const step = STEPS[currentStep];
  const StepIcon = step.icon;
  const demoSucceeded = SUCCESS_STATES.has(demoState);
  const demoFailed = FAILURE_STATES.has(demoState);

  const renderContent = () => {
    if (step.key === 'verify_email') {
      return (
        <>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 18 }}>
            Код подтверждения придёт на <strong>{user?.email}</strong>. Проверьте также папку «Спам».
          </p>
          {!verificationSent ? (
            <button className="btn btn-primary" onClick={sendVerification} disabled={actionLoading}>
              {actionLoading ? <Loader2 size={16} className="spinning" /> : <Mail size={16} />} Отправить код
            </button>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              <input
                className="form-input"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={verificationCode}
                onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, ''))}
                placeholder="6-значный код"
                aria-label="Код подтверждения email"
              />
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={confirmVerification} disabled={actionLoading}>
                  {actionLoading ? <Loader2 size={16} className="spinning" /> : <CheckCircle2 size={16} />} Подтвердить
                </button>
                <button className="btn btn-secondary" onClick={sendVerification} disabled={actionLoading}>Отправить ещё раз</button>
              </div>
            </div>
          )}
        </>
      );
    }

    if (step.key === 'connect_zoom') {
      return (
        <>
          <div style={{ background: 'var(--bg-content)', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 18 }}>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              В форме подключения введите Account ID, Client ID и Client Secret приложения Server-to-Server OAuth из Zoom Marketplace. AxioMeet проверит реквизиты перед сохранением.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={connectZoom}><Video size={16} /> Подключить Zoom</button>
            <button className="btn btn-secondary" onClick={deferZoom}>Сначала посмотреть демо</button>
          </div>
        </>
      );
    }

    if (step.key === 'choose_template') {
      return (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginBottom: 20 }}>
            {TEMPLATES.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                selected={selectedTemplate === template.id}
                onSelect={setSelectedTemplate}
              />
            ))}
          </div>
          <button className="btn btn-primary" onClick={saveTemplate}>
            <CheckCircle2 size={16} /> Выбрать и запустить демо
          </button>
        </>
      );
    }

    if (demoSucceeded) {
      return (
        <>
          <div style={{ background: 'var(--success-bg)', border: '1px solid #d1fae5', borderRadius: 'var(--radius-md)', padding: 22, textAlign: 'center', marginBottom: 18 }}>
            <CheckCircle2 size={42} style={{ color: 'var(--success)', marginBottom: 8 }} />
            <h3 style={{ color: 'var(--success-text)', marginBottom: 7 }}>Первый протокол готов</h3>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Вы увидели формат результата AxioMeet. Демо учтено в лимите пробного периода.</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => navigate('/meetings')}>Открыть результат</button>
            <button className="btn btn-secondary" onClick={() => navigate('/billing')}>Посмотреть тарифы</button>
          </div>
        </>
      );
    }

    return (
      <>
        <div style={{ background: 'var(--bg-content)', borderRadius: 'var(--radius-md)', padding: 18, marginBottom: 18 }}>
          {demoUuid && !demoFailed ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Loader2 size={22} className="spinning" />
              <div><strong>Обрабатываем демо-встречу</strong><div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Текущий этап: {demoState || 'RECEIVED'}. Страница обновится автоматически.</div></div>
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              Сформируем демонстрационный протокол по выбранному шаблону на основе вымышленного примера встречи. Для своей записи подключите Zoom после знакомства с результатом.
            </p>
          )}
        </div>
        {demoFailed && <p style={{ color: 'var(--error-text)' }}>Предыдущая попытка завершилась ошибкой. Можно безопасно запустить демо повторно.</p>}
        {(!demoUuid || demoFailed) && (
          <button className="btn btn-primary" onClick={createDemo} disabled={actionLoading}>
            {actionLoading ? <Loader2 size={16} className="spinning" /> : <Play size={16} />} Получить первый протокол
          </button>
        )}
      </>
    );
  };

  return (
    <div className="onboarding-page">
      <div style={{ width: '100%', maxWidth: 760 }}>
        <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'var(--primary-50)', color: 'var(--primary-700)', fontSize: 13 }}>
          Пробный период: 7 дней или 3 часа обработки — что наступит раньше. Карта не нужна.
        </div>
        <div style={{ display: 'flex', gap: 4, marginBottom: 28 }}>
          {STEPS.map((item, index) => (
            <div key={item.key} style={{
              flex: 1, height: 4, borderRadius: 4,
              background: index < currentStep ? 'var(--success)' : index === currentStep ? 'var(--primary-500)' : 'var(--border-color)',
            }} />
          ))}
        </div>
        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginBottom: 8 }}>Шаг {currentStep + 1} из {STEPS.length}</div>
        <div className="onboarding-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'var(--primary-50)', color: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><StepIcon size={22} /></div>
            <div><h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 700 }}>{step.title}</h2><p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>{step.desc}</p></div>
          </div>
          {error && (
            <div style={{ background: 'var(--error-bg)', color: 'var(--error-text)', padding: '10px 14px', borderRadius: 'var(--radius-md)', marginBottom: 16, display: 'flex', gap: 7, alignItems: 'center' }}>
              <AlertCircle size={15} /> {error}
            </div>
          )}
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
