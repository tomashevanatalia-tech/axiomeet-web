import { FileText, Link2, Mail, RefreshCw, Save, Trash2 } from 'lucide-react';
import { formatDate } from '../../workspace/formatting';

export default function WorkspaceProtocolPanel({ meeting, templates, shareLinks, protocolDraft, setProtocolDraft, selectedTemplate, setSelectedTemplate, resourceErrors, busy, saveProtocol, saveTemplate, regenerateProtocol, createShareLink, revokeShareLink, sendByEmail, canEdit, resourceError }) {
  return (
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
            {resourceError('templates')}
            <label className="form-label">Шаблон протокола</label>
            <select className="form-input" value={selectedTemplate} onChange={(event) => setSelectedTemplate(event.target.value)} disabled={!canEdit || Boolean(resourceErrors.templates)}>
              {!templates.some((template) => template.id === selectedTemplate) && <option value={selectedTemplate}>{selectedTemplate}</option>}
              {templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
            </select>
            {canEdit && (
              <>
                <button className="btn btn-secondary workspace-action" onClick={saveTemplate} disabled={busy === 'template' || Boolean(resourceErrors.templates)}><Save size={14} /> Сохранить шаблон</button>
                <button className="btn btn-primary workspace-action" onClick={regenerateProtocol} disabled={busy === 'regenerate' || Boolean(resourceErrors.templates)}><RefreshCw size={14} /> {busy === 'regenerate' ? 'Создание…' : 'Перегенерировать'}</button>
                <button className="btn btn-secondary workspace-action" onClick={createShareLink} disabled={busy === 'share'}><Link2 size={14} /> Создать ссылку на 30 дней</button>
                <button className="btn btn-secondary workspace-action" onClick={sendByEmail} disabled={busy === 'email'}><Mail size={14} /> Отправить по email</button>
              </>
            )}
            <div className="workspace-side-note">
              Последнее обновление<br /><strong>{formatDate(meeting.protocol_generated_at)}</strong>
            </div>
            {resourceError('shareLinks')}
            {!resourceErrors.shareLinks && shareLinks.length > 0 && (
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
  );
}
