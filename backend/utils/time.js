function formatDateTimeBeijing(value) {
  if (!value) return '';
  const date = new Date(value);
  if (isNaN(date.getTime())) return '';

  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(date);

  const get = (type) => parts.find((p) => p.type === type)?.value || '';
  const y = get('year');
  const m = get('month');
  const d = get('day');
  const h = get('hour');
  const min = get('minute');
  const s = get('second');

  return `${y}-${m}-${d} ${h}:${min}:${s}`;
}

module.exports = { formatDateTimeBeijing };