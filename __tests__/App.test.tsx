/**
 * Smoke test: the full app (providers, navigation, theme engine, mock data)
 * renders, and strict authentication holds — signed out, only the sign-in
 * screen exists; after sign-in the tabs appear; sign-out returns to sign-in.
 *
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';
import { data } from '@/services';
import { completeSignIn, signOut } from '@/services/auth';
import { queryClient } from '@/services/queryClient';

jest.useFakeTimers();

afterAll(() => {
  queryClient.clear();
  jest.clearAllTimers();
});

const tabLabels = (r: ReactTestRenderer.ReactTestRenderer) =>
  new Set(
    r.root
      .findAll(n => n.props.accessibilityRole === 'tab' && typeof n.props.accessibilityLabel === 'string')
      .map(t => t.props.accessibilityLabel),
  );

const hasSignIn = (r: ReactTestRenderer.ReactTestRenderer) =>
  r.root.findAll(n => n.props.accessibilityRole === 'header' && n.props.children === 'Welcome home').length > 0;

const settle = () =>
  ReactTestRenderer.act(async () => {
    jest.advanceTimersByTime(2000);
  });

test('requires sign-in before any app screen is reachable', async () => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
  });
  await settle();

  // Signed out: sign-in screen only, no tabs.
  expect(hasSignIn(renderer)).toBe(true);
  expect(tabLabels(renderer).size).toBe(0);

  // Signed in: the app shell with the bottom tabs.
  await ReactTestRenderer.act(async () => {
    // The demo service simulates network latency with timers.
    const pending = data.login('9000000101', 'demo1234');
    await jest.advanceTimersByTimeAsync(5000);
    const res = await pending;
    if (res.ok !== true) throw new Error('demo login failed');
    await completeSignIn(res);
  });
  await settle();
  expect(tabLabels(renderer)).toEqual(new Set(['Home', 'Events', 'Gallery', 'Notices', 'More']));
  expect(hasSignIn(renderer)).toBe(false);

  // Signed out again: back to sign-in.
  await ReactTestRenderer.act(async () => {
    const pending = signOut();
    await jest.advanceTimersByTimeAsync(5000);
    await pending;
  });
  await settle();
  expect(hasSignIn(renderer)).toBe(true);
  expect(tabLabels(renderer).size).toBe(0);

  await ReactTestRenderer.act(async () => renderer.unmount());
});
