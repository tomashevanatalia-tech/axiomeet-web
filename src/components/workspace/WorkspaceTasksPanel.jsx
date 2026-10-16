import { Check, ListTodo } from 'lucide-react';
import { formatDate } from '../../workspace/formatting';

export default function WorkspaceTasksPanel({ busy, changeTaskStatus, tasks, canEdit }) {
  return (
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
  );
}
