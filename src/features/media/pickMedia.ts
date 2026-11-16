import { launchImageLibrary, type Asset } from 'react-native-image-picker';
import type { UploadFile } from '@/services';

/** Formats the server accepts (see AlbumUpload screen copy). */
const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
};
export const ACCEPTED_MIME = new Set(Object.values(MIME_BY_EXT));

const ext = (name: string) => /\.([a-z0-9]+)$/i.exec(name)?.[1]?.toLowerCase() ?? '';

export type PickedFile = UploadFile & { uri: string; mimeType: string; supported: boolean };

/** Map a picker asset to an upload file (exported for tests). */
export function toPickedFile(a: Asset, index: number): PickedFile | null {
  if (!a.uri) return null;
  const fromUri = a.uri.split('?')[0].split('/').pop() ?? '';
  const name = a.fileName || fromUri || `media-${index + 1}`;
  const mimeType = (a.type || MIME_BY_EXT[ext(name)] || '').toLowerCase();
  const kind = mimeType.startsWith('video/') || a.duration != null ? 'video' : 'image';
  return {
    uri: a.uri,
    name,
    mimeType: mimeType || (kind === 'video' ? 'video/mp4' : 'image/jpeg'),
    sizeBytes: a.fileSize ?? 0,
    kind,
    supported: ACCEPTED_MIME.has(mimeType),
  };
}

export type PickResult = { files: PickedFile[] } | { error: string } | { cancelled: true };

/**
 * Open the device photo library (Android Photo Picker / iOS PHPicker — no
 * storage permission needed). HEIC photos are converted to JPEG on iOS.
 */
export async function pickMedia(limit = 30): Promise<PickResult> {
  const res = await launchImageLibrary({
    mediaType: 'mixed',
    selectionLimit: limit,
    assetRepresentationMode: 'compatible',
    includeExtra: false,
    formatAsMp4: true,
  });
  if (res.didCancel) return { cancelled: true };
  if (res.errorCode) {
    return { error: res.errorMessage ?? 'Could not open your photo library.' };
  }
  const files = (res.assets ?? []).map(toPickedFile).filter((f): f is PickedFile => !!f);
  return { files };
}
