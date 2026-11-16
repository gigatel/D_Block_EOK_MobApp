import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { ArtCover, RemoteImage } from '@/components';
import { env } from '@/config/env';
import type { RwaEvent } from '@/types/models';
import { EVENT_ICON } from './icons';

/** Absolute URL for a cover: website-relative paths resolve against the API origin. */
export function coverUrl(cover: string | null | undefined): string | null {
  if (!cover) return null;
  if (/^https:\/\//.test(cover) || (__DEV__ && /^http:\/\//.test(cover))) return cover;
  if (cover.startsWith('/') && !cover.startsWith('//')) return `${env.API_BASE_URL}${cover}`;
  return null;
}

/** Event photo when available, otherwise a themed illustrated cover for its category. */
export function EventCover({ event, style }: { event: Pick<RwaEvent, 'id' | 'coverImage' | 'category'>; style?: StyleProp<ViewStyle> }) {
  const uri = coverUrl(event.coverImage);
  return uri ? (
    <RemoteImage uri={uri} style={style} accessibilityIgnoresInvertColors />
  ) : (
    <ArtCover seed={event.id} icon={EVENT_ICON[event.category]} style={style} />
  );
}
