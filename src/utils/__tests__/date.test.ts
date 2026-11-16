import { dateBadge, formatDateTime, formatTime, isSameIstDay, partOfDay, timeAgo, timeUntil } from '../date';

// Fri 6 Nov 2026, 14:26 IST
const NOW = Date.parse('2026-11-06T08:56:00Z');

describe('IST date helpers', () => {
  it('formats in IST regardless of device time zone', () => {
    expect(formatTime('2026-11-08T12:00:00Z')).toBe('5:30 PM');
    expect(formatDateTime('2026-11-08T12:00:00Z')).toBe('Sun, 8 Nov · 5:30 PM');
    expect(dateBadge('2026-11-08T12:00:00Z')).toEqual({ day: '08', month: 'NOV', weekday: 'SUN' });
  });

  it('crosses midnight IST correctly', () => {
    // 19:00Z = 00:30 IST the next day
    expect(isSameIstDay('2026-11-06T19:00:00Z', '2026-11-07T05:00:00Z')).toBe(true);
    expect(isSameIstDay('2026-11-06T18:00:00Z', '2026-11-06T19:00:00Z')).toBe(false);
  });

  it('counts IST calendar days for "in N days"', () => {
    expect(timeUntil('2026-11-08T12:00:00Z', NOW)).toBe('in 2 days');
    expect(timeUntil('2026-11-07T03:00:00Z', NOW)).toBe('tomorrow');
    expect(timeUntil('2026-11-06T12:00:00Z', NOW)).toBe('in 3 h');
    expect(timeUntil('2026-11-01T12:00:00Z', NOW)).toBe('now');
  });

  it('describes the past', () => {
    expect(timeAgo(NOW - 30_000, NOW)).toBe('just now');
    expect(timeAgo(NOW - 5 * 60_000, NOW)).toBe('5 min ago');
    expect(timeAgo(NOW - 26 * 3600_000, NOW)).toBe('yesterday');
  });

  it('greets by IST part of day', () => {
    expect(partOfDay(NOW)).toBe('afternoon');
    expect(partOfDay('2026-11-06T14:00:00Z')).toBe('evening');
  });
});
