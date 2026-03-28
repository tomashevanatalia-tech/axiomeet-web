import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import api from '../api';
import {
  Video, HardDrive, FileText, PartyPopper, ChevronRight,
  CheckCircle2, ExternalLink, Copy, AlertCircle, Loader2,
  Mic, Users as UsersIcon, ClipboardList, Brain, MessageSquare,
  Gauge, BarChart3, BookOpen
} from 'lucide-react';

const STEPS = [
  { key: 'connect_video', title: 'Подключите Zoom', icon: Video, desc: 'Настройте интеграцию с Zoom для автоматической записи' },
  { key: 'connect_storage', title: 'Подключите Google Drive', icon: HardDrive, desc: 'Для сохранения протоколов и транскриптов' },
  { key: 'choose_template', title: 'Выберите шаблон', icon: FileText, desc: 'Выберите формат AI-протоколов' },
  { key: 'first_meeting', title: 'Всё готово!', icon: PartyPopper, desc: 'Проведите первую встречу' },
];

const TEMPLATES = [
  { id: 'standard', name: 'Стандартный', icon: ClipboardList, desc: 'Универсальный протокол: повестка, решения, задачи', color: '#6366f1' },
  { id: 'sales_call', name: 'Продажи', icon: BarChart3, desc: 'BANT-квалификация, возражения, next steps', color: '#10b981' },
  { id: 'interview', name: 'Собеседование', icon: UsersIcon, desc: 'Оценка кандидата, компетенции, рекомендации', color: '#f59e0b' },
  { id: 'one_on_one', name: '1-on-1', icon: MessageSquare, desc: 'Личная встреча: результаты, блокеры, обратная связь', color: '#06b6d4' },
  { id: 'standup', name: 'Стендап', icon: Gauge, desc: 'Что сделал / что делаю / блокеры', color: '#ec4899' },
  { id: 'brainstorm', name: 'Мозговой штурм', icon: Brain, desc: 'Идеи, голосование, приоритизация', color: '#8b5cf6' },
];

const ZOOM_INSTRUCTIONS = [
  { step: 1, title: 'Откройте Zoom Marketplace', text: 'Перейдите на marketplace.zoom.us → Develop → Build App → Server-to-Server OAuth', link: 'https://marketplace.zoom.us/' },
  { step: 2, title: 'Создайте приложение', text: 'Имя: AxioMeet. Скопируйте Account ID, Client ID, Client Secret' },
  { step: 3, title: 'Добавьте Scopes', text: 'cloud_recording:read, user:read, meeting:read (все с :admin)' },
  { step: 4, title: 'Настройте Webhook', text: 'Event endpoint: https://app.axiomeet.io/webhook → Event: All Recordings completed' },
  { step: 5, title: 'Активируйте', text: 'Вкладка Activation → Activate your app → Active ✅' },
  { step: 6, title: 'Передайте данные', text: 'Отправьте Account ID, Client ID, Client Secret и Secret Token администратору' },
];

const DRIVE_INSTRUCTIONS = [
  { step: 1, title: 'Создайте папку', text: 'В Google Drive создайте папку "Zooms" (или любое имя)', link: 'https://drive.google.com/' },
  { step: 2, title: 'Расшарьте папку', text: 'ПКМ → Поделиться → Введите email Service Account (получите у администратора) → Роль: Редактор' },
  { step: 3, title: 'Скопируйте ID папки', text: 'Из URL: drive.google.com/drive/folders/XXXXXXX — XXXXXXX это ID' },
];

function InstructionStep({ s }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
      <div style={{
        width: 28, height: 28, borderRadius: 'var(--radius-full)',
        background: 'var(--primary-50)', color: 'var(--primary-600)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 'var(--font-sm)', fontWeight: 700, flexShrink: 0
      }}>{s.step}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 'var(--font-base)', color: 'var(--text-primary)' }}>{s.title}</div>
        <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', marginTop: 2 }}>{s.text}</div>
        {s.link && (
          <a href={s.link} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 'var(--font-xs)', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <ExternalLink size={12} /> Открыть
          </a>
        )}
      </div>
    </div>
  );
}

function TemplateCard({ t, selected, onSelect }) {
  const Icon = t.icon;
  return (
    <div onClick={() => onSelect(t.id)} style={{
      padding: 16, borderRadius: 'var(--radius-lg)',
      border: selected ? `2px solid ${t.color}` : '1px solid var(--border-color)',
      background: selected ? `${t.color}08` : 'var(--bg-card)',
      cursor: 'pointer', transition: 'all 0.2s',
      display: 'flex', alignItems: 'flex-start', gap: 12,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 'var(--radius-md)',
        background: `${t.color}15`, color: t.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={18} />
      </div>
      <div>
        <div style={{ fontWeight: 600, fontSize: 'var(--font-base)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          {t.name}
          {selected && <CheckCircle2 size={14} style={{ color: t.color }} />}
        </div>
        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginTop: 2 }}>{t.desc}</div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('standard');
  const [error, setError] = useState('');

  useEffect(() => { loadProgress(); }, []);

  const loadProgress = async () => {
    setLoading(true);
    try {
      const data = await api.getOnboardingProgress();
      setProgress(data);
      if (data.steps) {
        // Find first incomplete step from our 4-step flow
        const frontendSteps = STEPS.map(s => s.key);
        const idx = frontendSteps.findIndex(key => {
          const serverStep = data.steps.find(ss => ss.step_name === key);
          return !serverStep || (serverStep.status !== 'completed' && serverStep.status !== 'skipped');
        });
        setCurrentStep(idx >= 0 ? idx : STEPS.length - 1);
      }
      if (data.status === 'completed') navigate('/dashboard');
    } catch (err) {
      if (err.status === 404) {
        try { await api.startOnboarding(); await loadProgress(); } catch {}
      }
    } finally { setLoading(false); }
  };

  const handleConnectZoom = () => {
    const orgId = user?.organization_id;
    if (orgId) window.location.href = api.getZoomAuthUrl(orgId);
  };

  const handleConnectYandex = () => {
    const orgId = user?.organization_id;
    if (orgId) window.location.href = api.getYandexAuthUrl(orgId);
  };

  const handleSkip = async (stepName) => {
    setActionLoading(true);
    try { await api.skipStep(stepName); await loadProgress(); } catch (err) { setError(err.message); }
    finally { setActionLoading(false); }
  };

  const handleComplete = async (stepName, metadata) => {
    setActionLoading(true);
    try { await api.completeStep(stepName, metadata); await loadProgress(); } catch (err) { setError(err.message); }
    finally { setActionLoading(false); }
  };

  const handleTemplateSelect = async () => {
    // Skip test_video and test_storage if still pending, then complete choose_template
    await handleSkip('test_video');
    await handleSkip('test_storage');
    await handleComplete('first_meeting', { template: selectedTemplate });
  };

  const handleFinish = () => navigate('/dashboard');

  if (loading) {
    return (
      <div className="onboarding-page">
        <div style={{ textAlign: 'center' }}>
          <div className="spinner spinner-lg" style={{ margin: '0 auto' }} />
          <p style={{ marginTop: 16, color: 'var(--text-muted)' }}>Загрузка...</p>
        </div>
      </div>
    );
  }

  const step = STEPS[currentStep] || STEPS[0];
  const StepIcon = step.icon;

  const renderStepContent = () => {
    switch (step.key) {
      case 'connect_video':
        return (
          <>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 'var(--font-md)', fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <BookOpen size={16} /> Инструкция по настройке
              </h3>
              <div style={{ background: 'var(--bg-content)', borderRadius: 'var(--radius-md)', padding: 16 }}>
                {ZOOM_INSTRUCTIONS.map(s => <InstructionStep key={s.step} s={s} />)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-primary" onClick={handleConnectZoom}>
                <Video size={16} /> Подключить через OAuth
              </button>
              <button className="btn btn-secondary" onClick={() => handleSkip('connect_video')}>
                Пропустить — настрою позже
              </button>
            </div>
          </>
        );

      case 'connect_storage':
        return (
          <>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 'var(--font-md)', fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <BookOpen size={16} /> Инструкция по настройке
              </h3>
              <div style={{ background: 'var(--bg-content)', borderRadius: 'var(--radius-md)', padding: 16 }}>
                {DRIVE_INSTRUCTIONS.map(s => <InstructionStep key={s.step} s={s} />)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-primary" onClick={handleConnectYandex}>
                <HardDrive size={16} /> Подключить Яндекс Диск
              </button>
              <button className="btn btn-secondary" onClick={() => handleSkip('connect_storage')}>
                Пропустить — использую Google Drive
              </button>
            </div>
          </>
        );

      case 'choose_template':
        return (
          <>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', marginBottom: 16 }}>
              Каждая встреча будет анализироваться по выбранному шаблону. Вы можете изменить шаблон позже в Настройках.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 20 }}>
              {TEMPLATES.map(t => (
                <TemplateCard key={t.id} t={t} selected={selectedTemplate === t.id} onSelect={setSelectedTemplate} />
              ))}
            </div>
            <button className="btn btn-primary" onClick={handleTemplateSelect} disabled={actionLoading}>
              {actionLoading ? <Loader2 size={16} className="spinning" /> : <CheckCircle2 size={16} />}
              Выбрать «{TEMPLATES.find(t => t.id === selectedTemplate)?.name}» и продолжить
            </button>
          </>
        );

      case 'first_meeting':
        return (
          <>
            <div style={{
              background: 'var(--success-bg)', border: '1px solid #d1fae5',
              borderRadius: 'var(--radius-md)', padding: 20, marginBottom: 20, textAlign: 'center'
            }}>
              <CheckCircle2 size={40} style={{ color: 'var(--success)', marginBottom: 8 }} />
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--success-text)' }}>
                Настройка завершена! 🎉
              </h3>
              <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', marginTop: 8 }}>
                Проведите встречу в Zoom — AxioMeet автоматически обработает запись за 5–15 минут.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-primary" onClick={handleFinish}>
                <PartyPopper size={16} /> Перейти в Dashboard
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
      <div style={{ width: '100%', maxWidth: 700 }}>
        {/* Progress bar */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 32 }}>
          {STEPS.map((s, idx) => (
            <div key={s.key} style={{
              flex: 1, height: 4, borderRadius: 4,
              background: idx < currentStep ? 'var(--success)' : idx === currentStep ? 'var(--primary-500)' : 'var(--border-color)',
              transition: 'all 0.3s',
            }} />
          ))}
        </div>

        {/* Step counter */}
        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginBottom: 8 }}>
          Шаг {currentStep + 1} из {STEPS.length}
        </div>

        {/* Step card */}
        <div className="onboarding-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 'var(--radius-md)',
              background: 'var(--primary-50)', color: 'var(--primary-600)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <StepIcon size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 700, color: 'var(--text-primary)' }}>{step.title}</h2>
              <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>{step.desc}</p>
            </div>
          </div>

          {error && (
            <div style={{
              background: 'var(--error-bg)', color: 'var(--error-text)',
              padding: '10px 14px', borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-sm)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6
            }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {renderStepContent()}
        </div>
      </div>
    </div>
  );
}
