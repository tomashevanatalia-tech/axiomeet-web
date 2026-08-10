import { createElement, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import api from '../api';
import {
  AlertCircle, AlertTriangle, ArrowLeft, Calendar, Check, Clock,
  ExternalLink, FileText, FolderOpen, History, Link2, ListTodo, Mail,
  Mic, RefreshCw, RotateCcw, Save, Trash2, Users,
} from 'lucide-react';

const TABS = [
  { id: 'protocol', label: 'Протокол', icon: FileText },
  { id: 'transcript', label: 'Транскрипт', icon: Mic },
  { id: 'participants', label: 'Участники', icon: Users },
  { id: 'tasks', label: 'Задачи', icon: ListTodo },
  { id: 'files', label: 'Файлы', icon: FolderOpen },
  { id: 'history', label: 'История', icon: History },
];

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('ru-RU', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function formatDuration(minutes) {
  if (!minutes) return '—';
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  return hours ? `${hours} ч ${rest} мин` : `${rest} мин`;
}

function formatTimecode(segment) {
  const raw = segment.start_seconds ?? segment.start ?? segment.start_time ?? null;
  if (raw === null || raw === undefined || raw === '') return '—';
  if (typeof raw === 'string' && raw.includes(':')) return raw;
  const total = Number(raw) > 100000 ? Math.floor(Number(raw) / 1000) : Math.floor(Number(raw));
  if (!Number.isFinite(total)) return '—';
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return [hours, minutes, seconds]
    .filter((_, index) => hours > 0 || index > 0)
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
}

function noticeClass(type) {
  if (type === 'success') return 'workspace-notice workspace-notice-success';
  if (type === 'warning') return 'workspace-notice workspace-notice-warning';
  return 'workspace-notice workspace-notice-error';
}

export default function MeetingWorkspacePage() {
  const { uuid } = useParams();
  const { user } = useAuth();
  const canEdit = ['owner', 'admin', 'member'].includes(user?.role);
  const [meeting, setMeeting] = useState(null);
  const [transcript, setTranscript] = useState(null);
  const [versions, setVersions] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [shareLinks, setShareLinks] = useState([]);
  const [activeTab, setActiveTab] = useState('protocol');
  const [protocolDraft, setProtocolDraft] = useState('');
  const [segments, setSegments] = useState([]);
  const [speakerRenames, setSpeakerRenames] = useState({});
  const [renameFrom, setRenameFrom] = useState('');
  const [renameTo, setRenameTo] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('standard');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const detail = await api.getMeetingDetail(uuid);
      setMeeting(detail);
      setProtocolDraft(detail.protocol_md || '');
      setSelectedTemplate(detail.protocol_template || 'standard');

      const [transcriptData, versionData, templateData, shareData] = await Promise.all([
        api.getMeetingTranscript(uuid).catch(() => null),
        api.getProtocolVersions(uuid).catch(() => ({ versions: [] })),
        api.getProtocolTemplates().catch(() => ({ templates: [] })),
        api.listShareLinks(uuid).catch(() => ({ links: [] })),
      ]);
      setTranscript(transcriptData);
      setSegments(transcriptData?.segments || []);
      setVersions(versionData?.versions || []);
      setTemplates(templateData?.templates || []);
      setShareLinks(shareData?.links || []);
    } catch (err) {
      setError(err.message || 'Не удалось загрузить встречу');
    } finally {
      setLoading(false);
    }
  }, [uuid]);

  useEffect(() => { load(); }, [load]);

  const speakers = useMemo(() => Array.from(new Set(
    segments.map((segment) => (segment.speaker || '').trim()).filter(Boolean)
  )).sort((a, b) => a.localeCompare(b, 'ru')), [segments]);

  const files = useMemo(() => meeting?.files || meeting?.generated_files || [], [meeting]);
  const participants = meeting?.participants || [];
  const tasks = meeting?.tasks || [];

  const showNotice = (message, type = 'success') => {
    setNotice({ message, type });
    window.setTimeout(() => setNotice(null), 5000);
  };

  const saveProtocol = async () => {
    if (!protocolDraft.trim()) return;
    setBusy('protocol');
    try {
      const result = await api.updateMeetingProtocol(uuid, protocolDraft);
      setMeeting((current) => ({
        ...current,
        protocol_md: result.protocol_md || protocolDraft,
        protocol_generated_at: result.protocol_generated_at,
      }));
      const history = await api.getProtocolVersions(uuid).catch(() => ({ versions }));
      setVersions(history.versions || versions);
      showNotice(
        result.drive_synced
          ? 'Протокол сохранён в кабинете и синхронизирован с Google Drive'
          : 'Протокол сохранён в кабинете, но Google Drive сейчас недоступен',
        result.drive_synced ? 'success' : 'warning',
      );
    } catch (err) {
      showNotice(err.message || 'Не удалось сохранить протокол', 'error');
    } finally {
      setBusy('');
    }
  };

  const saveTemplate = async () => {
    setBusy('template');
    try {
      await api.updateMeetingTemplate(uuid, selectedTemplate);
      setMeeting((current) => ({ ...current, protocol_template: selectedTemplate }));
      showNotice('Шаблон сохранён. Протокол не изменён до отдельной перегенерации.');
    } catch (err) {
      showNotice(err.message || 'Не удалось сохранить шаблон', 'error');
    } finally {
      setBusy('');
    }
  };

  const regenerateProtocol = async () => {
    const templateName = templates.find((template) => template.id === selectedTemplate)?.name || selectedTemplate;
    if (!window.confirm(`Перегенерировать протокол по шаблону «${templateName}»? Текущая версия сохранится в истории.`)) return;
    setBusy('regenerate');
    try {
      const result = await api.regenerateMeetingProtocol(uuid, selectedTemplate);
      setProtocolDraft(result.protocol_md || '');
      setMeeting((current) => ({
        ...current,
        protocol_md: result.protocol_md,
        protocol_template: result.protocol_template,
        protocol_generated_at: result.protocol_generated_at,
        protocol_stale: false,
      }));
      const history = await api.getProtocolVersions(uuid).catch(() => ({ versions }));
      setVersions(history.versions || versions);
      showNotice('Новый протокол создан и сохранён. Предыдущая версия доступна в истории.');
    } catch (err) {
      showNotice(err.message || 'Не удалось перегенерировать протокол', 'error');
    } finally {
      setBusy('');
    }
  };

  const updateSegment = (index, key, value) => {
    setSegments((current) => current.map((segment, segmentIndex) => (
      segmentIndex === index ? { ...segment, [key]: value } : segment
    )));
  };

  const bulkRename = () => {
    const from = renameFrom.trim();
    const to = renameTo.trim();
    if (!from || !to || from === to) return;
    setSegments((current) => current.map((segment) => (
      segment.speaker === from ? { ...segment, speaker: to } : segment
    )));
    setSpeakerRenames((current) => ({ ...current, [from]: to }));
    setRenameFrom('');
    setRenameTo('');
    showNotice(`Имя «${from}» заменено на «${to}» во всех репликах. Сохраните транскрипт.`, 'warning');
  };

  const saveTranscript = async () => {
    setBusy('transcript');
    try {
      const result = await api.updateMeetingTranscript(uuid, {
        segments,
        revision: transcript?.revision ?? 0,
        speaker_renames: Object.entries(speakerRenames).map(([from, to]) => ({ from, to })),
        sync_drive: true,
      });
      setTranscript(result);
      setSegments(result.segments || segments);
      setSpeakerRenames({});
      setMeeting((current) => ({ ...current, protocol_stale: true, participants: result.participants || current.participants }));
      showNotice(
        result.drive_synced
          ? 'Транскрипт и имена сохранены в Google Drive. Протокол требует явного обновления.'
          : 'Правки сохранены в кабинете, но Google Drive сейчас недоступен. Протокол требует явного обновления.',
        'warning',
      );
    } catch (err) {
      showNotice(err.message || 'Не удалось сохранить транскрипт', 'error');
    } finally {
      setBusy('');
    }
  };

  const changeTaskStatus = async (task, status) => {
    setBusy(`task-${task.id}`);
    try {
      const result = await api.updateMeetingTask(uuid, task.id, { status });
      setMeeting((current) => ({
        ...current,
        tasks: current.tasks.map((row) => row.id === task.id ? result.task : row),
      }));
    } catch (err) {
      showNotice(err.message || 'Не удалось изменить задачу', 'error');
    } finally {
      setBusy('');
    }
  };

  const createShareLink = async () => {
    setBusy('share');
    try {
      const result = await api.createShareLink(uuid, 30);
      const link = result.link || result;
      if (link.url) {
        await navigator.clipboard.writeText(link.url).catch(() => {});
        showNotice('Публичная ссылка на 30 дней создана и скопирована');
      }
      const data = await api.listShareLinks(uuid);
      setShareLinks(data.links || []);
    } catch (err) {
      showNotice(err.message || 'Не удалось создать ссылку', 'error');
    } finally {
      setBusy('');
    }
  };

  const revokeShareLink = async (linkId) => {
    if (!window.confirm('Отозвать эту ссылку?')) return;
    setBusy(`link-${linkId}`);
    try {
      await api.revokeShareLink(uuid, linkId);
      setShareLinks((current) => current.map((link) => link.id === linkId ? { ...link, is_active: false } : link));
    } catch (err) {
      showNotice(err.message || 'Не удалось отозвать ссылку', 'error');
    } finally {
      setBusy('');
    }
  };

  const sendByEmail = async () => {
    const email = window.prompt('Email получателя протокола');
    if (!email?.trim()) return;
    setBusy('email');
    try {
      await api.distributeMeeting(uuid, {
        method: 'email', recipients: [email.trim()], include_transcript: false, custom_message: '',
      });
      showNotice(`Протокол отправлен на ${email.trim()}`);
    } catch (err) {
      showNotice(err.message || 'Не удалось отправить протокол', 'error');
    } finally {
      setBusy('');
    }
  };

  const restoreVersion = async (versionId) => {
    if (!window.confirm('Восстановить эту версию? Текущий текст сохранится в истории.')) return;
    setBusy(`version-${versionId}`);
    try {
      const result = await api.restoreProtocolVersion(uuid, versionId);
      setProtocolDraft(result.protocol_md || '');
      setMeeting((current) => ({ ...current, protocol_md: result.protocol_md }));
      await load();
      setActiveTab('protocol');
      showNotice('Версия восстановлена и синхронизирована с Google Drive');
    } catch (err) {
      showNotice(err.message || 'Не удалось восстановить версию', 'error');
    } finally {
      setBusy('');
    }
  };

  if (loading) return <div className="dash-loading"><div className="spinner spinner-lg" /><p>Загрузка встречи…</p></div>;

  if (error || !meeting) {
    return (
      <div className="dash-error">
        <AlertCircle size={48} strokeWidth={1.5} />
        <h3>Встреча не открылась</h3>
        <p>{error || 'Встреча не найдена'}</p>
        <Link className="btn btn-primary" to="/meetings"><ArrowLeft size={16} /> К списку</Link>
      </div>
    );
  }

  return (
    <div className="meeting-workspace">
      <div className="workspace-header">
        <div>
          <Link className="workspace-back" to="/meetings"><ArrowLeft size={15} /> Все встречи</Link>
          <h1>{meeting.topic || 'Без темы'}</h1>
          <div className="workspace-meta">
            <span><Calendar size={14} /> {formatDate(meeting.start_time || meeting.created_at)}</span>
            <span><Clock size={14} /> {formatDuration(meeting.duration_minutes)}</span>
            <span><Users size={14} /> {participants.length || '—'} участников</span>
          </div>
        </div>
        <div className="workspace-header-actions">
          {meeting.drive_folder_url && (
            <a className="btn btn-secondary" href={meeting.drive_folder_url} target="_blank" rel="noreferrer">
              <ExternalLink size={15} /> Google Drive
            </a>
          )}
          <button className="btn btn-secondary" onClick={load}><RefreshCw size={15} /> Обновить</button>
        </div>
      </div>

      {(meeting.protocol_stale || transcript?.protocol_stale) && (
        <div className="workspace-stale">
          <AlertTriangle size={18} />
          <div><strong>Транскрипт изменён после создания протокола.</strong><br />Проверьте правки и запустите перегенерацию вручную.</div>
          {canEdit && <button className="btn btn-primary btn-sm" onClick={regenerateProtocol}>Обновить протокол</button>}
        </div>
      )}

      {notice && <div className={noticeClass(notice.type)}>{notice.message}</div>}

      <div className="workspace-tabs" role="tablist">
        {TABS.map(({ id, label, icon }) => (
          <button key={id} className={activeTab === id ? 'active' : ''} onClick={() => setActiveTab(id)}>
            {createElement(icon, { size: 16 })} {label}
            {id === 'tasks' && tasks.length > 0 && <span>{tasks.length}</span>}
          </button>
        ))}
      </div>

      {activeTab === 'protocol' && (
        <div className="workspace-grid">
          <section className="workspace-panel workspace-panel-main">
            <div className="workspace-panel-title">
              <div><FileText size={17} /> Текст протокола</div>
              {canEdit && (
                <button className="btn btn-primary btn-sm" onClick={saveProtocol} disabled={busy === 'protocol'}>
                  <Save size={14} /> {busy === 'protocol' ? 'Сохранение…' : 'Сохранить'}
                </button>
              )}
            </div>
            {canEdit ? (
              <textarea className="protocol-editor" value={protocolDraft} onChange={(event) => setProtocolDraft(event.target.value)} />
            ) : (
              <div className="protocol-preview">{protocolDraft || 'Протокол ещё не создан'}</div>
            )}
          </section>

          <aside className="workspace-panel workspace-sidebar-panel">
            <h3>Шаблон и действия</h3>
            <label className="form-label">Шаблон протокола</label>
            <select className="form-input" value={selectedTemplate} onChange={(event) => setSelectedTemplate(event.target.value)} disabled={!canEdit}>
              {!templates.some((template) => template.id === selectedTemplate) && <option value={selectedTemplate}>{selectedTemplate}</option>}
              {templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
            </select>
            {canEdit && (
              <>
                <button className="btn btn-secondary workspace-action" onClick={saveTemplate} disabled={busy === 'template'}><Save size={14} /> Сохранить шаблон</button>
                <button className="btn btn-primary workspace-action" onClick={regenerateProtocol} disabled={busy === 'regenerate'}><RefreshCw size={14} /> {busy === 'regenerate' ? 'Создание…' : 'Перегенерировать'}</button>
                <button className="btn btn-secondary workspace-action" onClick={createShareLink} disabled={busy === 'share'}><Link2 size={14} /> Создать ссылку на 30 дней</button>
                <button className="btn btn-secondary workspace-action" onClick={sendByEmail} disabled={busy === 'email'}><Mail size={14} /> Отправить по email</button>
              </>
            )}
            <div className="workspace-side-note">
              Последнее обновление<br /><strong>{formatDate(meeting.protocol_generated_at)}</strong>
            </div>
            {shareLinks.length > 0 && (
              <div className="workspace-links">
                <strong>Публичные ссылки</strong>
                {shareLinks.map((link) => (
                  <div key={link.id}>
                    <span>{link.is_active === false ? 'Отозвана' : `до ${link.expires_at ? formatDate(link.expires_at) : 'без срока'}`}</span>
                    {link.is_active !== false && (
                      <button title="Отозвать" onClick={() => revokeShareLink(link.id)} disabled={busy === `link-${link.id}`}><Trash2 size={13} /></button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>
      )}

      {activeTab === 'transcript' && (
        <section className="workspace-panel">
          <div className="workspace-panel-title workspace-panel-title-wrap">
            <div><Mic size={17} /> Реплики и имена участников</div>
            {canEdit && (
              <button className="btn btn-primary btn-sm" onClick={saveTranscript} disabled={busy === 'transcript'}>
                <Save size={14} /> {busy === 'transcript' ? 'Сохранение…' : 'Сохранить в Drive'}
              </button>
            )}
          </div>
          {canEdit && (
            <div className="speaker-bulk-editor">
              <select className="form-input" value={renameFrom} onChange={(event) => setRenameFrom(event.target.value)}>
                <option value="">Кого заменить…</option>
                {speakers.map((speaker) => <option key={speaker} value={speaker}>{speaker}</option>)}
              </select>
              <input className="form-input" value={renameTo} onChange={(event) => setRenameTo(event.target.value)} placeholder="Правильное имя" />
              <button className="btn btn-secondary" onClick={bulkRename} disabled={!renameFrom || !renameTo.trim()}>Заменить во всей встрече</button>
            </div>
          )}
          {segments.length === 0 ? (
            <div className="workspace-empty">Текст транскрипта не найден. Ссылка на исходный файл доступна во вкладке «Файлы».</div>
          ) : (
            <div className="transcript-list">
              {segments.map((segment, index) => (
                <div className="transcript-row" key={segment.id || `${index}-${segment.start || ''}`}>
                  <div className="transcript-time">{formatTimecode(segment)}</div>
                  <div className="transcript-body">
                    {canEdit ? (
                      <input className="transcript-speaker" value={segment.speaker || ''} onChange={(event) => updateSegment(index, 'speaker', event.target.value)} />
                    ) : <strong>{segment.speaker || 'Участник'}</strong>}
                    {canEdit ? (
                      <textarea value={segment.text || ''} onChange={(event) => updateSegment(index, 'text', event.target.value)} />
                    ) : <p>{segment.text}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'participants' && (
        <section className="workspace-panel">
          <div className="workspace-panel-title"><div><Users size={17} /> Участники встречи</div></div>
          <div className="participant-grid">
            {participants.map((participant, index) => (
              <div className="participant-card" key={participant.id || `${participant.email}-${index}`}>
                <div className="participant-avatar">{(participant.name || participant.display_name || '?').slice(0, 1).toUpperCase()}</div>
                <div><strong>{participant.name || participant.display_name || 'Имя не определено'}</strong><span>{participant.email || 'Email не указан'}</span></div>
              </div>
            ))}
          </div>
          <div className="workspace-side-note">Исправление имени во вкладке «Транскрипт» обновляет все реплики и карточку участника. Запоминание голоса не выполняется без отдельного согласия.</div>
        </section>
      )}

      {activeTab === 'tasks' && (
        <section className="workspace-panel">
          <div className="workspace-panel-title"><div><ListTodo size={17} /> Задачи из протокола</div></div>
          {tasks.length === 0 ? <div className="workspace-empty">В протоколе не найдено задач</div> : (
            <div className="task-list">
              {tasks.map((task) => (
                <div className="task-row" key={task.id}>
                  <button
                    className={`task-check ${task.status === 'completed' ? 'done' : ''}`}
                    disabled={!canEdit || busy === `task-${task.id}`}
                    onClick={() => changeTaskStatus(task, task.status === 'completed' ? 'pending' : 'completed')}
                  >{task.status === 'completed' && <Check size={14} />}</button>
                  <div><strong>{task.description || task.title}</strong><span>{task.assignee || 'Исполнитель не указан'} · {task.due_at ? formatDate(task.due_at) : 'без срока'}</span></div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'files' && (
        <section className="workspace-panel">
          <div className="workspace-panel-title"><div><FolderOpen size={17} /> Файлы встречи</div></div>
          {files.length === 0 ? <div className="workspace-empty">Файлы в базе не зарегистрированы. Откройте папку Google Drive.</div> : (
            <div className="file-list">
              {files.map((file, index) => (
                <a key={file.id || `${file.type}-${index}`} href={file.url || file.drive_url} target="_blank" rel="noreferrer">
                  <FileText size={18} /><div><strong>{file.name || file.file_name || file.type}</strong><span>{file.type || file.file_type}</span></div><ExternalLink size={15} />
                </a>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'history' && (
        <section className="workspace-panel">
          <div className="workspace-panel-title"><div><History size={17} /> Версии протокола</div></div>
          {versions.length === 0 ? <div className="workspace-empty">История появится после первой правки или перегенерации</div> : (
            <div className="version-list">
              {versions.map((version) => (
                <div className="version-row" key={version.id}>
                  <div><strong>{version.source === 'regenerate' ? 'Перегенерация' : version.source === 'restore' ? 'Восстановление' : 'Ручная правка'}</strong><span>{formatDate(version.created_at)} · {version.author_email || `пользователь ${version.user_id || '—'}`} · {version.template || 'без шаблона'}</span></div>
                  {canEdit && <button className="btn btn-secondary btn-sm" onClick={() => restoreVersion(version.id)} disabled={busy === `version-${version.id}`}><RotateCcw size={13} /> Восстановить</button>}
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
