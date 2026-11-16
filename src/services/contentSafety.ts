/**
 * On-device explicit-content screening before any upload leaves the phone.
 *
 * Native side: modules/content-safety (Yahoo open_nsfw, TFLite) — Android Kotlin,
 * iOS Obj-C++. Images are scored once; videos are sampled at evenly spaced frames
 * and the worst frame decides.
 *
 * This is a first line of defence only: the API accepts uploads from any client,
 * so the server must screen too (docs/API-GAPS.md §6.7).
 *
 * Fails CLOSED: if the scanner is missing (old build) or can't read the file,
 * the file is blocked rather than uploaded unchecked.
 */
import { NativeModules } from 'react-native';
import type { MediaKind } from '@/types/models';
import { logger } from '@/utils/logger';

type NativeContentSafety = {
  scan(uri: string, kind: MediaKind, maxFrames: number): Promise<{ score: number; frames: number }>;
};

/**
 * open_nsfw guidance: < 0.2 very likely safe, > 0.8 very likely explicit.
 * A community app errs on the strict side.
 */
export const NSFW_BLOCK_THRESHOLD = 0.6;
/** Frames sampled per video (evenly spread across its duration). */
export const VIDEO_SAMPLE_FRAMES = 8;

export type SafetyVerdict =
  | { ok: true; score: number }
  | { ok: false; reason: 'explicit' | 'unreadable' | 'unavailable'; message: string; score?: number };

const native = (): NativeContentSafety | undefined =>
  NativeModules.ContentSafety as NativeContentSafety | undefined;

export function isContentSafetyAvailable(): boolean {
  return !!native();
}

export async function scanMedia(uri: string, kind: MediaKind): Promise<SafetyVerdict> {
  const mod = native();
  if (!mod) {
    return {
      ok: false,
      reason: 'unavailable',
      message: 'Content check is unavailable in this app build. Please update the app.',
    };
  }
  try {
    const { score } = await mod.scan(uri, kind, kind === 'video' ? VIDEO_SAMPLE_FRAMES : 1);
    if (score >= NSFW_BLOCK_THRESHOLD) {
      return {
        ok: false,
        reason: 'explicit',
        score,
        message: 'Blocked: this file appears to contain nudity or explicit content.',
      };
    }
    return { ok: true, score };
  } catch (e) {
    logger.warn('[contentSafety] scan failed', e);
    return {
      ok: false,
      reason: 'unreadable',
      message: 'This file could not be checked, so it cannot be uploaded.',
    };
  }
}
