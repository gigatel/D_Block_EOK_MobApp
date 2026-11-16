import type { Album, RwaEvent } from '@/types/models';
import { pickUploadedAsset } from '@/services/api/apiService';
import { recentAlbumOptions } from '../albums';
import { toPickedFile } from '../pickMedia';
import { reportMediaMailto } from '../report';

describe('toPickedFile', () => {
  it('maps a library photo', () => {
    expect(
      toPickedFile({ uri: 'file:///c/a.jpg', fileName: 'diwali look.jpeg', type: 'image/jpeg', fileSize: 2048 }, 0),
    ).toEqual({
      uri: 'file:///c/a.jpg',
      name: 'diwali look.jpeg',
      mimeType: 'image/jpeg',
      sizeBytes: 2048,
      kind: 'image',
      supported: true,
    });
  });

  it('detects videos and infers the mime type from the extension', () => {
    const f = toPickedFile({ uri: 'file:///c/clip.MOV', duration: 12 }, 1);
    expect(f).toMatchObject({ name: 'clip.MOV', kind: 'video', mimeType: 'video/quicktime', supported: true });
  });

  it('flags formats the server does not accept', () => {
    expect(toPickedFile({ uri: 'file:///c/a.gif', type: 'image/gif' }, 0)?.supported).toBe(false);
  });

  it('skips assets without a uri', () => {
    expect(toPickedFile({ fileName: 'x.jpg' }, 0)).toBeNull();
  });
});

describe('recentAlbumOptions', () => {
  const album = (id: string, year: number, createdAt: string | null, eventId: string | null = null): Album => ({
    id,
    slug: id,
    title: id,
    description: '',
    year,
    eventId,
    visibility: 'Public',
    createdAt,
  });

  it('orders newest first and labels the festival', () => {
    const opts = recentAlbumOptions({
      albums: [
        album('holi-25', 2025, '2025-03-15T00:00:00Z'),
        album('chhath-26', 2026, '2026-11-13T07:53:10Z', 'ev-chhath'),
        album('diwali-26', 2026, '2026-10-21T00:00:00Z'),
      ],
      events: [{ id: 'ev-chhath', title: 'Chhath Puja' } as RwaEvent],
    });
    expect(opts.map(o => o.album.id)).toEqual(['chhath-26', 'diwali-26', 'holi-25']);
    expect(opts[0].subtitle).toBe('Chhath Puja · 2026 · Public');
  });
});

describe('pickUploadedAsset', () => {
  const file = { name: 'a.jpg', sizeBytes: 10, kind: 'image' as const };
  const asset = { id: 'm1', albumId: 'a1', title: 'a.jpg', status: 'Ready' };

  it.each([
    ['an array', [asset]],
    ['{ items }', { items: [asset] }],
    ['{ media }', { media: [asset] }],
    ['a single object', asset],
  ])('reads %s', (_label, body) => {
    expect(pickUploadedAsset(body, 'a1', file).id).toBe('m1');
  });

  it('falls back to a processing placeholder', () => {
    expect(pickUploadedAsset({ ok: true }, 'a1', file)).toMatchObject({ albumId: 'a1', status: 'Processing', title: 'a.jpg' });
  });
});

describe('reportMediaMailto', () => {
  it('builds a pre-filled report email to the RWA office', () => {
    const url = reportMediaMailto(
      'office@example.com',
      { id: 'm1', albumId: 'a1', title: 'Rangoli & lamps', kind: 'image', uploadedBy: 'Harshit Sen' },
      'Chhath Puja 2026',
    );
    expect(url.startsWith('mailto:office@example.com?subject=')).toBe(true);
    const params = new URLSearchParams(url.split('?')[1]);
    expect(params.get('subject')).toBe('Report photo: Rangoli & lamps');
    expect(params.get('body')).toContain('Album: Chhath Puja 2026');
    expect(params.get('body')).toContain('Uploaded by: Harshit Sen');
    expect(params.get('body')).toContain('Reference: a1/m1');
  });
});
