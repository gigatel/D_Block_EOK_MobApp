import type { ThemeAsset, ThemeDefinition, ThemeSchedule } from '@/theme/types';
import type {
  Album,
  Announcement,
  AppNotification,
  AuditLog,
  CommitteeMember,
  Complaint,
  ComplaintUpdate,
  EventRegistration,
  ImportantContact,
  MediaAsset,
  Poll,
  PollResponse,
  Property,
  Resident,
  ResidentPropertyMapping,
  RwaEvent,
  SessionUser,
  SystemSettings,
  Weather,
} from './models';

/**
 * Shape of GET /api/bootstrap (BootstrapDto). Already filtered server-side by
 * the caller's role, album permissions and privacy settings.
 */
export type Bootstrap = {
  user: SessionUser | null;
  residents: Resident[];
  properties: Property[];
  mappings: ResidentPropertyMapping[];
  events: RwaEvent[];
  registrations: EventRegistration[];
  announcements: Announcement[];
  albums: Album[];
  media: MediaAsset[];
  complaints: Complaint[];
  complaintUpdates: ComplaintUpdate[];
  polls: Poll[];
  pollResponses: PollResponse[];
  notifications: AppNotification[];
  audit: AuditLog[];
  committee: CommitteeMember[];
  contacts: ImportantContact[];
  themes: ThemeDefinition[];
  themeAssets: ThemeAsset[];
  themeSchedules: ThemeSchedule[];
  settings: SystemSettings;
  serverTime: string;
  demoMode: boolean;
  weather: Weather | null;
};

/** Collections writable through PUT/DELETE /api/{collection}/{id}. */
export type Collection =
  | 'residents'
  | 'events'
  | 'registrations'
  | 'announcements'
  | 'albums'
  | 'media'
  | 'complaints'
  | 'complaint-updates'
  | 'polls'
  | 'poll-responses'
  | 'notifications'
  | 'themes'
  | 'theme-schedules';
