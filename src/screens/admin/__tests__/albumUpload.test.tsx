/**
 * Gallery upload: only accounts with `media.upload` see it, and every picked
 * file goes through the on-device content check before it can be uploaded.
 */
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import { data } from '@/services';
import { completeSignIn } from '@/services/auth';
import { queryClient } from '@/services/queryClient';
import { GalleryScreen } from '@/screens/public/GalleryScreen';
import { AlbumDetailScreen } from '@/screens/public/AlbumDetailScreen';
import { AlbumUploadScreen } from '../AlbumUploadScreen';

const Stack = createNativeStackNavigator();
const UPLOAD_LABEL = 'Upload photos or videos';

async function renderScreen(name: string, Component: React.ComponentType, params?: object) {
  let r!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    r = ReactTestRenderer.create(
      <SafeAreaProvider
        initialMetrics={{ frame: { x: 0, y: 0, width: 360, height: 760 }, insets: { top: 24, left: 0, right: 0, bottom: 0 } }}
      >
        <QueryClientProvider client={queryClient}>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name={name} component={Component} initialParams={params} />
            </Stack.Navigator>
          </NavigationContainer>
        </QueryClientProvider>
      </SafeAreaProvider>,
    );
  });
  await ReactTestRenderer.act(async () => {
    await new Promise<void>(res => setTimeout(res, 900));
  });
  return r;
}

const texts = (r: ReactTestRenderer.ReactTestRenderer) =>
  r.root.findAll(n => (n.type as unknown) === 'Text').map(n => [n.props.children].flat().join(''));
const byLabel = (r: ReactTestRenderer.ReactTestRenderer, label: string) =>
  r.root.findAll(n => n.props.accessibilityLabel === label && typeof n.props.onPress === 'function');

afterAll(() => queryClient.clear());

describe('resident without media.upload', () => {
  beforeAll(async () => {
    await data.requestOtp('9000000101');
    const res = await data.verifyOtp('9000000101', '123456');
    if (res.ok !== true) throw new Error('demo OTP sign-in failed');
    await completeSignIn(res);
  });

  it('sees no upload button in the gallery', async () => {
    const r = await renderScreen('Gallery', GalleryScreen);
    expect(byLabel(r, UPLOAD_LABEL)).toHaveLength(0);
    await ReactTestRenderer.act(async () => r.unmount());
  });

  it('is refused on the upload screen', async () => {
    const r = await renderScreen('AlbumUpload', AlbumUploadScreen);
    expect(texts(r)).toContain('Committee access only');
    await ReactTestRenderer.act(async () => r.unmount());
  });
});

describe('editor with media.upload', () => {
  beforeAll(async () => {
    // Committee accounts sign in with mobile + SMS code too (no password).
    await data.requestOtp('9000000103');
    const res = await data.verifyOtp('9000000103', '123456');
    if (res.ok !== true) throw new Error('demo OTP sign-in failed');
    expect(res.user.permissions).toContain('media.upload');
    await completeSignIn(res);
  });

  it('sees the upload button in the gallery', async () => {
    const r = await renderScreen('Gallery', GalleryScreen);
    expect(byLabel(r, UPLOAD_LABEL).length).toBeGreaterThan(0);
    await ReactTestRenderer.act(async () => r.unmount());
  });

  it('shows who uploaded each photo', async () => {
    const r = await renderScreen('AlbumDetail', AlbumDetailScreen, { albumId: 'al-diwali-2025' });
    const photo = r.root.findAll(n => /^Photo: .*, uploaded by \S/.test(String(n.props.accessibilityLabel ?? '')));
    expect(photo.length).toBeGreaterThan(0);
    await ReactTestRenderer.act(async () => r.unmount());
  });

  it('blocks explicit files and queues safe ones', async () => {
    (launchImageLibrary as jest.Mock).mockResolvedValueOnce({
      assets: [
        { uri: 'file:///cache/diwali.jpg', fileName: 'diwali.jpg', type: 'image/jpeg', fileSize: 1_000_000 },
        { uri: 'file:///cache/nsfw.jpg', fileName: 'bad.jpg', type: 'image/jpeg', fileSize: 1_000_000 },
        { uri: 'file:///cache/anim.gif', fileName: 'anim.gif', type: 'image/gif', fileSize: 1_000 },
      ],
    });
    const r = await renderScreen('AlbumUpload', AlbumUploadScreen, { albumId: 'al-diwali-2025' });
    // The album passed in is preselected in the dropdown.
    expect(texts(r)).not.toContain('Choose a festival album');
    await ReactTestRenderer.act(async () => {
      byLabel(r, 'Add photos or videos')[0].props.onPress();
      await new Promise<void>(res => setTimeout(res, 50));
    });
    const t = texts(r).join(' | ');
    expect(t).toContain('Ready to upload');
    expect(t).toContain('Blocked: this file appears to contain nudity or explicit content.');
    expect(t).toContain('Unsupported format. Use JPEG, PNG, WebP, MP4 or MOV.');
    expect(t).toContain('Upload 1 file');
    await ReactTestRenderer.act(async () => r.unmount());
  });
});
