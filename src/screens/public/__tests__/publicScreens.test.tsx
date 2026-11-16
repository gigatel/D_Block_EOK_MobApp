/**
 * Smoke-renders every public/content screen against mock data, signed out and
 * signed in as the demo resident, to catch runtime errors early.
 */
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { data } from '@/services';
import { completeSignIn } from '@/services/auth';
import { queryClient } from '@/services/queryClient';
import { useSession } from '@/store/session';
import { ThemeProvider } from '@/theme';
import { HomeScreen } from '../HomeScreen';
import { EventsScreen } from '../EventsScreen';
import { EventDetailScreen } from '../EventDetailScreen';
import { GalleryScreen } from '../GalleryScreen';
import { AlbumDetailScreen } from '../AlbumDetailScreen';
import { MediaViewerScreen } from '../MediaViewerScreen';
import { NoticesScreen } from '../NoticesScreen';
import { AnnouncementDetailScreen } from '../AnnouncementDetailScreen';
import { AboutScreen } from '../AboutScreen';
import { CommitteeScreen } from '../CommitteeScreen';
import { ContactsScreen } from '../ContactsScreen';

const Stack = createNativeStackNavigator();

const cases: [string, React.ComponentType, object | undefined][] = [
  ['Home', HomeScreen, undefined],
  ['Events', EventsScreen, undefined],
  ['EventDetail', EventDetailScreen, { slug: 'diwali-milan' }],
  ['Gallery', GalleryScreen, undefined],
  ['AlbumDetail', AlbumDetailScreen, { albumId: 'al-diwali-2025' }],
  ['MediaViewer', MediaViewerScreen, { albumId: 'al-diwali-2025', index: 2 }],
  ['Notices', NoticesScreen, undefined],
  [
    'AnnouncementDetail',
    AnnouncementDetailScreen,
    { id: 'an-maintenance-fee' },
  ],
  ['About', AboutScreen, undefined],
  ['Committee', CommitteeScreen, undefined],
  ['Contacts', ContactsScreen, undefined],
];

async function renderScreen(
  name: string,
  Component: React.ComponentType,
  params?: object,
) {
  let r!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    r = ReactTestRenderer.create(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 360, height: 760 },
          insets: { top: 24, left: 0, right: 0, bottom: 0 },
        }}
      >
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <NavigationContainer>
              <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen
                  name={name}
                  component={Component}
                  initialParams={params}
                />
              </Stack.Navigator>
            </NavigationContainer>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>,
    );
  });
  // Wait for the mock bootstrap (≤ 650 ms latency).
  await ReactTestRenderer.act(async () => {
    await new Promise<void>(res => setTimeout(res, 900));
  });
  return r;
}

const texts = (r: ReactTestRenderer.ReactTestRenderer) =>
  r.root
    .findAll(n => (n.type as unknown) === 'Text')
    .map(n => [n.props.children].flat().join(''));

afterAll(() => queryClient.clear());

describe('signed out', () => {
  beforeAll(() => useSession.getState().setSignedOut());
  it.each(cases)('%s renders', async (name, C, params) => {
    const r = await renderScreen(name, C, params);
    expect(texts(r).length).toBeGreaterThan(0);
    await ReactTestRenderer.act(async () => r.unmount());
  });

  it('public home shows the sign-in CTA', async () => {
    const r = await renderScreen('Home', HomeScreen);
    expect(texts(r)).toContain('Resident sign in');
    await ReactTestRenderer.act(async () => r.unmount());
  });
});

describe('signed in as the demo resident', () => {
  beforeAll(async () => {
    await data.requestOtp('9000000101');
    const res = await data.verifyOtp('9000000101', '123456');
    if (res.ok !== true) throw new Error('demo OTP sign-in failed');
    await completeSignIn(res);
  });
  it.each(cases)('%s renders', async (name, C, params) => {
    const r = await renderScreen(name, C, params);
    expect(texts(r).length).toBeGreaterThan(0);
    await ReactTestRenderer.act(async () => r.unmount());
  });

  it('dashboard greets the resident with their flat', async () => {
    const r = await renderScreen('Home', HomeScreen);
    const t = texts(r).join(' | ');
    expect(t).toMatch(/Good (morning|afternoon|evening), Anjali/);
    expect(t).toContain('D-42');
    expect(t).toContain('New complaint');
    // Committee replaced Directory on the dashboard.
    expect(t).toContain('Managing committee');
    expect(t).toContain('Committee');
    expect(t).not.toContain('Directory');
    await ReactTestRenderer.act(async () => r.unmount());
  });

  it('event detail offers an RSVP update for a registered event', async () => {
    const r = await renderScreen('EventDetail', EventDetailScreen, {
      slug: 'diwali-milan',
    });
    expect(texts(r).join(' ')).toContain('Update RSVP');
    await ReactTestRenderer.act(async () => r.unmount());
  });
});
