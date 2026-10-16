import { Users } from 'lucide-react';

export default function WorkspaceParticipantsPanel({ participants }) {
  return (
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
  );
}
