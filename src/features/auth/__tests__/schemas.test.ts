import {
  changePasswordSchema,
  mobileSchema,
  normaliseMobile,
  otpCodeSchema,
  passwordLoginSchema,
  passwordStrength,
} from '../schemas';

describe('auth schemas', () => {
  it('normalises and validates Indian mobile numbers', () => {
    expect(normaliseMobile('+91 90000-00101')).toBe('9000000101');
    expect(mobileSchema.parse('9000000101')).toBe('9000000101');
    expect(mobileSchema.safeParse('5000000101').success).toBe(false);
    expect(mobileSchema.safeParse('900000010').success).toBe(false);
  });

  it('validates password login', () => {
    expect(
      passwordLoginSchema.safeParse({
        mobile: '9000000101',
        password: 'demo1234',
      }).success,
    ).toBe(true);
    expect(
      passwordLoginSchema.safeParse({ mobile: '9000000101', password: '123' })
        .success,
    ).toBe(false);
  });

  it('validates 6-digit OTP codes', () => {
    expect(otpCodeSchema.safeParse('123456').success).toBe(true);
    expect(otpCodeSchema.safeParse('12345').success).toBe(false);
    expect(otpCodeSchema.safeParse('12a456').success).toBe(false);
  });

  it('validates password changes', () => {
    const ok = changePasswordSchema.safeParse({
      currentPassword: 'demo1234',
      newPassword: 'newpass99',
      confirm: 'newpass99',
    });
    expect(ok.success).toBe(true);
    const mismatch = changePasswordSchema.safeParse({
      currentPassword: 'demo1234',
      newPassword: 'newpass99',
      confirm: 'nope',
    });
    expect(mismatch.success).toBe(false);
    const weak = changePasswordSchema.safeParse({
      currentPassword: 'demo1234',
      newPassword: 'abcdefgh',
      confirm: 'abcdefgh',
    });
    expect(weak.success).toBe(false);
  });

  it('scores password strength', () => {
    expect(passwordStrength('').label).toBe('');
    expect(passwordStrength('abc').score).toBe(0);
    expect(passwordStrength('Abcdefgh12!x').score).toBe(4);
  });
});
