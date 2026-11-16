/* eslint-env jest */

// Safe-area-context ships an official Jest mock.
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);

// Keychain is a native TurboModule; replace with an in-memory implementation.
jest.mock('react-native-keychain', () => {
  let stored = null;
  return {
    ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'AccessibleWhenUnlockedThisDeviceOnly' },
    setGenericPassword: jest.fn(async (username, password) => {
      stored = { username, password };
      return true;
    }),
    getGenericPassword: jest.fn(async () => stored ?? false),
    resetGenericPassword: jest.fn(async () => {
      stored = null;
      return true;
    }),
  };
});

// Reanimated 4: see jest/reanimatedMock.js for why the official mock is not used.
jest.mock('react-native-worklets', () => require('react-native-worklets/lib/module/mock'));
jest.mock('react-native-reanimated', () => require('./jest/reanimatedMock'));

jest.mock('react-native-haptic-feedback', () => ({
  trigger: jest.fn(),
  HapticFeedbackTypes: {
    selection: 'selection',
    impactLight: 'impactLight',
    notificationSuccess: 'notificationSuccess',
    notificationWarning: 'notificationWarning',
    notificationError: 'notificationError',
  },
}));

// Tests always run against the in-memory mock service — never the live API.
jest.mock('@/config/env', () => {
  const actual = jest.requireActual('@/config/env');
  return {
    ...actual,
    env: { ...actual.env, DATA_MODE: 'mock', API_BASE_URL: 'http://api.test' },
    apiHost: 'api.test',
  };
});

// Photo library picker (native). Tests set the next result via mockResolvedValueOnce.
jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(async () => ({ didCancel: true })),
  launchCamera: jest.fn(async () => ({ didCancel: true })),
}));

// On-device content-safety scanner (modules/content-safety). Safe by default;
// files named "*nsfw*" score as explicit so the blocked path can be tested.
{
  const { NativeModules } = require('react-native');
  NativeModules.ContentSafety = {
    scan: jest.fn(async uri => ({ score: /nsfw/i.test(uri) ? 0.97 : 0.02, frames: 1 })),
  };
}
