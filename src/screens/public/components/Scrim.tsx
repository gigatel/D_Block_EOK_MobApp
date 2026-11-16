import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

/** Bottom-weighted dark gradient for legible white text over photos. */
export function Scrim({
  from = 0,
  to = 0.75,
  color = '#000000',
}: {
  from?: number;
  to?: number;
  color?: string;
}) {
  return (
    <Svg
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      preserveAspectRatio="none"
      width="100%"
      height="100%"
    >
      <Defs>
        <LinearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity={from} />
          <Stop
            offset="0.45"
            stopColor={color}
            stopOpacity={from + (to - from) * 0.25}
          />
          <Stop offset="1" stopColor={color} stopOpacity={to} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#scrim)" />
    </Svg>
  );
}
