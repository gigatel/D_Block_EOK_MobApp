import type { MediaAsset } from '@/types/models';

/**
 * "Report this photo" (App Store Guideline 1.2): a pre-filled email to the RWA
 * office address from settings. No backend endpoint needed; the committee
 * removes the item from the admin albums screen.
 */
export function reportMediaMailto(
  email: string,
  asset: Pick<MediaAsset, 'id' | 'title' | 'kind' | 'uploadedBy' | 'albumId'>,
  albumTitle?: string,
): string {
  const what = asset.kind === 'video' ? 'video' : 'photo';
  const subject = `Report ${what}: ${asset.title}`;
  const body = [
    `I would like to report this ${what} in the D Block EOK app gallery.`,
    '',
    `Album: ${albumTitle ?? asset.albumId}`,
    `Item: ${asset.title}`,
    asset.uploadedBy ? `Uploaded by: ${asset.uploadedBy}` : null,
    `Reference: ${asset.albumId}/${asset.id}`,
    '',
    'Reason:',
    '',
  ]
    .filter(l => l !== null)
    .join('\n');
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
