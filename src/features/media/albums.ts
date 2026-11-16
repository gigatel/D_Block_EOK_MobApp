import type { Bootstrap } from '@/types/bootstrap';
import type { Album } from '@/types/models';

export type AlbumOption = { album: Album; eventTitle?: string; subtitle: string };

const time = (a: Album) => (a.createdAt ? Date.parse(a.createdAt) || 0 : 0);

/**
 * Albums for the upload picker: newest first (year, then createdAt), labelled
 * with the festival/event they belong to.
 */
export function recentAlbumOptions(b: Pick<Bootstrap, 'albums' | 'events'>): AlbumOption[] {
  const events = new Map(b.events.map(e => [e.id, e.title]));
  return [...b.albums]
    .sort((x, y) => y.year - x.year || time(y) - time(x))
    .map(album => {
      const eventTitle = album.eventId ? events.get(album.eventId) : undefined;
      const subtitle = [eventTitle, String(album.year), album.visibility].filter(Boolean).join(' · ');
      return { album, eventTitle, subtitle };
    });
}
