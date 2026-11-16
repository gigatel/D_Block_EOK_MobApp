import { z } from 'zod';
import { COMPLAINT_CATEGORIES, PRIORITIES } from '@/types/models';

export const complaintSchema = z.object({
  category: z.enum(COMPLAINT_CATEGORIES, { message: 'Choose a category.' }),
  priority: z.enum(PRIORITIES),
  subject: z
    .string()
    .trim()
    .min(5, 'Subject must be at least 5 characters.')
    .max(120, 'Subject must be 120 characters or fewer.'),
  description: z
    .string()
    .trim()
    .min(10, 'Please describe the issue in at least 10 characters.')
    .max(2000, 'Description must be 2000 characters or fewer.'),
});
export type ComplaintForm = z.infer<typeof complaintSchema>;

export const commentSchema = z
  .string()
  .trim()
  .min(2, 'Write a short comment.')
  .max(1000);
