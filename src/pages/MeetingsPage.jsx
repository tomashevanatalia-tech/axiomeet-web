import { useState, useEffect } from 'react';
import api from '../api';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import {
  Mic, FileText, Clock, CheckCircle2, AlertCircle, RefreshCw,
  Search, Filter, Download, ExternalLink, ChevronLeft, ChevronRight,
  Calendar, Users, Play, Eye,
} from 'lucide-react';

const STATUS_MAP = {
  PUBLISHED: { label: 'Готово', cls: 'badge-success', icon: CheckCircle2 },
  READY: { label: 'Готово', cls: 'badge-success', icon: CheckCircle2 },
  PROCESSING: { label: 'Обработка', cls: 'badge-warning', icon: RefreshCw },
  DOWNLOADED: { label: 'Скачано', cls: 'badge-info', icon: Download },
  TRANSCRIBING: { label: 'Транскрипция', cls: 'badge-warning', icon: Mic },
  PROTOCOL_GENERATING: { label: 'Протокол', cls: 'badge-warning', icon: FileText },
  ERROR: { label: 'Ошибка', cls: 'badge-error', icon: AlertCircle },
  SKIPPED_NO_VIDEO: { label: 'Пропущено', cls: 'badge-muted', icon: AlertCircle },
  NEW: { label: 'Новая', cls: 'badge-muted', icon: Clock },
  RECEIVED: { label: 'Получена', cls: 'badge-info', icon: CheckCircle2 },
};

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Все статусы' },
  { value: 'PUBLISHED', label: 'Готово' },
  { value: 'PROCESSING', label: 'В обработке' },
  { value: 'ERROR', label: 'С ошибками' },
];

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(minutes) {
  if (!minutes) return '—';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h}ч ${m}м` : `${m}м`;
}

function MeetingRow({ meeting, onView }) {
  const status = STATUS_MAP[meeting.status || meeting.state] || { label: meeting.status || '—', cls: 'badge-muted' };
  const StIcon = status.icon || FileText;
  const hasProtocol = meeting.status === 'PUBLISHED' || meeting.state === 'PUBLISHED' || meeting.has_protocol;
  const hasTranscript = meeting.has_transcript || hasProtocol;

  return (
    <tr>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 'var(--radius-md)',
            background: hasProtocol ? 'var(--success-bg)' : 'var(--bg-input)',
            color: hasProtocol ? 'var(--success-text)' : 'var(--text-muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            {hasProtocol ? <FileText size={16} /> : <Mic size={16} />}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
              {meeting.topic || 'Без темы'}
            </div>
            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Calendar size={11} /> {formatDate(meeting.created_at || meeting.start_time)}
              </span>
              <span>{formatTime(meeting.created_at || meeting.start_time)}</span>
            </div>
          </div>
        </div>
      </td>
      <td>
        <span className={`status-chip ${status.cls}`}>
          <StIcon size={12} />
          {status.label}
        </span>
      </td>
      <td style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>
        {formatDuration(meeting.duration_minutes)}
      </td>
      <td style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>
        {meeting.participants_count || meeting.participants?.length || '—'}
      </td>
      <td>
        <div style={{ display: 'flex', gap: 6 }}>
          {hasProtocol && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onView(meeting)}
              title="Посмотреть протокол"
            >
              <Eye size={14} />
            </button>
          )}
          {meeting.drive_url && (
            <a
              href={meeting.drive_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost btn-sm"
              title="Открыть в Google Drive"
            >
              <ExternalLink size={14} />
            </a>
          )}
        </div>
      </td>
    </tr>
  );
}

function MeetingDetail({ meeting, onClose }) {
  if (!meeting) return null;

  return (
    <div className="card" style={{ marginBottom: 24, borderColor: 'var(--primary-300)', position: 'relative' }}>
      <button
        className="btn btn-ghost btn-sm"
        onClick={onClose}
        style={{ position: 'absolute', top: 12, right: 12 }}
      >
        ✕ Закрыть
      </button>
      <div className="card-header" style={{ borderBottom: '1px solid var(--border-light)' }}>
        <h3 className="card-title"><FileText size={16} /> {meeting.topic || 'Без темы'}</h3>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginBottom: 2 }}>Дата</div>
          <div style={{ fontWeight: 600 }}>{formatDate(meeting.created_at || meeting.start_time)}</div>
        </div>
        <div>
          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginBottom: 2 }}>Длительность</div>
          <div style={{ fontWeight: 600 }}>{formatDuration(meeting.duration_minutes)}</div>
        </div>
        <div>
          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginBottom: 2 }}>Участники</div>
          <div style={{ fontWeight: 600 }}>{meeting.participants_count || '—'}</div>
        </div>
        <div>
          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginBottom: 2 }}>Статус</div>
          <span className={`status-chip ${(STATUS_MAP[meeting.status || meeting.state] || {}).cls || 'badge-muted'}`}>
            {(STATUS_MAP[meeting.status || meeting.state] || {}).label || meeting.status || '—'}
          </span>
        </div>
      </div>

      {/* Action Links */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {meeting.protocol_url && (
          <a href={meeting.protocol_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
            <FileText size={14} /> Протокол
          </a>
        )}
        {meeting.transcript_url && (
          <a href={meeting.transcript_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
            <Mic size={14} /> Транскрипт
          </a>
        )}
        {meeting.drive_url && (
          <a href={meeting.drive_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
            <ExternalLink size={14} /> Google Drive
          </a>
        )}
        {meeting.video_url && (
          <a href={meeting.video_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
            <Play size={14} /> Видео
          </a>
        )}
      </div>
    </div>
  );
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const perPage = 20;

  useEffect(() => { loadMeetings(); }, []);

  const loadMeetings = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/api/v1/client/meetings?limit=200');
      setMeetings(data.meetings || data || []);
    } catch (err) {
      setError(err.message || 'Ошибка загрузки встреч');
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering
  const filtered = meetings.filter((m) => {
    const matchSearch = !search ||
      (m.topic || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter ||
      m.status === statusFilter || m.state === statusFilter ||
      (statusFilter === 'PROCESSING' && ['PROCESSING', 'DOWNLOADED', 'TRANSCRIBING', 'PROTOCOL_GENERATING'].includes(m.status || m.state));
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const pageData = filtered.slice((page - 1) * perPage, page * perPage);

  const publishedCount = meetings.filter(m => ['PUBLISHED', 'READY'].includes(m.status || m.state)).length;
  const processingCount = meetings.filter(m => ['PROCESSING', 'DOWNLOADED', 'TRANSCRIBING', 'PROTOCOL_GENERATING'].includes(m.status || m.state)).length;
  const errorCount = meetings.filter(m => (m.status || m.state) === 'ERROR').length;

  if (loading) {
    return (
      <div className="dash-loading">
        <div className="spinner spinner-lg" />
        <p>Загрузка встреч...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dash-error">
        <AlertCircle size={48} strokeWidth={1.5} />
        <h3>Ошибка загрузки</h3>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={loadMeetings}>
          <RefreshCw size={16} /> Повторить
        </button>
      </div>
    );
  }

  return (
    <div className="platform-page">
      <PageHeader
        title="Встречи"
        subtitle="Все ваши обработанные встречи и протоколы"
        breadcrumbs={[{ label: 'Основное' }, { label: 'Встречи' }]}
      >
        <button className="btn btn-secondary btn-sm" onClick={loadMeetings}>
          <RefreshCw size={14} /> Обновить
        </button>
      </PageHeader>

      {/* Quick Stats */}
      <div className="stat-grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card" style={{ '--accent': '#6366f1' }}>
          <div className="stat-card-top">
            <div className="stat-card-icon" style={{ background: '#6366f115', color: '#6366f1' }}>
              <Mic size={20} />
            </div>
          </div>
          <div className="stat-card-value">{meetings.length}</div>
          <div className="stat-card-label">Всего встреч</div>
        </div>
        <div className="stat-card" style={{ '--accent': '#10b981' }}>
          <div className="stat-card-top">
            <div className="stat-card-icon" style={{ background: '#10b98115', color: '#10b981' }}>
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="stat-card-value">{publishedCount}</div>
          <div className="stat-card-label">Протоколов готово</div>
        </div>
        <div className="stat-card" style={{ '--accent': '#f59e0b' }}>
          <div className="stat-card-top">
            <div className="stat-card-icon" style={{ background: '#f59e0b15', color: '#f59e0b' }}>
              <RefreshCw size={20} />
            </div>
          </div>
          <div className="stat-card-value">{processingCount}</div>
          <div className="stat-card-label">В обработке</div>
        </div>
        <div className="stat-card" style={{ '--accent': '#ef4444' }}>
          <div className="stat-card-top">
            <div className="stat-card-icon" style={{ background: '#ef444415', color: '#ef4444' }}>
              <AlertCircle size={20} />
            </div>
          </div>
          <div className="stat-card-value">{errorCount}</div>
          <div className="stat-card-label">С ошибками</div>
        </div>
      </div>

      {/* Selected Meeting Detail */}
      {selectedMeeting && (
        <MeetingDetail meeting={selectedMeeting} onClose={() => setSelectedMeeting(null)} />
      )}

      {/* Filters */}
      <div className="card" style={{ marginBottom: 24, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 200 }}>
          <Search size={16} style={{ color: 'var(--text-muted)' }} />
          <input
            className="form-input" style={{ border: 'none', padding: '6px 0', background: 'none', boxShadow: 'none' }}
            placeholder="Поиск по теме встречи..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={14} style={{ color: 'var(--text-muted)' }} />
          <select
            className="form-input" style={{ width: 'auto', padding: '6px 12px', minWidth: 150 }}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            {STATUS_FILTER_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
          {filtered.length} из {meetings.length}
        </span>
      </div>

      {/* Meetings Table */}
      <div className="card">
        {filtered.length === 0 ? (
          <EmptyState
            icon="🎤"
            title={search || statusFilter ? 'Ничего не найдено' : 'Нет встреч'}
            description={search || statusFilter
              ? 'Попробуйте изменить фильтры'
              : 'Подключите Zoom и запишите первую встречу'}
          />
        ) : (
          <>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Встреча</th>
                    <th>Статус</th>
                    <th>Длительность</th>
                    <th>Участники</th>
                    <th style={{ width: 100 }}>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {pageData.map(m => (
                    <MeetingRow
                      key={m.id}
                      meeting={m}
                      onView={(meeting) => setSelectedMeeting(meeting)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 0 0', borderTop: '1px solid var(--border-light)', marginTop: 8,
              }}>
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                  Страница {page} из {totalPages}
                </span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const p = page <= 3 ? i + 1 : page + i - 2;
                    if (p < 1 || p > totalPages) return null;
                    return (
                      <button
                        key={p}
                        className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </button>
                    );
                  })}
                  <button
                    className="btn btn-ghost btn-sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
