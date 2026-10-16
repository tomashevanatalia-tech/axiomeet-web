export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('ru-RU', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function formatDuration(minutes) {
  if (!minutes) return '—';
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  return hours ? `${hours} ч ${rest} мин` : `${rest} мин`;
}

export function formatTimecode(segment) {
  const raw = segment.start_seconds ?? segment.start ?? segment.start_time ?? null;
  if (raw === null || raw === undefined || raw === '') return '—';
  if (typeof raw === 'string' && raw.includes(':')) return raw;
  const total = Number(raw) > 100000 ? Math.floor(Number(raw) / 1000) : Math.floor(Number(raw));
  if (!Number.isFinite(total)) return '—';
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return [hours, minutes, seconds]
    .filter((_, index) => hours > 0 || index > 0)
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
}

