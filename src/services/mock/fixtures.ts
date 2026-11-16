/**
 * MOCK DATA — realistic but entirely fictional D Block, East of Kailash data.
 * Phone numbers use the fake 900000xxxx range. Never mix with real resident data.
 * Dates are relative to "now" so the demo always has upcoming events.
 */
import type { Bootstrap } from '@/types/bootstrap';
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
  SmsLog,
  SystemSettings,
} from '@/types/models';
import { MOCK_THEMES, MOCK_THEME_SCHEDULES } from './themes';

const DAY = 86_400_000;
const IST = 330 * 60_000;
/** ISO string for (today in IST + days) at hh:mm IST. */
export function istAt(days: number, hh = 10, mm = 0): string {
  const nowIst = new Date(Date.now() + IST);
  const t =
    Date.UTC(nowIst.getUTCFullYear(), nowIst.getUTCMonth(), nowIst.getUTCDate(), hh, mm) -
    IST +
    days * DAY;
  return new Date(t).toISOString();
}
const dateOnly = (iso: string) => iso.slice(0, 10);
export const photo = (seed: string, w = 1200, h = 800) =>
  `https://picsum.photos/seed/dbeok-${seed}/${w}/${h}`;

// ---- Residents & flats --------------------------------------------------------
const people: [string, string, Resident['type'], string, string?][] = [
  ['Anjali', 'Sharma', 'Owner', 'Architect', 'B+'],
  ['Rajesh', 'Malhotra', 'Owner', 'Chartered Accountant', 'O+'],
  ['Priya', 'Kapoor', 'Owner', 'School Principal', 'A+'],
  ['Vikram', 'Sethi', 'Owner', 'Retired Colonel', 'AB+'],
  ['Meera', 'Bhatia', 'Tenant', 'Doctor (Paediatrics)', 'O-'],
  ['Arjun', 'Khanna', 'Owner', 'Software Engineer', 'B+'],
  ['Sunita', 'Arora', 'Family', 'Homemaker', 'A-'],
  ['Harpreet', 'Singh', 'Owner', 'Businessman', 'O+'],
  ['Neha', 'Gupta', 'Tenant', 'Marketing Manager', 'B-'],
  ['Kabir', 'Mehra', 'Family', 'Student', 'A+'],
  ['Ritu', 'Chopra', 'Owner', 'Lawyer', 'AB-'],
  ['Sanjay', 'Verma', 'Owner', 'Retired Banker', 'O+'],
  ['Farah', 'Siddiqui', 'Tenant', 'Journalist', 'B+'],
  ['Deepak', 'Bansal', 'Owner', 'Pharmacist', 'A+'],
  ['Kavita', 'Joshi', 'Family', 'Yoga Instructor', 'O+'],
  ['Amit', 'Tandon', 'Owner', 'Consultant', 'B+'],
  ['Shalini', 'Saxena', 'Tenant', 'Professor', 'A-'],
  ['Rohan', 'Dutta', 'Owner', 'Photographer', 'O-'],
];
const avatarPalette = ['#1F5A3A', '#7A1E2C', '#13306B', '#9A4A12', '#2D4F6C', '#5E6B12', '#B0186A', '#4A5560'];

export const residents: Resident[] = people.map(([first, last, type, occupation, blood], i) => ({
  id: `r-${String(i + 1).padStart(3, '0')}`,
  firstName: first,
  lastName: last,
  mobile: `90000001${String(i + 1).padStart(2, '0')}`,
  email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
  type,
  occupation,
  bloodGroup: blood ?? null,
  joinedOn: dateOnly(istAt(-(400 + i * 97))),
  showInDirectory: i % 5 !== 3,
  showPhone: i % 3 !== 1,
  showEmail: i % 4 === 0,
  avatarColor: avatarPalette[i % avatarPalette.length],
  privacy: { smsAlerts: i % 2 === 0 },
  profile: null,
}));

residents[0].profile = {
  dateOfBirth: '1984-03-12',
  gender: 'Female',
  whatsappNumber: '9000000101',
  emergencyContact: { name: 'Karan Sharma', relation: 'Spouse', phone: '9000000190' },
  householdSize: 4,
  moveInDate: '2016-06-01',
  familyMembers: [
    { name: 'Karan Sharma', relation: 'Spouse', yearOfBirth: 1981 },
    { name: 'Aarav Sharma', relation: 'Son', yearOfBirth: 2012 },
    { name: 'Ishita Sharma', relation: 'Daughter', yearOfBirth: 2016 },
  ],
  vehicles: [
    { type: 'Car', number: 'DL3CAB1234', model: 'Honda City', colour: 'White', stickerNo: 'D-042-1' },
    { type: 'Two-wheeler', number: 'DL3SBX7781', model: 'Activa', colour: 'Grey' },
  ],
  domesticStaff: [
    { name: 'Sunita Devi', role: 'Maid', livesIn: false, policeVerification: { status: 'Verified', date: '2025-08-02' } },
  ],
  pets: [{ type: 'Dog', name: 'Bruno', breed: 'Indie' }],
  policeVerification: { status: 'Not required' },
};

const houseNos = ['D-12', 'D-14', 'D-17', 'D-21', 'D-23', 'D-28', 'D-31', 'D-35', 'D-38', 'D-42', 'D-45', 'D-49', 'D-53', 'D-56', 'D-60', 'D-64', 'D-67', 'D-71'];
const floors: Property['floor'][] = ['Ground', 'First', 'Second', 'Third', 'Full'];
export const properties: Property[] = houseNos.map((h, i) => ({
  id: `p-${String(i + 1).padStart(3, '0')}`,
  houseNo: h,
  floor: floors[i % floors.length],
  areaSqYd: [200, 250, 300, 400][i % 4],
  parkingSlots: (i % 2) + 1,
  occupancy: residents[i].type === 'Tenant' ? 'Rented' : 'Owner-occupied',
}));
// Anjali → D-42 First
properties[9] = { ...properties[9], floor: 'First' };
const flatOrder = [9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15, 16, 17];
export const mappings: ResidentPropertyMapping[] = residents.map((r, i) => ({
  id: `m-${String(i + 1).padStart(3, '0')}`,
  residentId: r.id,
  propertyId: properties[flatOrder[i]].id,
  relation: r.type,
  isPrimary: true,
  from: r.joinedOn,
  to: null,
}));

// ---- Events -------------------------------------------------------------------
export const events: RwaEvent[] = [
  {
    id: 'ev-diwali-milan',
    slug: 'diwali-milan',
    title: 'Diwali Milan & Rangoli Competition',
    category: 'Festival',
    summary: 'Rangoli, diyas, live music and a potluck dinner for every family in D Block.',
    description:
      'Celebrate the festival of lights together! The evening begins with a rangoli competition for children and adults (theme: "Our Green Neighbourhood"), followed by diya lighting, a live ghazal and Bollywood set, and a potluck dinner. Please bring one dish per family and avoid firecrackers in the park.',
    venue: 'Central Park, D Block',
    startsAt: istAt(2, 17, 30),
    endsAt: istAt(2, 22, 0),
    coverImage: '', // themed illustrated cover in the demo
    registrationOpen: true,
    capacity: 220,
    isPublic: true,
    albumId: 'al-diwali-2025',
    highlights: ['Rangoli competition', 'Diya lighting', 'Live music', 'Potluck dinner'],
  },
  {
    id: 'ev-childrens-day',
    slug: 'childrens-day-carnival',
    title: 'Children’s Day Carnival',
    category: 'Community',
    summary: 'Games, a magic show and a drawing contest for kids under 14.',
    description:
      'A fun-filled morning with sack races, a treasure hunt, face painting and a magic show. Drawing contest on the theme "My Delhi". Refreshments for all children.',
    venue: 'Community Hall',
    startsAt: istAt(8, 10, 0),
    endsAt: istAt(8, 13, 0),
    coverImage: '', // themed illustrated cover in the demo
    registrationOpen: true,
    capacity: 80,
    isPublic: true,
    albumId: null,
    highlights: ['Magic show', 'Treasure hunt', 'Drawing contest'],
  },
  {
    id: 'ev-health-camp',
    slug: 'free-health-camp',
    title: 'Free Health & Eye Check-up Camp',
    category: 'Health',
    summary: 'BP, sugar, eye and dental check-ups with a partner hospital.',
    description:
      'In partnership with a nearby multi-speciality hospital. Free BP, blood sugar, BMI, eye and dental check-ups. Senior citizens get priority between 9 and 10 AM. Please carry previous prescriptions if any.',
    venue: 'Community Hall',
    startsAt: istAt(16, 9, 0),
    endsAt: istAt(16, 14, 0),
    coverImage: '', // themed illustrated cover in the demo
    registrationOpen: true,
    capacity: 150,
    isPublic: false,
    albumId: null,
    highlights: ['Eye check-up', 'Dental screening', 'Senior citizen priority'],
  },
  {
    id: 'ev-agm',
    slug: 'annual-general-meeting',
    title: 'Annual General Meeting 2026',
    category: 'Meeting',
    summary: 'Accounts, security upgrades and the park renovation plan.',
    description:
      'Agenda: (1) Adoption of audited accounts FY 2025–26, (2) CCTV and boom-barrier upgrade, (3) Central park renovation, (4) Parking stickers, (5) Any other matter with the permission of the chair. One vote per flat.',
    venue: 'Community Hall',
    startsAt: istAt(31, 11, 0),
    endsAt: istAt(31, 13, 30),
    coverImage: '', // themed illustrated cover in the demo
    registrationOpen: true,
    capacity: null,
    isPublic: false,
    albumId: null,
    highlights: ['Accounts FY 2025–26', 'Security upgrade', 'Park renovation'],
  },
  {
    id: 'ev-lohri',
    slug: 'lohri-bonfire',
    title: 'Lohri Bonfire Night',
    category: 'Cultural',
    summary: 'Bonfire, bhangra, rewri and peanuts under the winter sky.',
    description: 'Traditional Lohri bonfire with dhol, bhangra and gidda. Rewri, gajak and peanuts for all.',
    venue: 'Central Park, D Block',
    startsAt: istAt(68, 18, 30),
    endsAt: istAt(68, 22, 0),
    coverImage: '', // themed illustrated cover in the demo
    registrationOpen: false,
    capacity: null,
    isPublic: true,
    albumId: null,
    highlights: ['Bonfire', 'Dhol & bhangra', 'Rewri & gajak'],
  },
  {
    id: 'ev-republic-day',
    slug: 'republic-day-2027',
    title: 'Republic Day Flag Hoisting',
    category: 'National',
    summary: 'Flag hoisting by our senior-most resident followed by breakfast.',
    description: 'Flag hoisting at 9:00 AM, national anthem, a short cultural programme by children and breakfast.',
    venue: 'Central Park, D Block',
    startsAt: istAt(81, 9, 0),
    endsAt: istAt(81, 11, 0),
    coverImage: '', // themed illustrated cover in the demo
    registrationOpen: false,
    capacity: null,
    isPublic: true,
    albumId: null,
    highlights: ['Flag hoisting', 'Cultural programme', 'Breakfast'],
  },
  {
    id: 'ev-cricket',
    slug: 'winter-cricket-league',
    title: 'Winter Cricket League',
    category: 'Sports',
    summary: 'Lane-vs-lane tennis-ball cricket, every Sunday morning.',
    description: 'Six teams, one per lane. Matches every Sunday 7–10 AM. Register your team with the sports secretary.',
    venue: 'DDA Ground, East of Kailash',
    startsAt: istAt(23, 7, 0),
    endsAt: istAt(23, 10, 0),
    coverImage: '', // themed illustrated cover in the demo
    registrationOpen: true,
    capacity: 66,
    isPublic: true,
    albumId: null,
    highlights: ['6 lane teams', 'Sunday mornings', 'Trophy & medals'],
  },
  {
    id: 'ev-independence',
    slug: 'independence-day-2026',
    title: 'Independence Day Celebrations',
    category: 'National',
    summary: 'Flag hoisting, patriotic songs and kite flying.',
    description: 'Flag hoisting, patriotic songs by the children of D Block and a kite-flying session on the terrace.',
    venue: 'Central Park, D Block',
    startsAt: istAt(-83, 8, 30),
    endsAt: istAt(-83, 11, 0),
    coverImage: '', // themed illustrated cover in the demo
    registrationOpen: false,
    capacity: null,
    isPublic: true,
    albumId: 'al-independence-2026',
    highlights: ['Flag hoisting', 'Patriotic songs', 'Kite flying'],
  },
  {
    id: 'ev-navratri',
    slug: 'navratri-dandiya',
    title: 'Navratri Dandiya Night',
    category: 'Cultural',
    summary: 'Garba and dandiya with live dhol.',
    description: 'A colourful dandiya night with a live dhol team, best-dressed prizes and Gujarati snacks.',
    venue: 'Community Hall',
    startsAt: istAt(-27, 19, 0),
    endsAt: istAt(-27, 23, 0),
    coverImage: '', // themed illustrated cover in the demo
    registrationOpen: false,
    capacity: 200,
    isPublic: true,
    albumId: 'al-navratri-2026',
    highlights: ['Live dhol', 'Best-dressed prizes'],
  },
];

export const registrations: EventRegistration[] = [
  { id: 'reg-001', eventId: 'ev-diwali-milan', residentId: 'r-001', status: 'Going', adults: 2, children: 2, note: 'Bringing chole bhature' },
  ...residents.slice(1, 14).map((r, i) => ({
    id: `reg-${String(i + 2).padStart(3, '0')}`,
    eventId: 'ev-diwali-milan',
    residentId: r.id,
    status: (i % 4 === 3 ? 'Maybe' : 'Going') as EventRegistration['status'],
    adults: 2,
    children: i % 3,
    note: null,
  })),
  { id: 'reg-050', eventId: 'ev-health-camp', residentId: 'r-004', status: 'Going', adults: 2, children: 0, note: null },
  { id: 'reg-051', eventId: 'ev-childrens-day', residentId: 'r-003', status: 'Going', adults: 1, children: 2, note: null },
];

// ---- Announcements --------------------------------------------------------------
export const announcements: Announcement[] = [
  {
    id: 'an-diwali-safety',
    title: 'Diwali safety guidelines',
    body:
      'Dear residents, please follow the Delhi government’s green-cracker guidelines. No crackers in the central park or near parked cars. Keep a bucket of water and sand handy, and supervise children at all times. The fire station number is in Contacts.',
    category: 'Security',
    visibility: 'Public',
    pinned: true,
    publishedAt: istAt(-2, 9, 0),
    author: 'Secretary, D Block RWA',
  },
  {
    id: 'an-water-shutdown',
    title: 'Water supply interruption on Saturday',
    body:
      'Delhi Jal Board will carry out pipeline maintenance on Saturday from 10 AM to 4 PM. Please store water in advance. Tankers have been arranged at the D-30 corner.',
    category: 'Maintenance',
    visibility: 'Residents',
    pinned: false,
    publishedAt: istAt(-1, 18, 0),
    author: 'Maintenance Committee',
  },
  {
    id: 'an-maintenance-fee',
    title: 'Quarterly maintenance — Q3 FY 2026–27',
    body:
      'Quarterly maintenance of ₹4,500 per floor is due by the 15th. Pay via UPI to the RWA account or by cheque at the office. Receipts will be sent by SMS.',
    category: 'Circular',
    visibility: 'Residents',
    pinned: false,
    publishedAt: istAt(-5, 11, 0),
    author: 'Treasurer, D Block RWA',
    attachmentName: 'Maintenance-Q3-2026.pdf',
  },
  {
    id: 'an-cctv',
    title: '12 new CCTV cameras installed',
    body:
      'We have installed 12 new HD CCTV cameras covering all gates and the park. Footage is retained for 30 days and can be requested through the RWA office for police matters only.',
    category: 'Security',
    visibility: 'Public',
    pinned: false,
    publishedAt: istAt(-9, 10, 0),
    author: 'Security Committee',
  },
  {
    id: 'an-park',
    title: 'Central park: new walking track open',
    body:
      'The new 400 m rubberised walking track in the central park is now open from 5 AM to 10 PM. Please do not bring bicycles onto the track.',
    category: 'General',
    visibility: 'Public',
    pinned: false,
    publishedAt: istAt(-14, 8, 0),
    author: 'Park & Greenery Committee',
  },
  {
    id: 'an-dengue',
    title: 'Dengue prevention fogging schedule',
    body:
      'MCD fogging will be done every Tuesday and Friday at 6 PM. Please keep windows closed during fogging and empty coolers and flower-pot trays weekly.',
    category: 'Notice',
    visibility: 'Public',
    pinned: false,
    publishedAt: istAt(-18, 9, 30),
    author: 'Secretary, D Block RWA',
  },
  {
    id: 'an-parking',
    title: 'New parking stickers for 2027',
    body:
      'Collect your 2027 parking stickers from the RWA office (Mon–Sat, 10 AM–1 PM) with your RC copy. Unstickered vehicles will not be allowed inside after 31 December.',
    category: 'Notice',
    visibility: 'Residents',
    pinned: false,
    publishedAt: istAt(-21, 12, 0),
    author: 'Secretary, D Block RWA',
  },
  {
    id: 'an-diwali-event',
    title: 'Register for Diwali Milan',
    body: 'Registrations for Diwali Milan close tomorrow evening. RSVP in the app so we can plan the food and seating.',
    category: 'Event',
    visibility: 'Public',
    pinned: false,
    publishedAt: istAt(-3, 19, 0),
    author: 'Cultural Committee',
  },
];

// ---- Albums & media --------------------------------------------------------------
export const albums: Album[] = [
  { id: 'al-diwali-2025', slug: 'diwali-2025', title: 'Diwali Milan 2025', description: 'Rangoli, diyas and the potluck dinner.', eventId: null, year: 2025, coverAssetId: 'md-diwali-1', visibility: 'Public' },
  { id: 'al-navratri-2026', slug: 'navratri-2026', title: 'Navratri Dandiya 2026', description: 'Garba night in the community hall.', eventId: 'ev-navratri', year: 2026, coverAssetId: 'md-navratri-1', visibility: 'Public' },
  { id: 'al-independence-2026', slug: 'independence-day-2026', title: 'Independence Day 2026', description: 'Flag hoisting and kite flying.', eventId: 'ev-independence', year: 2026, coverAssetId: 'md-independence-1', visibility: 'Public' },
  { id: 'al-holi-2026', slug: 'holi-2026', title: 'Holi 2026', description: 'Organic colours and thandai in the park.', eventId: null, year: 2026, coverAssetId: 'md-holi-1', visibility: 'Residents' },
  { id: 'al-park', slug: 'park-renovation', title: 'Park renovation', description: 'Before and after photos of the new walking track.', eventId: null, year: 2026, coverAssetId: 'md-park-1', visibility: 'Public' },
  { id: 'al-committee', slug: 'committee-meetings', title: 'Committee meetings', description: 'Internal photos for committee members.', eventId: null, year: 2026, coverAssetId: 'md-committee-1', visibility: 'Committee' },
];

const mediaFor = (albumId: string, key: string, count: number, uploadedDaysAgo: number, withVideo = false): MediaAsset[] =>
  Array.from({ length: count }, (_, i) => {
    const isVideo = withVideo && i === 2;
    const portrait = i % 3 === 1;
    const w = portrait ? 800 : 1200;
    const h = portrait ? 1200 : 800;
    return {
      id: `md-${key}-${i + 1}`,
      albumId,
      kind: isVideo ? 'video' : 'image',
      title: isVideo ? `${key} highlights` : `${key} photo ${i + 1}`,
      url: photo(`${key}-${i + 1}`, w, h),
      thumbUrl: photo(`${key}-${i + 1}`, Math.round(w / 3), Math.round(h / 3)),
      posterUrl: isVideo ? photo(`${key}-${i + 1}`, w, h) : null,
      width: w,
      height: h,
      durationSec: isVideo ? 94 : null,
      sizeBytes: isVideo ? 48_000_000 : 2_400_000,
      status: 'Ready',
      uploadedBy: 'Rohan Dutta',
      uploadedAt: istAt(-uploadedDaysAgo, 20, 0),
    };
  });

export const media: MediaAsset[] = [
  ...mediaFor('al-diwali-2025', 'diwali', 12, 360, true),
  ...mediaFor('al-navratri-2026', 'navratri', 9, 26, true),
  ...mediaFor('al-independence-2026', 'independence', 8, 82),
  ...mediaFor('al-holi-2026', 'holi', 10, 230, true),
  ...mediaFor('al-park', 'park', 6, 14),
  ...mediaFor('al-committee', 'committee', 4, 40),
];

// ---- Complaints ---------------------------------------------------------------------
export const complaints: Complaint[] = [
  { id: 'cp-001', ticketNo: 'DB-2026-0142', residentId: 'r-001', category: 'Electricity', subject: 'Street light not working near D-42', description: 'The pole light outside D-42 has been off for three nights, the lane is very dark.', priority: 'High', status: 'In Progress', assignedTo: 'Ramesh (Electrician)', createdAt: istAt(-4, 21, 10), updatedAt: istAt(-2, 11, 0) },
  { id: 'cp-002', ticketNo: 'DB-2026-0131', residentId: 'r-001', category: 'Sanitation', subject: 'Garbage not collected on Monday', description: 'Garbage van skipped our lane on Monday morning.', priority: 'Medium', status: 'Resolved', assignedTo: 'MCD Supervisor', createdAt: istAt(-12, 9, 0), updatedAt: istAt(-10, 15, 0) },
  { id: 'cp-003', ticketNo: 'DB-2026-0145', residentId: 'r-006', category: 'Parking', subject: 'Unknown car blocking gate of D-28', description: 'A silver hatchback has been parked across our gate since morning.', priority: 'Urgent', status: 'Open', assignedTo: null, createdAt: istAt(0, 8, 40), updatedAt: istAt(0, 8, 40) },
  { id: 'cp-004', ticketNo: 'DB-2026-0139', residentId: 'r-009', category: 'Water', subject: 'Low water pressure in the evening', description: 'Water pressure drops after 6 PM on the second floor.', priority: 'Medium', status: 'Open', assignedTo: null, createdAt: istAt(-3, 19, 30), updatedAt: istAt(-3, 19, 30) },
  { id: 'cp-005', ticketNo: 'DB-2026-0127', residentId: 'r-012', category: 'Park & Greenery', subject: 'Overgrown hedge near the swings', description: 'Hedges near the children’s swings need trimming, branches are poking out.', priority: 'Low', status: 'Closed', assignedTo: 'Mali (Gardener)', createdAt: istAt(-20, 10, 0), updatedAt: istAt(-15, 10, 0) },
  { id: 'cp-006', ticketNo: 'DB-2026-0144', residentId: 'r-013', category: 'Noise', subject: 'Late-night construction noise', description: 'Construction work at a house on the main road continues past 10 PM.', priority: 'High', status: 'In Progress', assignedTo: 'Secretary', createdAt: istAt(-1, 23, 0), updatedAt: istAt(0, 10, 0) },
  { id: 'cp-007', ticketNo: 'DB-2026-0140', residentId: 'r-004', category: 'Security', subject: 'Gate 2 guard absent at night', description: 'No guard was present at gate 2 between 1 and 3 AM.', priority: 'High', status: 'Resolved', assignedTo: 'Security Supervisor', createdAt: istAt(-6, 7, 0), updatedAt: istAt(-5, 12, 0) },
];

export const complaintUpdates: ComplaintUpdate[] = [
  { id: 'cu-001', complaintId: 'cp-001', author: 'Anjali Sharma', message: 'Complaint raised.', statusChange: 'Open', createdAt: istAt(-4, 21, 10) },
  { id: 'cu-002', complaintId: 'cp-001', author: 'Rajesh Malhotra (Secretary)', message: 'Assigned to Ramesh. BSES has been informed about the faulty pole.', statusChange: 'In Progress', createdAt: istAt(-3, 10, 0) },
  { id: 'cu-003', complaintId: 'cp-001', author: 'Ramesh (Electrician)', message: 'Choke replaced; waiting for BSES to restore the line.', statusChange: null, createdAt: istAt(-2, 11, 0) },
  { id: 'cu-004', complaintId: 'cp-002', author: 'Anjali Sharma', message: 'Complaint raised.', statusChange: 'Open', createdAt: istAt(-12, 9, 0) },
  { id: 'cu-005', complaintId: 'cp-002', author: 'MCD Supervisor', message: 'Van rerouted; collection done on Tuesday.', statusChange: 'Resolved', createdAt: istAt(-10, 15, 0) },
  { id: 'cu-006', complaintId: 'cp-003', author: 'Arjun Khanna', message: 'Complaint raised.', statusChange: 'Open', createdAt: istAt(0, 8, 40) },
  { id: 'cu-007', complaintId: 'cp-006', author: 'Rajesh Malhotra (Secretary)', message: 'Spoke to the contractor; work will stop at 8 PM from today.', statusChange: 'In Progress', createdAt: istAt(0, 10, 0) },
];

// ---- Polls ------------------------------------------------------------------------------
export const polls: Poll[] = [
  {
    id: 'pl-park-timing',
    question: 'Should the central park gates open at 5 AM instead of 6 AM?',
    description: 'Many morning walkers have requested earlier access. Guards will be adjusted accordingly.',
    closesAt: istAt(5, 23, 59),
    isActive: true,
    options: [
      { id: 'po-pt-1', label: 'Yes, 5 AM', sortOrder: 1 },
      { id: 'po-pt-2', label: 'No, keep 6 AM', sortOrder: 2 },
      { id: 'po-pt-3', label: 'Only on weekends', sortOrder: 3 },
    ],
  },
  {
    id: 'pl-diwali-food',
    question: 'What should we add to the Diwali Milan menu?',
    description: null,
    closesAt: istAt(1, 20, 0),
    isActive: true,
    options: [
      { id: 'po-df-1', label: 'Chaat counter', sortOrder: 1 },
      { id: 'po-df-2', label: 'Live jalebi', sortOrder: 2 },
      { id: 'po-df-3', label: 'Kulfi', sortOrder: 3 },
      { id: 'po-df-4', label: 'Pav bhaji', sortOrder: 4 },
    ],
  },
  {
    id: 'pl-cctv',
    question: 'Approve ₹2.4 lakh for CCTV upgrade?',
    description: 'Decided at the last committee meeting, shared for residents’ consent.',
    closesAt: istAt(-7, 23, 59),
    isActive: false,
    options: [
      { id: 'po-cc-1', label: 'Approve', sortOrder: 1 },
      { id: 'po-cc-2', label: 'Do not approve', sortOrder: 2 },
    ],
  },
];

const votes: [string, string, number][] = [
  ['pl-park-timing', 'po-pt-1', 11],
  ['pl-park-timing', 'po-pt-2', 4],
  ['pl-park-timing', 'po-pt-3', 2],
  ['pl-diwali-food', 'po-df-1', 5],
  ['pl-diwali-food', 'po-df-2', 7],
  ['pl-diwali-food', 'po-df-3', 3],
  ['pl-diwali-food', 'po-df-4', 1],
  ['pl-cctv', 'po-cc-1', 14],
  ['pl-cctv', 'po-cc-2', 3],
];
export const pollResponses: PollResponse[] = votes.flatMap(([pollId, optionId, n], vi) =>
  Array.from({ length: n }, (_, i) => ({
    id: `pr-${vi}-${i}`,
    pollId,
    optionId,
    // r-001 (the demo resident) has NOT voted on the open polls yet.
    residentId: `r-${String(((i + vi) % 17) + 2).padStart(3, '0')}`,
  })),
);

// ---- Notifications, audit, committee, contacts ------------------------------------------
export const notifications: AppNotification[] = [
  { id: 'n-001', residentId: null, title: 'Diwali Milan in 2 days', message: 'Have you RSVPed? Rangoli entries close tomorrow.', link: '/events/diwali-milan', category: 'events', createdAt: istAt(0, 9, 0), read: false },
  { id: 'n-002', residentId: 'r-001', title: 'Complaint DB-2026-0142 updated', message: 'Ramesh: Choke replaced; waiting for BSES.', link: '/complaints/cp-001', category: 'complaints', createdAt: istAt(-2, 11, 0), read: false },
  { id: 'n-003', residentId: null, title: 'New notice: Diwali safety guidelines', message: 'Please follow the green-cracker guidelines.', link: '/announcements/an-diwali-safety', category: 'announcements', createdAt: istAt(-2, 9, 0), read: true },
  { id: 'n-004', residentId: null, title: 'Poll closing soon', message: 'Vote on the Diwali Milan menu before tomorrow 8 PM.', link: '/polls/pl-diwali-food', category: 'polls', createdAt: istAt(-1, 10, 0), read: false },
  { id: 'n-005', residentId: null, title: 'Diwali theme is live ✨', message: 'The app and website are now dressed for Diwali.', link: null, category: 'theme', createdAt: istAt(-6, 0, 5), read: true },
  { id: 'n-006', residentId: 'r-001', title: 'Complaint DB-2026-0131 resolved', message: 'MCD: Collection done on Tuesday.', link: '/complaints/cp-002', category: 'complaints', createdAt: istAt(-10, 15, 0), read: true },
];

export const audit: AuditLog[] = [
  { id: 'au-001', at: istAt(0, 10, 0), actor: 'Rajesh Malhotra', action: 'Updated', entity: 'Complaint', entityId: 'cp-006', details: 'Status → In Progress' },
  { id: 'au-002', at: istAt(-1, 18, 0), actor: 'Priya Kapoor', action: 'Published', entity: 'Announcement', entityId: 'an-water-shutdown', details: 'Water supply interruption on Saturday' },
  { id: 'au-003', at: istAt(-2, 9, 0), actor: 'Rajesh Malhotra', action: 'Published', entity: 'Announcement', entityId: 'an-diwali-safety', details: 'Pinned' },
  { id: 'au-004', at: istAt(-3, 10, 0), actor: 'Rajesh Malhotra', action: 'Assigned', entity: 'Complaint', entityId: 'cp-001', details: 'Assigned to Ramesh (Electrician)' },
  { id: 'au-005', at: istAt(-6, 0, 5), actor: 'System', action: 'Activated', entity: 'Theme', entityId: 'th-diwali', details: 'Scheduled: Diwali 2026' },
  { id: 'au-006', at: istAt(-8, 16, 20), actor: 'Rohan Dutta', action: 'Uploaded', entity: 'Media', entityId: 'al-park', details: '6 files' },
  { id: 'au-007', at: istAt(-9, 10, 0), actor: 'Vikram Sethi', action: 'Published', entity: 'Announcement', entityId: 'an-cctv', details: null },
  { id: 'au-008', at: istAt(-11, 12, 0), actor: 'Rajesh Malhotra', action: 'Created', entity: 'Event', entityId: 'ev-diwali-milan', details: 'Diwali Milan & Rangoli Competition' },
];

export const committee: CommitteeMember[] = [
  { id: 'cm-1', name: 'Vikram Sethi', designation: 'President', houseNo: 'D-23', phone: '9000000104', since: 2021, avatarColor: '#13306B', sortOrder: 1 },
  { id: 'cm-2', name: 'Rajesh Malhotra', designation: 'General Secretary', houseNo: 'D-12', phone: '9000000102', since: 2022, avatarColor: '#1F5A3A', sortOrder: 2 },
  { id: 'cm-3', name: 'Sanjay Verma', designation: 'Treasurer', houseNo: 'D-53', phone: '9000000112', since: 2022, avatarColor: '#9A4A12', sortOrder: 3 },
  { id: 'cm-4', name: 'Priya Kapoor', designation: 'Cultural Secretary', houseNo: 'D-14', phone: '9000000103', since: 2023, avatarColor: '#B0186A', sortOrder: 4 },
  { id: 'cm-5', name: 'Ritu Chopra', designation: 'Legal Advisor', houseNo: 'D-49', phone: '9000000111', since: 2024, avatarColor: '#7A1E2C', sortOrder: 5 },
  { id: 'cm-6', name: 'Rohan Dutta', designation: 'Media & Communications', houseNo: 'D-71', phone: '9000000118', since: 2024, avatarColor: '#4A5560', sortOrder: 6 },
];

export const contacts: ImportantContact[] = [
  { id: 'ct-1', name: 'Police (Emergency)', category: 'Emergency', phone: '112', notes: 'All emergencies', sortOrder: 1 },
  { id: 'ct-2', name: 'Fire Brigade', category: 'Emergency', phone: '101', notes: null, sortOrder: 2 },
  { id: 'ct-3', name: 'Ambulance', category: 'Emergency', phone: '102', notes: null, sortOrder: 3 },
  { id: 'ct-4', name: 'Women Helpline', category: 'Emergency', phone: '1091', notes: null, sortOrder: 4 },
  { id: 'ct-5', name: 'Senior Citizen Helpline', category: 'Emergency', phone: '1291', notes: 'Delhi Police', sortOrder: 5 },
  { id: 'ct-6', name: 'RWA Office', category: 'RWA Office', phone: '9000000200', notes: 'Mon–Sat, 10 AM–1 PM', sortOrder: 6 },
  { id: 'ct-7', name: 'Main Gate Security', category: 'RWA Office', phone: '9000000201', notes: '24×7', sortOrder: 7 },
  { id: 'ct-8', name: 'BSES Rajdhani (Electricity)', category: 'Utilities', phone: '19123', notes: 'Power outage complaints', sortOrder: 8 },
  { id: 'ct-9', name: 'Delhi Jal Board', category: 'Utilities', phone: '1916', notes: 'Water supply', sortOrder: 9 },
  { id: 'ct-10', name: 'IGL (Piped Gas)', category: 'Utilities', phone: '1800102509', notes: 'Gas leak emergency', sortOrder: 10 },
  { id: 'ct-11', name: 'Nearby Hospital Emergency', category: 'Medical', phone: '9000000210', notes: '24×7 emergency', sortOrder: 11 },
  { id: 'ct-12', name: 'Chemist (24×7)', category: 'Medical', phone: '9000000211', notes: 'Home delivery', sortOrder: 12 },
  { id: 'ct-13', name: 'Plumber — Mohan', category: 'Services', phone: '9000000220', notes: 'RWA empanelled', sortOrder: 13 },
  { id: 'ct-14', name: 'Electrician — Ramesh', category: 'Services', phone: '9000000221', notes: 'RWA empanelled', sortOrder: 14 },
  { id: 'ct-15', name: 'Carpenter — Salim', category: 'Services', phone: '9000000222', notes: null, sortOrder: 15 },
];

export const settings: SystemSettings = {
  siteName: 'D Block EOK RWA',
  tagline: 'Residents Welfare Association, D Block, East of Kailash',
  address: 'RWA Office, D Block, East of Kailash, New Delhi 110065',
  email: 'office@dblockeok.com',
  phone: '9000000200',
  officeHours: 'Mon–Sat, 10 AM – 1 PM',
  whatsappGroupInfo: 'Ask the RWA office to add you to the D Block residents’ WhatsApp group.',
  otpExpiryMinutes: 5,
  otpMaxAttempts: 5,
  maxUploadMb: 200,
  allowResidentDirectory: true,
  maintenanceBanner: null,
  showWeather: true,
  weatherThemesEnabled: true,
};

export const smsLog: SmsLog[] = [
  { id: 'sms-1', mobile: '90000001••', purpose: 'OTP', status: 'Sent', createdAt: istAt(0, 9, 12), sentAt: istAt(0, 9, 12) },
  { id: 'sms-2', mobile: '90000001••', purpose: 'Complaint update', status: 'Sent', createdAt: istAt(-2, 11, 0), sentAt: istAt(-2, 11, 1) },
  { id: 'sms-3', mobile: '90000001••', purpose: 'Announcement', status: 'Failed', createdAt: istAt(-2, 9, 0), error: 'DLT template mismatch' },
  { id: 'sms-4', mobile: '90000001••', purpose: 'OTP', status: 'Pending', createdAt: istAt(0, 10, 2) },
  { id: 'sms-5', mobile: '90000001••', purpose: 'Event reminder', status: 'Sent', createdAt: istAt(-1, 8, 0), sentAt: istAt(-1, 8, 0) },
];

/** Full, unfiltered dataset (what an all-permissions admin would see). */
export function fullDataset(): Omit<Bootstrap, 'user' | 'serverTime' | 'demoMode'> {
  return {
    residents,
    properties,
    mappings,
    events,
    registrations,
    announcements,
    albums,
    media,
    complaints,
    complaintUpdates,
    polls,
    pollResponses,
    notifications,
    audit,
    committee,
    contacts,
    themes: MOCK_THEMES,
    themeAssets: [],
    themeSchedules: MOCK_THEME_SCHEDULES,
    settings,
    weather: { condition: 'clear', temperatureC: 24, summary: 'Clear sky · AQI 182' },
  };
}
