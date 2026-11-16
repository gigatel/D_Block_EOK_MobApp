/**
 * Date formatting in IST (Asia/Kolkata, fixed UTC+05:30) without relying on
 * Intl time-zone support, so output is identical on Hermes, Android and iOS.
 */
const IST_MS = 330 * 60_000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

type Input = string | number | Date;
const toMs = (d: Input) => (d instanceof Date ? d.getTime() : typeof d === 'number' ? d : Date.parse(d));

/** Wall-clock IST parts. */
export function istParts(d: Input) {
  const x = new Date(toMs(d) + IST_MS);
  return {
    year: x.getUTCFullYear(),
    month: x.getUTCMonth(),
    day: x.getUTCDate(),
    weekday: x.getUTCDay(),
    hour: x.getUTCHours(),
    minute: x.getUTCMinutes(),
  };
}

const pad = (n: number) => String(n).padStart(2, '0');

/** "9:30 PM" */
export function formatTime(d: Input): string {
  const { hour, minute } = istParts(d);
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${pad(minute)} ${hour < 12 ? 'AM' : 'PM'}`;
}

/** "8 Nov 2026" */
export function formatDate(d: Input): string {
  const p = istParts(d);
  return `${p.day} ${MONTHS[p.month]} ${p.year}`;
}

/** "Sun, 8 Nov" */
export function formatDayShort(d: Input): string {
  const p = istParts(d);
  return `${DAYS[p.weekday]}, ${p.day} ${MONTHS[p.month]}`;
}

/** "Sunday, 8 November 2026" */
export function formatDateLong(d: Input): string {
  const p = istParts(d);
  return `${DAYS_LONG[p.weekday]}, ${p.day} ${MONTHS_LONG[p.month]} ${p.year}`;
}

/** "Sun, 8 Nov · 5:30 PM" */
export function formatDateTime(d: Input): string {
  return `${formatDayShort(d)} · ${formatTime(d)}`;
}

/** Badge parts for calendar tiles: { day: '08', month: 'NOV', weekday: 'SUN' }. */
export function dateBadge(d: Input) {
  const p = istParts(d);
  return { day: pad(p.day), month: MONTHS[p.month].toUpperCase(), weekday: DAYS[p.weekday].toUpperCase() };
}

export function isSameIstDay(a: Input, b: Input): boolean {
  const x = istParts(a);
  const y = istParts(b);
  return x.year === y.year && x.month === y.month && x.day === y.day;
}

/** "just now", "5 min ago", "3 h ago", "yesterday", "4 days ago", else a date. */
export function timeAgo(d: Input, now: Input = Date.now()): string {
  const diff = toMs(now) - toMs(d);
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h ago`;
  const days = Math.round(h / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  return formatDate(d);
}

/** "in 2 days", "tomorrow", "today", "in 3 h". */
export function timeUntil(d: Input, now: Input = Date.now()): string {
  const diff = toMs(d) - toMs(now);
  if (diff <= 0) return 'now';
  if (isSameIstDay(d, now)) {
    const h = Math.round(diff / 3_600_000);
    return h <= 1 ? 'within the hour' : `in ${h} h`;
  }
  // Count IST calendar days, not 24-hour blocks ("Sun 8 Nov" is "in 2 days" on Fri 6 Nov).
  const dayNo = (x: Input) => {
    const p = istParts(x);
    return Date.UTC(p.year, p.month, p.day) / 86_400_000;
  };
  const days = dayNo(d) - dayNo(now);
  return days === 1 ? 'tomorrow' : `in ${days} days`;
}

/** Part of day in IST for greetings. */
export function partOfDay(d: Input = Date.now()): 'morning' | 'afternoon' | 'evening' {
  const { hour } = istParts(d);
  return hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
}
