import type { ThemeSchedule } from '@/theme/types';
import { formatDate, formatTime, istParts } from '@/utils/date';

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/** Human description of a schedule window in IST. End is exclusive (midnight → previous day). */
export function describeWindow(
  s: Pick<ThemeSchedule, 'startsAt' | 'endsAt' | 'recurrence'>,
): string {
  const start = Date.parse(s.startsAt);
  const endIncl = Date.parse(s.endsAt) - 60_000;
  const a = istParts(start);
  const b = istParts(endIncl);
  const midnightStart = a.hour === 0 && a.minute === 0;
  const startTime = midnightStart ? '' : ` ${formatTime(start)}`;
  if (s.recurrence === 'Yearly') {
    return `Every year · ${a.day} ${MONTHS[a.month]}${startTime} – ${b.day} ${
      MONTHS[b.month]
    }`;
  }
  return `${formatDate(start)}${startTime} – ${formatDate(endIncl)}`;
}

/** Days in a month (month 0–11). */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

/** IST wall-clock → ISO UTC. */
export function istIso(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute = 0,
): string {
  return new Date(
    Date.UTC(year, month, day, hour, minute) - 330 * 60_000,
  ).toISOString();
}
