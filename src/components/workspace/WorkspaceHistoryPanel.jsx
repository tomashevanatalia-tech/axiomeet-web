import { History, RotateCcw } from 'lucide-react';
import { formatDate } from '../../workspace/formatting';

export default function WorkspaceHistoryPanel({ versions, resourceErrors, busy, restoreVersion, canEdit, resourceError }) {
  return (
        <section className="workspace-panel">
          <div className="workspace-panel-title"><div><History size={17} /> Версии протокола</div></div>
          {resourceErrors.versions ? resourceError('versions') : versions.length === 0 ? <div className="workspace-empty">История появится после первой правки или перегенерации</div> : (
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
  );
}
