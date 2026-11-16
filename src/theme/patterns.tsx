/**
 * Built-in SVG pattern library. Patterns are chosen by KEY only and drawn with
 * the sanitised theme colour — the server can never supply SVG markup here.
 */
import React, { memo, useId } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  Path,
  Pattern,
  Rect,
} from 'react-native-svg';
import type { PatternKey } from './types';

export type PatternBackgroundProps = {
  pattern: PatternKey;
  /** Sanitised theme colour (#RRGGBB) used for the motif. */
  color: string;
  opacity?: number;
  style?: StyleProp<ViewStyle>;
};

type Tile = { w: number; h: number; draw: (c: string) => React.ReactNode };

const petals = (
  cx: number,
  cy: number,
  n: number,
  rx: number,
  ry: number,
  dist: number,
  c: string,
  sw = 1.2,
) =>
  Array.from({ length: n }, (_, i) => (
    <Ellipse
      key={i}
      cx={cx}
      cy={cy - dist}
      rx={rx}
      ry={ry}
      stroke={c}
      strokeWidth={sw}
      fill="none"
      transform={`rotate(${(360 / n) * i} ${cx} ${cy})`}
    />
  ));

/** Repeating tiles (userSpaceOnUse). Sunburst is a full-size composition instead. */
const TILES: Record<Exclude<PatternKey, 'none' | 'sunburst'>, Tile> = {
  dots: { w: 18, h: 18, draw: c => <Circle cx={9} cy={9} r={1.6} fill={c} /> },
  paisley: {
    w: 56,
    h: 56,
    draw: c => (
      <G>
        <Path
          d="M18 40 C6 36 6 18 18 12 C28 7 36 16 32 24 C29 30 22 29 22 24 C22 21 25 20 27 22"
          stroke={c}
          strokeWidth={1.3}
          fill="none"
          strokeLinecap="round"
        />
        <Circle cx={18} cy={26} r={2} fill={c} />
        <Circle cx={44} cy={46} r={1.5} fill={c} />
        <Circle cx={46} cy={10} r={1} fill={c} />
      </G>
    ),
  },
  rangoli: {
    w: 64,
    h: 64,
    draw: c => (
      <G>
        {petals(32, 32, 8, 4, 9, 11, c)}
        <Circle
          cx={32}
          cy={32}
          r={4}
          stroke={c}
          strokeWidth={1.2}
          fill="none"
        />
        <Circle cx={32} cy={32} r={1.6} fill={c} />
        <Circle cx={0} cy={0} r={2} fill={c} />
        <Circle cx={64} cy={0} r={2} fill={c} />
        <Circle cx={0} cy={64} r={2} fill={c} />
        <Circle cx={64} cy={64} r={2} fill={c} />
      </G>
    ),
  },
  lattice: {
    w: 28,
    h: 28,
    draw: c => (
      <Path
        d="M0 14 L14 0 L28 14 L14 28 Z"
        stroke={c}
        strokeWidth={1}
        fill="none"
      />
    ),
  },
  confetti: {
    w: 64,
    h: 64,
    draw: c => (
      <G fill={c}>
        <Rect
          x={6}
          y={8}
          width={6}
          height={3}
          rx={1}
          transform="rotate(25 9 9)"
        />
        <Rect
          x={40}
          y={14}
          width={5}
          height={3}
          rx={1}
          transform="rotate(-35 42 15)"
        />
        <Circle cx={26} cy={30} r={2} />
        <Rect
          x={50}
          y={44}
          width={6}
          height={3}
          rx={1}
          transform="rotate(60 53 45)"
        />
        <Rect
          x={12}
          y={48}
          width={5}
          height={3}
          rx={1}
          transform="rotate(-15 14 49)"
        />
        <Circle cx={56} cy={6} r={1.5} />
        <Circle cx={34} cy={56} r={1.8} />
      </G>
    ),
  },
  chakra: {
    w: 72,
    h: 72,
    draw: c => (
      <G stroke={c} fill="none">
        <Circle cx={36} cy={36} r={20} strokeWidth={1.3} />
        <Circle cx={36} cy={36} r={3} strokeWidth={1.3} />
        {Array.from({ length: 12 }, (_, i) => {
          const a = (Math.PI * 2 * i) / 12;
          return (
            <Line
              key={i}
              x1={36 + Math.cos(a) * 3}
              y1={36 + Math.sin(a) * 3}
              x2={36 + Math.cos(a) * 20}
              y2={36 + Math.sin(a) * 20}
              strokeWidth={0.9}
            />
          );
        })}
      </G>
    ),
  },
  snowflakes: {
    w: 56,
    h: 56,
    draw: c => (
      <G stroke={c} strokeWidth={1.1} strokeLinecap="round">
        {[0, 60, 120].map(r => (
          <G key={r} transform={`rotate(${r} 20 20)`}>
            <Line x1={20} y1={10} x2={20} y2={30} />
            <Line x1={20} y1={13} x2={17} y2={10} />
            <Line x1={20} y1={13} x2={23} y2={10} />
            <Line x1={20} y1={27} x2={17} y2={30} />
            <Line x1={20} y1={27} x2={23} y2={30} />
          </G>
        ))}
        <Circle cx={46} cy={46} r={1.5} fill={c} stroke="none" />
      </G>
    ),
  },
  raindrops: {
    w: 32,
    h: 40,
    draw: c => (
      <G fill={c}>
        <Path d="M8 6 C8 6 4 12 4 14.5 A4 4 0 0 0 12 14.5 C12 12 8 6 8 6 Z" />
        <Path d="M24 24 C24 24 21 28.5 21 30.5 A3 3 0 0 0 27 30.5 C27 28.5 24 24 24 24 Z" />
      </G>
    ),
  },
  leaves: {
    w: 56,
    h: 56,
    draw: c => (
      <G stroke={c} strokeWidth={1.2} fill="none" strokeLinecap="round">
        <Path d="M12 36 C12 22 24 14 36 12 C34 26 26 36 12 36 Z" />
        <Path d="M12 36 L30 18" />
        <Path
          d="M40 52 C40 46 45 42 50 41 C49 47 46 51 40 52 Z"
          transform="rotate(20 45 46)"
        />
      </G>
    ),
  },
  blossom: {
    w: 48,
    h: 48,
    draw: c => (
      <G>
        {Array.from({ length: 5 }, (_, i) => {
          const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
          return (
            <Circle
              key={i}
              cx={18 + Math.cos(a) * 5}
              cy={18 + Math.sin(a) * 5}
              r={4}
              fill={c}
              fillOpacity={0.55}
            />
          );
        })}
        <Circle cx={18} cy={18} r={2.2} fill={c} />
        <Circle cx={40} cy={40} r={1.6} fill={c} />
      </G>
    ),
  },
  waves: {
    w: 80,
    h: 24,
    draw: c => (
      <Path
        d="M0 12 C10 4 30 4 40 12 C50 20 70 20 80 12"
        stroke={c}
        strokeWidth={1.2}
        fill="none"
      />
    ),
  },
};

function Sunburst({ color }: { color: string }) {
  const rays = 18;
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMaxYMin slice"
    >
      <G fill={color}>
        {Array.from({ length: rays }, (_, i) => {
          const a1 = (Math.PI * 2 * i) / rays;
          const a2 = a1 + Math.PI / rays;
          const R = 160;
          return (
            <Path
              key={i}
              d={`M100 0 L${100 + Math.cos(a1) * R} ${Math.sin(a1) * R} L${
                100 + Math.cos(a2) * R
              } ${Math.sin(a2) * R} Z`}
              fillOpacity={0.5}
            />
          );
        })}
        <Circle cx={100} cy={0} r={14} />
      </G>
    </Svg>
  );
}

function PatternBackgroundImpl({
  pattern,
  color,
  opacity = 0.12,
  style,
}: PatternBackgroundProps) {
  const rawId = useId();
  const id = `pt${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;
  if (pattern === 'none') {
    return null;
  }
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[StyleSheet.absoluteFill, { opacity }, style]}
    >
      {pattern === 'sunburst' ? (
        <Sunburst color={color} />
      ) : (
        <Svg width="100%" height="100%">
          <Defs>
            <Pattern
              id={id}
              patternUnits="userSpaceOnUse"
              width={TILES[pattern].w}
              height={TILES[pattern].h}
            >
              {TILES[pattern].draw(color)}
            </Pattern>
          </Defs>
          <Rect x={0} y={0} width="100%" height="100%" fill={`url(#${id})`} />
        </Svg>
      )}
    </View>
  );
}

/** Absolutely-filling, non-interactive themed pattern. Memoised: re-renders only on prop change. */
export const PatternBackground = memo(PatternBackgroundImpl);
