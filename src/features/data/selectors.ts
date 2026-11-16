/**
 * Pure selectors over the bootstrap read model. Keep them pure and testable;
 * screens call them via useBootstrapSelect or useMemo.
 */
import type { Bootstrap } from '@/types/bootstrap';
import type {
  Album,
  ComplaintStatus,
  MediaAsset,
  Poll,
  Property,
  Resident,
  RwaEvent,
} from '@/types/models';

const t = (iso: string) => Date.parse(iso);

export function upcomingEvents(b: Bootstrap, now = Date.now()): RwaEvent[] {
  return b.events.filter(e => t(e.endsAt) >= now).sort((a, c) => t(a.startsAt) - t(c.startsAt));
}

export function pastEvents(b: Bootstrap, now = Date.now()): RwaEvent[] {
  return b.events.filter(e => t(e.endsAt) < now).sort((a, c) => t(c.startsAt) - t(a.startsAt));
}

/** Pinned first, then newest; expired notices removed. */
export function activeAnnouncements(b: Bootstrap, now = Date.now()) {
  return b.announcements
    .filter(a => !a.expiresAt || t(a.expiresAt) > now)
    .sort((a, c) => Number(c.pinned) - Number(a.pinned) || t(c.publishedAt) - t(a.publishedAt));
}

export function residentName(r: Pick<Resident, 'firstName' | 'lastName'> | undefined | null): string {
  return r ? `${r.firstName} ${r.lastName}`.trim() : 'Resident';
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0]!.toUpperCase())
    .join('');
}

/** The resident's flat = primary mapping's property. */
export function flatOf(b: Bootstrap, residentId: string | undefined): Property | undefined {
  if (!residentId) return undefined;
  const m = b.mappings.find(x => x.residentId === residentId && x.isPrimary && !x.to) ??
    b.mappings.find(x => x.residentId === residentId);
  return m ? b.properties.find(p => p.id === m.propertyId) : undefined;
}

export function me(b: Bootstrap): Resident | undefined {
  return b.user ? b.residents.find(r => r.id === b.user!.residentId) : undefined;
}

/** RSVP counts (registrations may be anonymised — counting still works). */
export function rsvpSummary(b: Bootstrap, eventId: string) {
  const regs = b.registrations.filter(r => r.eventId === eventId);
  const going = regs.filter(r => r.status === 'Going');
  const people = going.reduce((s, r) => s + r.adults + r.children, 0);
  const ev = b.events.find(e => e.id === eventId);
  return {
    goingFamilies: going.length,
    maybeFamilies: regs.filter(r => r.status === 'Maybe').length,
    people,
    capacity: ev?.capacity ?? null,
    placesLeft: ev?.capacity ? Math.max(0, ev.capacity - people) : null,
  };
}

export function myRegistration(b: Bootstrap, eventId: string) {
  const rid = b.user?.residentId;
  return rid ? b.registrations.find(r => r.eventId === eventId && r.residentId === rid) : undefined;
}

export function albumMedia(b: Bootstrap, albumId: string): MediaAsset[] {
  return b.media.filter(m => m.albumId === albumId);
}

export function albumCover(b: Bootstrap, album: Album): MediaAsset | undefined {
  return b.media.find(m => m.id === album.coverAssetId) ?? b.media.find(m => m.albumId === album.id);
}

export function pollResults(b: Bootstrap, poll: Poll) {
  const responses = b.pollResponses.filter(r => r.pollId === poll.id);
  const total = responses.length;
  const options = [...poll.options]
    .sort((a, c) => a.sortOrder - c.sortOrder)
    .map(o => {
      const votes = responses.filter(r => r.optionId === o.id).length;
      return { ...o, votes, share: total ? votes / total : 0 };
    });
  const mine = b.user ? responses.find(r => r.residentId === b.user!.residentId) : undefined;
  return { total, options, myOptionId: mine?.optionId ?? null };
}

export function isPollOpen(p: Poll, now = Date.now()): boolean {
  return p.isActive && t(p.closesAt) > now;
}

export function unreadCount(b: Bootstrap): number {
  return b.notifications.filter(n => !n.read).length;
}

export function complaintCounts(b: Bootstrap): Record<ComplaintStatus, number> {
  const out: Record<ComplaintStatus, number> = { Open: 0, 'In Progress': 0, Resolved: 0, Closed: 0 };
  for (const c of b.complaints) out[c.status] += 1;
  return out;
}

/** Directory: other residents sorted by surname (server already applied privacy). */
export function directory(b: Bootstrap): (Resident & { flat?: Property })[] {
  return b.residents
    .filter(r => r.id !== b.user?.residentId && r.showInDirectory)
    // Contact details follow each resident's own privacy choices.
    .map(r => ({
      ...r,
      mobile: r.showPhone ? r.mobile : '',
      email: r.showEmail ? r.email ?? null : null,
      flat: flatOf(b, r.id),
    }))
    .sort((a, c) => a.lastName.localeCompare(c.lastName) || a.firstName.localeCompare(c.firstName));
}
