import { useState } from 'react';
import api from '../api';
import { createProtocolActions } from '../workspace/protocolActions';
import { createSharingActions } from '../workspace/sharingActions';
import { createTranscriptActions } from '../workspace/transcriptActions';

export default function useWorkspaceActions(uuid, workspace, setActiveTab) {
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState(null);
  const [renameFrom, setRenameFrom] = useState('');
  const [renameTo, setRenameTo] = useState('');
  const { setMeeting } = workspace;
  const showNotice = (message, type = 'success') => {
    setNotice({ message, type });
    window.setTimeout(() => setNotice(null), 5000);
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

  const feedback = { setBusy, showNotice };
  return {
    busy, notice, renameFrom, setRenameFrom, renameTo, setRenameTo, changeTaskStatus,
    ...createProtocolActions(uuid, workspace, { ...feedback, setActiveTab }),
    ...createSharingActions(uuid, workspace, feedback),
    ...createTranscriptActions(uuid, workspace, { ...feedback, renameFrom, renameTo, setRenameFrom, setRenameTo }),
  };
}
