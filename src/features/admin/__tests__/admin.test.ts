import {
  albumFormSchema,
  announcementFormSchema,
  eventFormSchema,
  fieldErrors,
} from '../schemas';
import {
  formatBytes,
  formatMinutes,
  isoToIst,
  istToIso,
  nextDays,
  runPool,
  slugify,
  uniqueSlug,
} from '../helpers';

describe('slug helpers', () => {
  it('slugifies titles', () => {
    expect(slugify('Diwali Milan & Rangoli Competition!')).toBe(
      'diwali-milan-and-rangoli-competition',
    );
    expect(slugify('  ')).toBe('event');
  });
  it('makes slugs unique', () => {
    expect(uniqueSlug('agm', ['agm', 'agm-2'])).toBe('agm-3');
    expect(uniqueSlug('new', ['agm'])).toBe('new');
  });
});

describe('IST date helpers', () => {
  it('round-trips IST day + minutes', () => {
    const iso = istToIso('2026-11-08', 17 * 60 + 30);
    expect(iso).toBe('2026-11-08T12:00:00.000Z');
    expect(isoToIst(iso)).toEqual({ day: '2026-11-08', minutes: 1050 });
  });
  it('lists consecutive days', () => {
    const days = nextDays(3, Date.parse('2026-11-06T20:00:00Z')); // 01:30 IST on 7 Nov
    expect(days).toEqual(['2026-11-07', '2026-11-08', '2026-11-09']);
  });
  it('formats minutes and bytes', () => {
    expect(formatMinutes(1050)).toBe('5:30 PM');
    expect(formatMinutes(0)).toBe('12:00 AM');
    expect(formatBytes(3_200_000)).toBe('3.2 MB');
  });
});

describe('runPool', () => {
  it('never exceeds the concurrency limit', async () => {
    let active = 0;
    let peak = 0;
    const done: number[] = [];
    await runPool([1, 2, 3, 4, 5], 2, async n => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise<void>(r => setTimeout(r, 5));
      done.push(n);
      active -= 1;
    });
    expect(peak).toBe(2);
    expect(done.sort()).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('announcementFormSchema', () => {
  const valid = {
    title: 'Water supply notice',
    category: 'Notice',
    visibility: 'Residents',
    pinned: false,
    body: 'Supply off on Saturday 10–4.',
    expiresAt: null,
  };
  it('accepts a valid form', () => {
    expect(announcementFormSchema.safeParse(valid).success).toBe(true);
  });
  it('rejects short titles and unknown categories', () => {
    const r = announcementFormSchema.safeParse({
      ...valid,
      title: 'Hi',
      category: 'Gossip',
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      const e = fieldErrors(r.error);
      expect(e.title).toMatch(/at least 5/);
      expect(e.category).toBeDefined();
    }
  });
});

describe('eventFormSchema', () => {
  const valid = {
    title: 'Diwali Milan',
    category: 'Festival',
    summary: 'Rangoli and dinner for all.',
    description: 'A long enough description.',
    venue: 'Central Park',
    startsAt: '2026-11-08T12:00:00Z',
    endsAt: '2026-11-08T16:30:00Z',
    registrationOpen: true,
    capacity: 200,
    isPublic: true,
    highlights: ['Rangoli'],
    coverImage: '',
  };
  it('accepts a valid event', () => {
    expect(eventFormSchema.safeParse(valid).success).toBe(true);
  });
  it('requires end after start', () => {
    const r = eventFormSchema.safeParse({ ...valid, endsAt: valid.startsAt });
    expect(r.success).toBe(false);
    if (!r.success)
      expect(fieldErrors(r.error).endsAt).toMatch(/after the start/);
  });
  it('limits summary length and validates capacity / cover URL', () => {
    const r = eventFormSchema.safeParse({
      ...valid,
      summary: 'x'.repeat(301),
      capacity: -5,
      coverImage: 'not a url',
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      const e = fieldErrors(r.error);
      expect(e.summary).toBeDefined();
      expect(e.capacity).toBeDefined();
      expect(e.coverImage).toBeDefined();
    }
  });
});

describe('albumFormSchema', () => {
  it('validates visibility and year', () => {
    expect(
      albumFormSchema.safeParse({
        title: 'Holi 2027',
        description: '',
        year: 2027,
        visibility: 'Committee',
      }).success,
    ).toBe(true);
    expect(
      albumFormSchema.safeParse({
        title: 'Holi',
        description: '',
        year: 1990,
        visibility: 'Secret',
      }).success,
    ).toBe(false);
  });
});

import { daysInMonth, describeWindow, istIso } from '../themeHelpers';

describe('theme helpers', () => {
  it('describes yearly and one-off windows in IST', () => {
    expect(
      describeWindow({
        startsAt: '2025-11-30T18:30:00Z',
        endsAt: '2026-01-31T18:30:00Z',
        recurrence: 'Yearly',
      }),
    ).toBe('Every year · 1 Dec – 31 Jan');
    expect(
      describeWindow({
        startsAt: '2026-10-31T18:30:00Z',
        endsAt: '2026-11-14T18:30:00Z',
        recurrence: 'None',
      }),
    ).toBe('1 Nov 2026 – 14 Nov 2026');
  });
  it('computes month lengths and IST instants', () => {
    expect(daysInMonth(2028, 1)).toBe(29);
    expect(daysInMonth(2026, 10)).toBe(30);
    expect(istIso(2026, 10, 8, 20)).toBe('2026-11-08T14:30:00.000Z');
  });
});
