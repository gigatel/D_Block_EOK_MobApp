import { extractOtp } from '../useSmsCode';

describe('extractOtp', () => {
  it.each([
    ['482913 is your D Block EOK OTP. Valid for 5 minutes.', '482913'],
    ['Your OTP for D Block EOK is 120034. Do not share. Ref 9876543210', '120034'],
    ['D Block EOK: use code 555777 to sign in. Helpline 011-26431234', '555777'],
    ['Call 9811111111 for help', null],
    ['', null],
  ])('%s → %s', (msg, expected) => {
    expect(extractOtp(msg)).toBe(expected);
  });
});
