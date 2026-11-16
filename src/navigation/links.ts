import type { RootStackParamList } from './types';

/**
 * Maps server/notification links (e.g. "/events/diwali-milan") to app routes.
 * Shared by in-app notifications, push taps and deep links. Unknown links are ignored.
 */
export function routeForLink(link: string | null | undefined):
  | { [K in keyof RootStackParamList]: { name: K; params: RootStackParamList[K] } }[keyof RootStackParamList]
  | null {
  if (!link) return null;
  const path = link.replace(/^https?:\/\/[^/]+/, '').replace(/^dblockeok:\/\//, '/');
  const [, section, id] = path.split('/');
  switch (section) {
    case 'events':
      return id ? { name: 'EventDetail', params: { slug: id } } : { name: 'Tabs', params: { screen: 'Events' } };
    case 'announcements':
      return id ? { name: 'AnnouncementDetail', params: { id } } : { name: 'Tabs', params: { screen: 'Notices' } };
    case 'complaints':
      return id ? { name: 'ComplaintDetail', params: { id } } : { name: 'Complaints', params: undefined };
    case 'polls':
      return id ? { name: 'PollDetail', params: { id } } : { name: 'Polls', params: undefined };
    case 'gallery':
    case 'albums':
      return id ? { name: 'AlbumDetail', params: { albumId: id } } : { name: 'Tabs', params: { screen: 'Gallery' } };
    case 'notifications':
      return { name: 'Notifications', params: undefined };
    default:
      return null;
  }
}

/** Accepts any navigation object (useNavigation() result works as-is). */
export function openLink(navigation: { navigate: (...args: never[]) => void }, link: string | null | undefined): boolean {
  const route = routeForLink(link);
  if (!route) return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (navigation.navigate as any)(route.name, route.params);
  return true;
}
