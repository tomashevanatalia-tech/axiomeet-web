import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

export default function ProcessingProgress({ processing, error }) {
  if (!processing) return null;
  const warning = processing.is_stalled || processing.stage === 'error';
  const Icon = warning ? AlertTriangle : processing.stage === 'complete' ? CheckCircle2 : Clock;
  return (
    <section className={`workspace-progress${warning ? ' workspace-progress-warning' : ''}`} aria-live="polite">
      <Icon size={20} />
      <div>
        <strong>{processing.is_stalled ? 'Обработка задерживается' : processing.label}</strong>
        <p>{processing.next_action}</p>
        <div className="workspace-progress-artifacts">
          <span>Запись: {processing.has_media ? 'сохранена' : 'нет подтверждения'}</span>
          <span>Транскрипт: {processing.has_transcript ? 'готов' : 'не готов'}</span>
          <span>Протокол: {processing.has_protocol ? 'готов' : 'не готов'}</span>
        </div>
        {processing.updated_at && <small>Этап обновлён: {new Date(processing.updated_at).toLocaleString('ru-RU')}</small>}
        {error && <p role="alert">{error}. Повторим проверку автоматически.</p>}
      </div>
    </section>
  );
}
