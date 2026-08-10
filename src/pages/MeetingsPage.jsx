import { createElement, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import {
  AlertCircle, Calendar, CheckCircle2, ChevronLeft, ChevronRight, Clock,
  ExternalLink, FileText, Filter, Mic, RefreshCw, Search, Users,
} from 'lucide-react';

const STATUS_MAP = {
  PUBLISHED: { label: 'Готово', cls: 'badge-success', icon: CheckCircle2 },
  PROTOCOL_READY: { label: 'Протокол готов', cls: 'badge-success', icon: CheckCircle2 },
  PROCESSING: { label: 'Обработка', cls: 'badge-warning', icon: RefreshCw },
  VIDEO_UPLOADING: { label: 'Загрузка видео', cls: 'badge-info', icon: RefreshCw },
  VIDEO_UPLOADED: { label: 'Видео загружено', cls: 'badge-info', icon: CheckCircle2 },
  TRANSCRIBING: { label: 'Транскрипция', cls: 'badge-warning', icon: Mic },
  TRANSCRIPT_READY: { label: 'Транскрипт готов', cls: 'badge-info', icon: Mic },
  PROTOCOLING: { label: 'Создание протокола', cls: 'badge-warning', icon: FileText },
  PUBLISHING: { label: 'Публикация', cls: 'badge-warning', icon: RefreshCw },
  RECEIVED: { label: 'Получена', cls: 'badge-info', icon: Clock },
  NEW: { label: 'Новая', cls: 'badge-muted', icon: Clock },
  CANCELLED: { label: 'Отменена', cls: 'badge-muted', icon: AlertCircle },
};

const FILTERS = [
  { value: '', label: 'Все статусы' },
  { value: 'ready', label: 'Готово' },
  { value: 'processing', label: 'В обработке' },
  { value: 'error', label: 'С ошибками' },
  { value: 'skipped', label: 'Пропущено' },
];

function statusFor(state) {
  if (STATUS_MAP[state]) return STATUS_MAP[state];
  if ((state || '').startsWith('ERROR')) return { label: 'Ошибка', cls: 'badge-error', icon: AlertCircle };
  if ((state || '').startsWith('SKIPPED') || state === 'NO_AUDIO') return { label: 'Пропущено', cls: 'badge-muted', icon: AlertCircle };
  return { label: state || '—', cls: 'badge-muted', icon: Clock };
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(minutes) {
  if (!minutes) return '—';
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  return hours ? `${hours} ч ${rest} мин` : `${rest} мин`;
}

function Stat({ icon, value, label, color }) {
  return (
    <div className="stat-card" style={{ '--accent': color }}>
      <div className="stat-card-top"><div className="stat-card-icon" style={{ background: `${color}15`, color }}>{createElement(icon, { size: 20 })}</div></div>
      <div className="stat-card-value">{value ?? 0}</div>
      <div className="stat-card-label">{label}</div>
    </div>
  );
}

export default function MeetingsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState({ meetings: [], total: 0, pages: 1, counts: {} });
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [stateGroup, setStateGroup] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await api.getMeetings({ page, perPage: 20, stateGroup, search });
      setData({
        meetings: result.meetings || [],
        total: result.total || 0,
        pages: Math.max(1, result.pages || 1),
        counts: result.counts || {},
      });
    } catch (err) {
      setError(err.message || 'Ошибка загрузки встреч');
    } finally {
      setLoading(false);
    }
  }, [page, search, stateGroup]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  if (loading && data.meetings.length === 0) {
    return <div className="dash-loading"><div className="spinner spinner-lg" /><p>Загрузка встреч…</p></div>;
  }

  if (error && data.meetings.length === 0) {
    return (
      <div className="dash-error"><AlertCircle size={48} strokeWidth={1.5} /><h3>Ошибка загрузки</h3><p>{error}</p><button className="btn btn-primary" onClick={load}><RefreshCw size={16} /> Повторить</button></div>
    );
  }

  const counts = data.counts;

  return (
    <div className="platform-page">
      <PageHeader title="Встречи" subtitle="Протоколы, транскрипты, участники и задачи в одном рабочем пространстве" breadcrumbs={[{ label: 'Основное' }, { label: 'Встречи' }]}>
        <button className="btn btn-secondary btn-sm" onClick={load} disabled={loading}><RefreshCw size={14} className={loading ? 'spinning' : ''} /> Обновить</button>
      </PageHeader>

      <div className="stat-grid-4" style={{ marginBottom: 24 }}>
        <Stat icon={Mic} value={counts.total ?? data.total} label="Всего встреч" color="#2A5580" />
        <Stat icon={CheckCircle2} value={counts.ready} label="Готово" color="#10b981" />
        <Stat icon={RefreshCw} value={counts.processing} label="В обработке" color="#E8833A" />
        <Stat icon={AlertCircle} value={counts.error} label="С ошибками" color="#ef4444" />
      </div>

      <div className="card meetings-toolbar">
        <div className="meetings-search"><Search size={16} /><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Поиск по теме, ведущему или участнику…" /></div>
        <div className="meetings-filter"><Filter size={15} /><select className="form-input" value={stateGroup} onChange={(event) => { setStateGroup(event.target.value); setPage(1); }}>{FILTERS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
        <span>{data.total} встреч</span>
      </div>

      {error && <div className="workspace-notice workspace-notice-error">{error}</div>}

      <div className="card">
        {data.meetings.length === 0 ? (
          <EmptyState icon="🎤" title={search || stateGroup ? 'Ничего не найдено' : 'Нет встреч'} description={search || stateGroup ? 'Измените поиск или фильтр' : 'Подключите Zoom и запишите первую встречу'} />
        ) : (
          <>
            <div className="table-wrapper">
              <table className="table meetings-table-v2">
                <thead><tr><th>Встреча</th><th>Источник</th><th>Статус</th><th>Длительность</th><th>Участники</th><th /></tr></thead>
                <tbody>
                  {data.meetings.map((meeting) => {
                    const state = meeting.state || meeting.status;
                    const status = statusFor(state);
                    const StatusIcon = status.icon;
                    const timestamp = meeting.start_time || meeting.created_at;
                    return (
                      <tr key={meeting.uuid} onClick={() => navigate(`/meetings/${encodeURIComponent(meeting.uuid)}`)}>
                        <td><div className="meeting-title-cell"><div className={meeting.has_protocol ? 'ready' : ''}>{meeting.has_protocol ? <FileText size={16} /> : <Mic size={16} />}</div><div><strong>{meeting.topic || 'Без темы'}</strong><span><Calendar size={11} /> {formatDate(timestamp)} · {formatTime(timestamp)}</span></div></div></td>
                        <td><span className="meeting-source">{meeting.source_label || meeting.zoom_account_label || 'Zoom'}</span></td>
                        <td><span className={`status-chip ${status.cls}`}><StatusIcon size={12} /> {status.label}</span></td>
                        <td>{formatDuration(meeting.duration_minutes)}</td>
                        <td><span className="participants-count"><Users size={13} /> {meeting.participants_count ?? '—'}</span></td>
                        <td onClick={(event) => event.stopPropagation()}>{meeting.drive_folder_url && <a href={meeting.drive_folder_url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" title="Google Drive"><ExternalLink size={14} /></a>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="meetings-pagination">
              <span>Страница {page} из {data.pages}</span>
              <div>
                <button className="btn btn-ghost btn-sm" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)}><ChevronLeft size={16} /></button>
                <button className="btn btn-ghost btn-sm" disabled={page >= data.pages || loading} onClick={() => setPage((current) => current + 1)}><ChevronRight size={16} /></button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
