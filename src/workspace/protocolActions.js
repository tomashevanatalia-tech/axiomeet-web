import api from '../api';

export function createProtocolActions(uuid, workspace, { setBusy, showNotice, setActiveTab }) {
  const { setMeeting, versions, setVersions, templates, protocolDraft, setProtocolDraft, selectedTemplate, error, setResourceErrors, load } = workspace;
  const refreshHistory = async () => {
    try {
      const history = await api.getProtocolVersions(uuid);
      setVersions(history.versions || []);
      setResourceErrors((current) => ({ ...current, versions: null }));
    } catch (err) {
      setResourceErrors((current) => ({ ...current, versions: err.message || 'Ошибка загрузки' }));
    }
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
      await refreshHistory();
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
      await refreshHistory();
      showNotice('Новый протокол создан и сохранён. Предыдущая версия доступна в истории.');
    } catch (err) {
      showNotice(err.message || 'Не удалось перегенерировать протокол', 'error');
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

  return { saveProtocol, saveTemplate, regenerateProtocol, restoreVersion };
}
