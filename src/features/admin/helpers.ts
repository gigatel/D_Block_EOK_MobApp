/** Pure helpers for admin screens (unit-tested). */
const IST_MS = 330 * 60_000;
const DAY = 86_400_000;

/** "Diwali Milan & Rangoli!" → "diwali-milan-rangoli" (≤ 60 chars). */
export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60)
      .replace(/-+$/g, '') || 'event'
  );
}

/** Makes `base` unique among `taken` by appending -2, -3 … */
export function uniqueSlug(base: string, taken: Iterable<string>): string {
  const set = new Set(taken);
  if (!set.has(base)) return base;
  let i = 2;
  while (set.has(`${base}-${i}`)) i += 1;
  return `${base}-${i}`;
}

/** IST calendar day key 'YYYY-MM-DD' for an instant. */
export function istDayKey(ms: number): string {
  return new Date(ms + IST_MS).toISOString().slice(0, 10);
}

/** Next `count` IST day keys starting today (or from a given instant). */
export function nextDays(count: number, from = Date.now()): string[] {
  return Array.from({ length: count }, (_, i) => istDayKey(from + i * DAY));
}

/** 'YYYY-MM-DD' + minutes after IST midnight → ISO UTC string. */
export function istToIso(dayKey: string, minutes: number): string {
  const [y, m, d] = dayKey.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, minutes) - IST_MS).toISOString();
}

/** ISO → { day: 'YYYY-MM-DD', minutes } in IST. */
export function isoToIst(iso: string): { day: string; minutes: number } {
  const x = new Date(Date.parse(iso) + IST_MS);
  return {
    day: x.toISOString().slice(0, 10),
    minutes: x.getUTCHours() * 60 + x.getUTCMinutes(),
  };
}

/** 30-minute steps from 6:00 to 23:30 (minutes after midnight). */
export const TIME_SLOTS = Array.from({ length: 36 }, (_, i) => 360 + i * 30);

export function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(1)} GB`;
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1000))} KB`;
}

/** Runs `worker` over items with at most `limit` in flight. */
export async function runPool<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  const queue = [...items];
  const runners = Array.from(
    { length: Math.min(limit, queue.length) },
    async () => {
      while (queue.length) {
        const next = queue.shift()!;
        await worker(next);
      }
    },
  );
  await Promise.all(runners);
}
