import WorkspaceProtocolPanel from '../components/workspace/WorkspaceProtocolPanel';
import WorkspaceTranscriptPanel from '../components/workspace/WorkspaceTranscriptPanel';
import WorkspaceParticipantsPanel from '../components/workspace/WorkspaceParticipantsPanel';
import WorkspaceTasksPanel from '../components/workspace/WorkspaceTasksPanel';
import WorkspaceFilesPanel from '../components/workspace/WorkspaceFilesPanel';
import WorkspaceHistoryPanel from '../components/workspace/WorkspaceHistoryPanel';
import { createElement, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import useWorkspaceActions from '../hooks/useWorkspaceActions';
import { formatDate, formatDuration } from '../workspace/formatting';
import { RESOURCE_LABELS } from '../workspace/resources';
import useMeetingWorkspace from '../hooks/useMeetingWorkspace';
import ProcessingProgress from '../components/workspace/ProcessingProgress';
import ResourceError from '../components/workspace/ResourceError';
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

function noticeClass(type) {
  if (type === 'success') return 'workspace-notice workspace-notice-success';
  if (type === 'warning') return 'workspace-notice workspace-notice-warning';
  return 'workspace-notice workspace-notice-error';
}

export default function MeetingWorkspacePage() {
  const { uuid } = useParams();
  return <MeetingWorkspace key={uuid} uuid={uuid} />;
}

function MeetingWorkspace({ uuid }) {
  const { user } = useAuth();
  const canEdit = ['owner', 'admin', 'member'].includes(user?.role);
  const [activeTab, setActiveTab] = useState('protocol');
  const workspace = useMeetingWorkspace(uuid);
  const { meeting, transcript, versions, templates, shareLinks, protocolDraft, setProtocolDraft, segments, selectedTemplate, setSelectedTemplate, loading, error, resourceErrors, retrying, retryResource, load, progressError } = workspace;
  const { busy, notice, renameFrom, setRenameFrom, renameTo, setRenameTo, saveProtocol, saveTemplate, regenerateProtocol, updateSegment, bulkRename, saveTranscript, changeTaskStatus, createShareLink, revokeShareLink, sendByEmail, restoreVersion } = useWorkspaceActions(uuid, workspace, setActiveTab);

  const resourceError = (name) => resourceErrors[name] && (
    <ResourceError label={RESOURCE_LABELS[name]} message={resourceErrors[name]}
      retrying={retrying[name]} onRetry={() => retryResource(name)} />
  );

  const speakers = useMemo(() => Array.from(new Set(
    segments.map((segment) => (segment.speaker || '').trim()).filter(Boolean)
  )).sort((a, b) => a.localeCompare(b, 'ru')), [segments]);

  const files = useMemo(() => meeting?.files || meeting?.generated_files || [], [meeting]);
  const participants = meeting?.participants || [];
  const tasks = meeting?.tasks || [];

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

      <ProcessingProgress processing={meeting.processing} error={progressError} />

      {(meeting.protocol_stale || transcript?.protocol_stale) && (
        <div className="workspace-stale">
          <AlertTriangle size={18} />
          <div><strong>Транскрипт изменён после создания протокола.</strong><br />Проверьте правки и запустите перегенерацию вручную.</div>
          {canEdit && <button className="btn btn-primary btn-sm" onClick={regenerateProtocol} disabled={Boolean(resourceErrors.templates)}>Обновить протокол</button>}
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

      {activeTab === 'protocol' && <WorkspaceProtocolPanel meeting={meeting} templates={templates} shareLinks={shareLinks} protocolDraft={protocolDraft} setProtocolDraft={setProtocolDraft} selectedTemplate={selectedTemplate} setSelectedTemplate={setSelectedTemplate} resourceErrors={resourceErrors} busy={busy} saveProtocol={saveProtocol} saveTemplate={saveTemplate} regenerateProtocol={regenerateProtocol} createShareLink={createShareLink} revokeShareLink={revokeShareLink} sendByEmail={sendByEmail} canEdit={canEdit} resourceError={resourceError} />}

      {activeTab === 'transcript' && <WorkspaceTranscriptPanel transcript={transcript} segments={segments} resourceErrors={resourceErrors} busy={busy} renameFrom={renameFrom} setRenameFrom={setRenameFrom} renameTo={renameTo} setRenameTo={setRenameTo} updateSegment={updateSegment} bulkRename={bulkRename} saveTranscript={saveTranscript} canEdit={canEdit} speakers={speakers} resourceError={resourceError} />}

      {activeTab === 'participants' && <WorkspaceParticipantsPanel participants={participants} />}

      {activeTab === 'tasks' && <WorkspaceTasksPanel busy={busy} changeTaskStatus={changeTaskStatus} tasks={tasks} canEdit={canEdit} />}

      {activeTab === 'files' && <WorkspaceFilesPanel files={files} />}

      {activeTab === 'history' && <WorkspaceHistoryPanel versions={versions} resourceErrors={resourceErrors} busy={busy} restoreVersion={restoreVersion} canEdit={canEdit} resourceError={resourceError} />}

    </div>
  );
}
