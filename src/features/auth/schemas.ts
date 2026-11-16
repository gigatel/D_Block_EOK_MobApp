import { z } from 'zod';

/** Indian mobile: 10 digits starting 6–9 (spaces/dashes and +91 are stripped first). */
export function normaliseMobile(input: string): string {
  const digits = input.replace(/\D/g, '');
  return digits.length > 10 && digits.startsWith('91')
    ? digits.slice(-10)
    : digits;
}

export const mobileSchema = z
  .string()
  .transform(normaliseMobile)
  .pipe(
    z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number.'),
  );

export const passwordLoginSchema = z.object({
  mobile: mobileSchema,
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

export const otpRequestSchema = z.object({ mobile: mobileSchema });

export const otpCodeSchema = z
  .string()
  .regex(/^\d{6}$/, 'Enter the 6-digit code.');

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password.'),
    newPassword: z
      .string()
      .min(8, 'Use at least 8 characters.')
      .regex(/[A-Za-z]/, 'Include at least one letter.')
      .regex(/\d/, 'Include at least one number.'),
    confirm: z.string(),
  })
  .refine(v => v.newPassword === v.confirm, {
    path: ['confirm'],
    message: 'Passwords do not match.',
  })
  .refine(v => v.newPassword !== v.currentPassword, {
    path: ['newPassword'],
    message: 'New password must be different from the current one.',
  });

/** 0–4 strength score for the hint under the new-password field. */
export function passwordStrength(pw: string): { score: number; label: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
  return { score, label: pw ? labels[score] : '' };
}

/** First error message per field from a zod result. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '_');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
