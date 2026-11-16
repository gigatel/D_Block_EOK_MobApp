import { commentSchema, complaintSchema } from '../schemas';

const valid = {
  category: 'Electricity',
  priority: 'High',
  subject: 'Street light not working',
  description: 'The pole light outside D-42 is off for three nights.',
};

describe('complaintSchema', () => {
  it('accepts a valid complaint', () => {
    expect(complaintSchema.safeParse(valid).success).toBe(true);
  });
  it('rejects unknown categories and priorities', () => {
    expect(
      complaintSchema.safeParse({ ...valid, category: 'Aliens' }).success,
    ).toBe(false);
    expect(
      complaintSchema.safeParse({ ...valid, priority: 'Critical' }).success,
    ).toBe(false);
  });
  it('enforces subject and description lengths', () => {
    expect(complaintSchema.safeParse({ ...valid, subject: 'Hi' }).success).toBe(
      false,
    );
    expect(
      complaintSchema.safeParse({ ...valid, subject: 'x'.repeat(121) }).success,
    ).toBe(false);
    expect(
      complaintSchema.safeParse({ ...valid, description: 'short' }).success,
    ).toBe(false);
    expect(
      complaintSchema.safeParse({ ...valid, description: 'x'.repeat(2001) })
        .success,
    ).toBe(false);
  });
  it('validates comments', () => {
    expect(commentSchema.safeParse('ok thanks').success).toBe(true);
    expect(commentSchema.safeParse(' ').success).toBe(false);
  });
});
