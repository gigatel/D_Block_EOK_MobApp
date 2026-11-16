/**
 * Domain models mirroring the ASP.NET Core API (camelCase JSON).
 * Source of truth: backend/src/DBlockEok.Application/Contracts/Dtos.cs on the server.
 * Dates: ISO-8601 UTC strings (DateTime) or 'YYYY-MM-DD' (DateOnly).
 */

// ---- Enumerations (wire values, §8.1) -------------------------------------
export const RESIDENT_TYPES = ['Owner', 'Tenant', 'Family'] as const;
export type ResidentType = (typeof RESIDENT_TYPES)[number];

export const FLOORS = ['Ground', 'First', 'Second', 'Third', 'Full'] as const;
export type Floor = (typeof FLOORS)[number];

export const OCCUPANCIES = ['Owner-occupied', 'Rented', 'Vacant'] as const;
export type Occupancy = (typeof OCCUPANCIES)[number];

export const EVENT_CATEGORIES = [
  'Festival',
  'National',
  'Community',
  'Health',
  'Meeting',
  'Sports',
  'Cultural',
] as const;
export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export const RSVP_STATUSES = ['Going', 'Maybe', 'NotGoing'] as const;
export type RsvpStatus = (typeof RSVP_STATUSES)[number];

export const ANNOUNCEMENT_CATEGORIES = [
  'Notice',
  'Circular',
  'Maintenance',
  'Security',
  'Event',
  'General',
] as const;
export type AnnouncementCategory = (typeof ANNOUNCEMENT_CATEGORIES)[number];

export type AnnouncementVisibility = 'Public' | 'Residents';
export type MediaVisibility = 'Public' | 'Residents' | 'Committee';
export type MediaKind = 'image' | 'video';
export type MediaProcessingStatus = 'Queued' | 'Processing' | 'Ready' | 'Failed';

export const COMPLAINT_CATEGORIES = [
  'Security',
  'Sanitation',
  'Electricity',
  'Water',
  'Parking',
  'Park & Greenery',
  'Noise',
  'Other',
] as const;
export type ComplaintCategory = (typeof COMPLAINT_CATEGORIES)[number];

export const COMPLAINT_STATUSES = [
  'Open',
  'In Progress',
  'Resolved',
  'Closed',
] as const;
export type ComplaintStatus = (typeof COMPLAINT_STATUSES)[number];

export const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const CONTACT_CATEGORIES = [
  'Emergency',
  'RWA Office',
  'Utilities',
  'Medical',
  'Services',
] as const;
export type ContactCategory = (typeof CONTACT_CATEGORIES)[number];

export type ThemeStatus = 'Draft' | 'Published' | 'Archived';
export type Recurrence = 'None' | 'Yearly';
export type ThemeLogAction =
  | 'Activated'
  | 'Deactivated'
  | 'Restored default'
  | 'Preview started'
  | 'Published';
export type SmsStatus = 'Pending' | 'Sent' | 'Failed';

export const WEATHER_TRIGGERS = [
  'rain',
  'storm',
  'fog',
  'heat',
  'cold',
  'clear',
] as const;
export type WeatherTrigger = (typeof WEATHER_TRIGGERS)[number];
export type WeatherCondition = WeatherTrigger | 'cloudy';

export const PERMISSIONS = [
  'dashboard.view',
  'residents.manage',
  'events.manage',
  'media.upload',
  'albums.manage',
  'announcements.manage',
  'themes.manage',
  'themes.publish',
  'complaints.manage',
  'polls.manage',
  'users.manage',
  'audit.view',
  'settings.manage',
] as const;
export type Permission = (typeof PERMISSIONS)[number];

export type RoleKey = 'SuperAdmin' | 'Admin' | 'Editor' | 'Resident';

export type NotificationCategory =
  | 'general'
  | 'announcements'
  | 'events'
  | 'complaints'
  | 'polls'
  | 'theme';

// ---- Entities ---------------------------------------------------------------
export type SessionUser = {
  id: string;
  residentId: string;
  name: string;
  mobile: string;
  roles: RoleKey[];
  permissions: Permission[];
  twoStep?: boolean;
};

export type Resident = {
  id: string;
  firstName: string;
  lastName: string;
  mobile: string;
  email?: string | null;
  type: ResidentType;
  occupation?: string | null;
  bloodGroup?: string | null;
  joinedOn: string;
  showInDirectory: boolean;
  showPhone: boolean;
  showEmail: boolean;
  avatarColor: string;
  /** Server wire shape: the directory flags live here; the app also mirrors them top-level. */
  privacy?: { smsAlerts?: boolean; showInDirectory?: boolean; showPhone?: boolean; showEmail?: boolean };
  profile?: ResidentProfile | null;
};

export type ResidentProfile = {
  dateOfBirth?: string;
  gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  alternateMobile?: string;
  whatsappNumber?: string;
  emergencyContact?: { name: string; relation?: string; phone: string };
  householdSize?: number;
  moveInDate?: string;
  familyMembers: { name: string; relation?: string; yearOfBirth?: number }[];
  vehicles: {
    type: 'Car' | 'Two-wheeler' | 'Bicycle' | 'Other';
    number: string;
    model?: string;
    colour?: string;
    stickerNo?: string;
  }[];
  domesticStaff: {
    name: string;
    role: string;
    phone?: string;
    livesIn: boolean;
    policeVerification: { status: string; date?: string };
  }[];
  pets: { type: 'Dog' | 'Cat' | 'Bird' | 'Other'; name?: string; breed?: string }[];
  policeVerification: { status: string; date?: string; reference?: string };
};

export type Property = {
  id: string;
  houseNo: string;
  floor: Floor;
  areaSqYd: number;
  parkingSlots: number;
  occupancy: Occupancy;
};

export type ResidentPropertyMapping = {
  id: string;
  residentId: string;
  propertyId: string;
  relation: ResidentType;
  isPrimary: boolean;
  from: string;
  to?: string | null;
};

export type RwaEvent = {
  id: string;
  slug: string;
  title: string;
  category: EventCategory;
  summary: string;
  description: string;
  venue: string;
  startsAt: string;
  endsAt: string;
  coverImage: string;
  registrationOpen: boolean;
  capacity?: number | null;
  isPublic: boolean;
  albumId?: string | null;
  highlights: string[];
};

export type EventRegistration = {
  id: string;
  eventId: string;
  residentId: string;
  status: RsvpStatus;
  adults: number;
  children: number;
  note?: string | null;
  createdAt?: string | null;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  category: AnnouncementCategory;
  visibility: AnnouncementVisibility;
  pinned: boolean;
  publishedAt: string;
  expiresAt?: string | null;
  author: string;
  attachmentName?: string | null;
};

export type Album = {
  id: string;
  slug: string;
  title: string;
  description: string;
  eventId?: string | null;
  year: number;
  coverAssetId?: string | null;
  visibility: MediaVisibility;
  createdAt?: string | null;
};

export type MediaAsset = {
  id: string;
  albumId: string;
  kind: MediaKind;
  title: string;
  url: string;
  thumbUrl: string;
  posterUrl?: string | null;
  width?: number | null;
  height?: number | null;
  durationSec?: number | null;
  sizeBytes: number;
  status: MediaProcessingStatus;
  uploadedBy: string;
  uploadedAt: string;
};

export type Complaint = {
  id: string;
  ticketNo: string;
  residentId: string;
  category: ComplaintCategory;
  subject: string;
  description: string;
  priority: Priority;
  status: ComplaintStatus;
  assignedTo?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ComplaintUpdate = {
  id: string;
  complaintId: string;
  author: string;
  message: string;
  statusChange?: ComplaintStatus | null;
  createdAt: string;
};

export type Poll = {
  id: string;
  question: string;
  description?: string | null;
  closesAt: string;
  isActive: boolean;
  options: { id: string; label: string; sortOrder: number }[];
  createdAt?: string | null;
};

export type PollResponse = {
  id: string;
  pollId: string;
  optionId: string;
  residentId: string;
  createdAt?: string | null;
};

export type AppNotification = {
  id: string;
  residentId?: string | null;
  title: string;
  message: string;
  link?: string | null;
  category: NotificationCategory;
  createdAt: string;
  read: boolean;
};

export type AuditLog = {
  id: string;
  at: string;
  actor: string;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: string | null;
};

export type CommitteeMember = {
  id: string;
  name: string;
  designation: string;
  houseNo: string;
  phone: string;
  since: number;
  avatarColor: string;
  sortOrder: number;
};

export type ImportantContact = {
  id: string;
  name: string;
  category: ContactCategory;
  phone: string;
  notes?: string | null;
  sortOrder: number;
};

export type SystemSettings = {
  siteName: string;
  tagline: string;
  address: string;
  email: string;
  phone: string;
  officeHours: string;
  whatsappGroupInfo?: string | null;
  otpExpiryMinutes: number;
  otpMaxAttempts: number;
  maxUploadMb: number;
  allowResidentDirectory: boolean;
  maintenanceBanner?: string | null;
  showWeather: boolean;
  weatherThemesEnabled: boolean;
};

export type Weather = {
  condition: WeatherCondition;
  temperatureC: number;
  summary: string;
};

export type SmsLog = {
  id: string;
  mobile: string;
  purpose: string;
  status: SmsStatus;
  createdAt: string;
  sentAt?: string | null;
  error?: string | null;
};
