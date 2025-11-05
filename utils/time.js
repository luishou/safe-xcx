function formatBeijing(value) {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) {
    // 已是目标格式，直接返回
    return value;
  }
  try {
    const date = new Date(value);
    let t = date.getTime();
    // 如果是ISO字符串（包含Z表示UTC），转换为东八区
    if (typeof value === 'string' && /Z$/.test(value)) {
      t += 8 * 60 * 60 * 1000;
    }
    const d = new Date(t);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    const h = String(d.getUTCHours()).padStart(2, '0');
    const min = String(d.getUTCMinutes()).padStart(2, '0');
    const s = String(d.getUTCSeconds()).padStart(2, '0');
    return `${y}-${m}-${day} ${h}:${min}:${s}`;
  } catch (e) {
    return '';
  }
}

module.exports = { formatBeijing };