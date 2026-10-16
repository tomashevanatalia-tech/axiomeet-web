import { Mic, Save } from 'lucide-react';
import { formatTimecode } from '../../workspace/formatting';

export default function WorkspaceTranscriptPanel({ segments, resourceErrors, busy, renameFrom, setRenameFrom, renameTo, setRenameTo, updateSegment, bulkRename, saveTranscript, canEdit, speakers, resourceError }) {
  return (
        <section className="workspace-panel">
          <div className="workspace-panel-title workspace-panel-title-wrap">
            <div><Mic size={17} /> Реплики и имена участников</div>
            {canEdit && (
              <button className="btn btn-primary btn-sm" onClick={saveTranscript} disabled={busy === 'transcript' || Boolean(resourceErrors.transcript)}>
                <Save size={14} /> {busy === 'transcript' ? 'Сохранение…' : 'Сохранить в Drive'}
              </button>
            )}
          </div>
          {!resourceErrors.transcript && canEdit && (
            <div className="speaker-bulk-editor">
              <select className="form-input" value={renameFrom} onChange={(event) => setRenameFrom(event.target.value)}>
                <option value="">Кого заменить…</option>
                {speakers.map((speaker) => <option key={speaker} value={speaker}>{speaker}</option>)}
              </select>
              <input className="form-input" value={renameTo} onChange={(event) => setRenameTo(event.target.value)} placeholder="Правильное имя" />
              <button className="btn btn-secondary" onClick={bulkRename} disabled={!renameFrom || !renameTo.trim()}>Заменить во всей встрече</button>
            </div>
          )}
          {resourceErrors.transcript ? resourceError('transcript') : segments.length === 0 ? (
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
  );
}
