import { NativeModules } from 'react-native';
import { NSFW_BLOCK_THRESHOLD, scanMedia, VIDEO_SAMPLE_FRAMES } from '../contentSafety';

const scan = NativeModules.ContentSafety.scan as jest.Mock;

describe('scanMedia', () => {
  afterEach(() => scan.mockClear());

  it('lets a safe photo through', async () => {
    await expect(scanMedia('file:///diwali.jpg', 'image')).resolves.toEqual({ ok: true, score: 0.02 });
    expect(scan).toHaveBeenCalledWith('file:///diwali.jpg', 'image', 1);
  });

  it('blocks explicit content at or above the threshold', async () => {
    scan.mockResolvedValueOnce({ score: NSFW_BLOCK_THRESHOLD, frames: 1 });
    const v = await scanMedia('file:///x.jpg', 'image');
    expect(v).toMatchObject({ ok: false, reason: 'explicit' });
  });

  it('samples several frames for videos', async () => {
    await scanMedia('file:///clip.mp4', 'video');
    expect(scan).toHaveBeenCalledWith('file:///clip.mp4', 'video', VIDEO_SAMPLE_FRAMES);
  });

  it('fails closed when the file cannot be read', async () => {
    scan.mockRejectedValueOnce(new Error('E_DECODE'));
    await expect(scanMedia('file:///broken.jpg', 'image')).resolves.toMatchObject({ ok: false, reason: 'unreadable' });
  });

  it('fails closed when the native scanner is missing', async () => {
    const mod = NativeModules.ContentSafety;
    NativeModules.ContentSafety = undefined;
    try {
      await expect(scanMedia('file:///a.jpg', 'image')).resolves.toMatchObject({ ok: false, reason: 'unavailable' });
    } finally {
      NativeModules.ContentSafety = mod;
    }
  });
});
