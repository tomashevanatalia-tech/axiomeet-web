import api from '../api';

export function createSharingActions(uuid, workspace, { setBusy, showNotice }) {
  const { shareLinks, setShareLinks, error, setResourceErrors } = workspace;
  const createShareLink = async () => {
    setBusy('share');
    try {
      const result = await api.createShareLink(uuid, 30);
      const link = result.link || result;
      if (link.url) {
        await navigator.clipboard.writeText(link.url).catch(() => {});
        showNotice('Публичная ссылка на 30 дней создана и скопирована');
      }
      const data = await api.listShareLinks(uuid);
      setShareLinks(data.links || []);
      setResourceErrors((current) => ({ ...current, shareLinks: null }));
    } catch (err) {
      showNotice(err.message || 'Не удалось создать ссылку', 'error');
    } finally {
      setBusy('');
    }
  };

  const revokeShareLink = async (linkId) => {
    if (!window.confirm('Отозвать эту ссылку?')) return;
    setBusy(`link-${linkId}`);
    try {
      await api.revokeShareLink(uuid, linkId);
      setShareLinks((current) => current.map((link) => link.id === linkId ? { ...link, is_active: false } : link));
    } catch (err) {
      showNotice(err.message || 'Не удалось отозвать ссылку', 'error');
    } finally {
      setBusy('');
    }
  };

  const sendByEmail = async () => {
    const email = window.prompt('Email получателя протокола');
    if (!email?.trim()) return;
    setBusy('email');
    try {
      await api.distributeMeeting(uuid, {
        method: 'email', recipients: [email.trim()], include_transcript: false, custom_message: '',
      });
      showNotice(`Протокол отправлен на ${email.trim()}`);
    } catch (err) {
      showNotice(err.message || 'Не удалось отправить протокол', 'error');
    } finally {
      setBusy('');
    }
  };

  return { createShareLink, revokeShareLink, sendByEmail };
}
