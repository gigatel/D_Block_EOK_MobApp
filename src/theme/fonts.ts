import { Platform, TextStyle } from 'react-native';
import type { FontName, HeadingWeight } from './types';

/**
 * Maps whitelisted theme fonts to platform font families.
 *
 * Phase 1: the Google fonts are NOT bundled yet, so each whitelisted font maps
 * to the closest system family (serif vs sans). To bundle them later, add the
 * .ttf files to src/assets/fonts, link with `npx react-native-asset`, and set
 * the real family names in BUNDLED below — no other code needs to change.
 */
const SERIF = new Set<FontName>([
  'Playfair Display',
  'Cormorant Garamond',
  'Lora',
  'Tiro Devanagari Hindi',
  'Yatra One',
]);

/** Fill in when fonts are bundled: e.g. { 'Inter': 'Inter' }. */
const BUNDLED: Partial<Record<FontName, string>> = {};

export function fontFamilyFor(font: FontName): string | undefined {
  if (BUNDLED[font]) {
    return BUNDLED[font];
  }
  if (SERIF.has(font)) {
    return Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });
  }
  return undefined; // system sans (Roboto / SF Pro)
}

export function weightFor(weight: HeadingWeight): TextStyle['fontWeight'] {
  return String(weight) as TextStyle['fontWeight'];
}
