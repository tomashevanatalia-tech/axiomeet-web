import api from '../api';

export function createTranscriptActions(uuid, workspace, { setBusy, showNotice, renameFrom, renameTo, setRenameFrom, setRenameTo }) {
  const { setMeeting, transcript, setTranscript, segments, setSegments, speakerRenames, setSpeakerRenames, error } = workspace;
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

  return { updateSegment, bulkRename, saveTranscript };
}
