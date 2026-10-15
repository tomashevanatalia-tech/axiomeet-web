import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ResourceError({ label, message, retrying, onRetry }) {
  return (
    <div className="workspace-notice workspace-notice-error" role="alert">
      <AlertCircle size={16} />
      <div><strong>Не удалось загрузить {label}.</strong><br />{message}</div>
      <button className="btn btn-secondary btn-sm" onClick={onRetry} disabled={retrying}>
        <RefreshCw size={14} /> {retrying ? 'Загрузка…' : 'Повторить'}
      </button>
    </div>
  );
}
