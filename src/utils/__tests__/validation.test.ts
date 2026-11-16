import { isNonEmpty, isValidEmail, minLength } from '../validation';

describe('validation', () => {
  it('validates emails', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('  user@example.com  ')).toBe(true);
    expect(isValidEmail('user@')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });

  it('checks non-empty strings', () => {
    expect(isNonEmpty('a')).toBe(true);
    expect(isNonEmpty('   ')).toBe(false);
    expect(isNonEmpty(null)).toBe(false);
    expect(isNonEmpty(undefined)).toBe(false);
  });

  it('checks minimum length', () => {
    expect(minLength('123456', 6)).toBe(true);
    expect(minLength('12345', 6)).toBe(false);
  });
});
