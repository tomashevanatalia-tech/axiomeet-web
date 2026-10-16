import { ExternalLink, FileText, FolderOpen } from 'lucide-react';

export default function WorkspaceFilesPanel({ files }) {
  return (
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
  );
}
