/** zod form schemas for committee/admin editors. */
import { z } from 'zod';
import { ANNOUNCEMENT_CATEGORIES, EVENT_CATEGORIES } from '@/types/models';

export const announcementFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, 'Title must be at least 5 characters.')
    .max(255, 'Title is too long.'),
  category: z.enum(ANNOUNCEMENT_CATEGORIES),
  visibility: z.enum(['Public', 'Residents']),
  pinned: z.boolean(),
  body: z
    .string()
    .trim()
    .min(10, 'Please write at least 10 characters.')
    .max(4000, 'Body is too long (max 4000).'),
  expiresAt: z.string().nullable(),
});
export type AnnouncementForm = z.infer<typeof announcementFormSchema>;

export const eventFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(5, 'Title must be at least 5 characters.')
      .max(255),
    category: z.enum(EVENT_CATEGORIES),
    summary: z
      .string()
      .trim()
      .min(10, 'Summary must be at least 10 characters.')
      .max(300, 'Summary must be 300 characters or fewer.'),
    description: z
      .string()
      .trim()
      .min(10, 'Description must be at least 10 characters.'),
    venue: z.string().trim().min(3, 'Venue is required.').max(255),
    startsAt: z.string().min(10),
    endsAt: z.string().min(10),
    registrationOpen: z.boolean(),
    capacity: z
      .number()
      .int()
      .positive('Capacity must be a positive number.')
      .max(5000)
      .nullable(),
    isPublic: z.boolean(),
    highlights: z
      .array(z.string().trim().min(1).max(60))
      .max(10, 'Up to 10 highlights.'),
    coverImage: z.union([
      z.literal(''),
      z.string().url('Enter a valid https:// image URL.'),
    ]),
  })
  .refine(v => Date.parse(v.endsAt) > Date.parse(v.startsAt), {
    message: 'End time must be after the start time.',
    path: ['endsAt'],
  });
export type EventForm = z.infer<typeof eventFormSchema>;

export const albumFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters.')
    .max(255),
  description: z.string().trim().max(1000),
  year: z.number().int().min(2000).max(2100),
  visibility: z.enum(['Public', 'Residents', 'Committee']),
});
export type AlbumForm = z.infer<typeof albumFormSchema>;

/** Flattens zod issues to { field: firstMessage }. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
