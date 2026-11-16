/* eslint-disable react-native/no-inline-styles -- geometry is computed per layout */
/**
 * Festival decorations (Diwali, Holi, national days, Basant).
 * Static SVG artwork animated only via transforms/opacity on the UI thread.
 */
import React, { memo, useId, useMemo } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedStyle } from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import { useTheme } from '../ThemeProvider';
import { FESTIVE, rand, useLoop, type DecoProps } from './shared';

// ---- Marigold garland ---------------------------------------------------------
export const MarigoldGarland = memo(function MarigoldGarlandImpl({
  width,
  height,
  active,
  reduce,
  strip,
}: DecoProps) {
  const v = useLoop(active, reduce, 3400, {
    reverse: true,
    easing: Easing.inOut(Easing.sin),
  });
  const sag = strip ? 16 : Math.min(46, height * 0.15);
  const h = sag + 26;
  const { flowers, path } = useMemo(() => {
    const out: { x: number; y: number; deep: boolean }[] = [];
    let d = '';
    for (let k = 0; k < 2; k++) {
      const x0 = (k * width) / 2;
      const x1 = ((k + 1) * width) / 2;
      d += `M${x0} 6 Q${(x0 + x1) / 2} ${6 + sag * 2} ${x1} 6 `;
      for (let i = 0; i <= 8; i++) {
        const t = i / 8;
        out.push({
          x: x0 + (x1 - x0) * t,
          y: 6 + sag * Math.sin(Math.PI * t),
          deep: i % 2 === 1,
        });
      }
    }
    return { flowers: out, path: d };
  }, [width, sag]);
  const sway = useAnimatedStyle(() => ({
    transform: [{ rotate: `${(v.value - 0.5) * 2.2}deg` }],
  }));
  return (
    <Animated.View
      style={[
        { position: 'absolute', left: 0, top: -2, width, height: h },
        sway,
      ]}
    >
      <Svg width={width} height={h}>
        <Path d={path} stroke={FESTIVE.leaf} strokeWidth={2} fill="none" />
        {flowers.map((f, i) => (
          <G key={i}>
            <Circle
              cx={f.x}
              cy={f.y + 2}
              r={7.5}
              fill={f.deep ? FESTIVE.marigoldDeep : FESTIVE.marigold}
            />
            <Circle
              cx={f.x}
              cy={f.y + 2}
              r={3.2}
              fill={f.deep ? FESTIVE.marigold : FESTIVE.marigoldDeep}
            />
          </G>
        ))}
      </Svg>
    </Animated.View>
  );
});

// ---- Diya row -----------------------------------------------------------------------
const Diya = memo(function DiyaImpl({
  x,
  y,
  size,
  i,
  active,
  reduce,
}: {
  x: number;
  y: number;
  size: number;
  i: number;
  active: boolean;
  reduce: boolean;
}) {
  const v = useLoop(active, reduce, 380 + i * 70, {
    reverse: true,
    easing: Easing.inOut(Easing.quad),
  });
  const flame = useAnimatedStyle(() => ({
    opacity: 0.78 + v.value * 0.22,
    transform: [
      { scaleY: 0.86 + v.value * 0.22 },
      { scaleX: 1.04 - v.value * 0.08 },
    ],
  }));
  const fw = size * 0.5;
  const fh = size * 0.8;
  return (
    <View
      style={{
        position: 'absolute',
        left: x - size / 2,
        top: y - fh,
        width: size,
        height: fh + size * 0.5,
      }}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: (size - fw) / 2,
            top: 0,
            width: fw,
            height: fh,
          },
          flame,
        ]}
      >
        <Svg width={fw} height={fh} viewBox="0 0 20 32">
          <Circle
            cx={10}
            cy={20}
            r={9}
            fill={FESTIVE.flame}
            fillOpacity={0.28}
          />
          <Path
            d="M10 2 C14 10 16 16 16 21 A6 6 0 0 1 4 21 C4 16 6 10 10 2 Z"
            fill={FESTIVE.flame}
          />
          <Path
            d="M10 12 C12 16 13 19 13 22 A3 3 0 0 1 7 22 C7 19 8 16 10 12 Z"
            fill={FESTIVE.flameCore}
          />
        </Svg>
      </Animated.View>
      <Svg
        width={size}
        height={size * 0.5}
        viewBox="0 0 40 20"
        style={{ position: 'absolute', top: fh - 4 }}
      >
        <Path
          d="M2 4 L38 4 C36 14 28 19 20 19 C12 19 4 14 2 4 Z"
          fill={FESTIVE.clay}
        />
        <Path
          d="M2 4 L38 4"
          stroke={FESTIVE.marigold}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <Circle cx={12} cy={11} r={1.6} fill={FESTIVE.marigold} />
        <Circle cx={20} cy={13} r={1.6} fill={FESTIVE.marigold} />
        <Circle cx={28} cy={11} r={1.6} fill={FESTIVE.marigold} />
      </Svg>
    </View>
  );
});

export const DiyaRow = memo(function DiyaRowImpl({
  width,
  height,
  active,
  reduce,
  strip,
}: DecoProps) {
  const count = strip ? 7 : 5;
  const size = strip ? 26 : Math.max(26, Math.min(40, width * 0.08));
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        if (strip) {
          return { x: ((i + 0.5) * width) / count, y: height - 14 };
        }
        const x0 = width * 0.5;
        const x1 = width * 0.94;
        return {
          x: x0 + ((x1 - x0) * i) / (count - 1),
          y: height * 0.34 + (i % 2) * 6,
        };
      }),
    [count, width, height, strip],
  );
  return (
    <>
      {items.map((p, i) => (
        <Diya
          key={i}
          i={i}
          x={p.x}
          y={p.y}
          size={size}
          active={active}
          reduce={reduce}
        />
      ))}
    </>
  );
});

// ---- Fireworks -----------------------------------------------------------------------
const Burst = memo(function BurstImpl({
  cx,
  cy,
  r,
  color,
  alt,
  delay,
  active,
  reduce,
}: {
  cx: number;
  cy: number;
  r: number;
  color: string;
  alt: string;
  delay: number;
  active: boolean;
  reduce: boolean;
}) {
  const v = useLoop(active, reduce, 2400, {
    delay,
    easing: Easing.out(Easing.cubic),
    staticValue: 0.55,
  });
  const s = useAnimatedStyle(() => ({
    opacity:
      v.value < 0.12
        ? v.value / 0.12
        : Math.max(0, 1 - (v.value - 0.12) / 0.88),
    transform: [{ scale: 0.15 + v.value * 0.85 }],
  }));
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: cx - r,
          top: cy - r,
          width: r * 2,
          height: r * 2,
        },
        s,
      ]}
    >
      <Svg width={r * 2} height={r * 2} viewBox="-50 -50 100 100">
        {Array.from({ length: 8 }, (_, i) => {
          const a = (Math.PI * 2 * i) / 8;
          const c = i % 2 ? alt : color;
          return (
            <G key={i}>
              <Line
                x1={Math.cos(a) * 18}
                y1={Math.sin(a) * 18}
                x2={Math.cos(a) * 36}
                y2={Math.sin(a) * 36}
                stroke={c}
                strokeWidth={2.2}
                strokeLinecap="round"
              />
              <Circle
                cx={Math.cos(a) * 43}
                cy={Math.sin(a) * 43}
                r={3.6}
                fill={c}
              />
            </G>
          );
        })}
      </Svg>
    </Animated.View>
  );
});

export const Fireworks = memo(function FireworksImpl({
  width,
  height,
  active,
  reduce,
  strip,
}: DecoProps) {
  const theme = useTheme();
  const bursts = strip
    ? [
        { x: 0.78, y: 0.45, r: 28, d: 0 },
        { x: 0.92, y: 0.4, r: 22, d: 1100 },
      ]
    : [
        { x: 0.74, y: 0.2, r: width * 0.15, d: 0 },
        { x: 0.9, y: 0.36, r: width * 0.1, d: 1200 },
      ];
  return (
    <>
      {bursts.map((b, i) => (
        <Burst
          key={i}
          cx={width * b.x}
          cy={height * b.y}
          r={b.r}
          delay={b.d}
          color={theme.colors.accent}
          alt={i ? FESTIVE.white : FESTIVE.marigold}
          active={active}
          reduce={reduce}
        />
      ))}
    </>
  );
});

// ---- Colour splash (Holi gulal) ---------------------------------------------------------
const Blob = memo(function BlobImpl({
  x,
  y,
  r,
  color,
  i,
  active,
  reduce,
}: {
  x: number;
  y: number;
  r: number;
  color: string;
  i: number;
  active: boolean;
  reduce: boolean;
}) {
  const id = `g${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const v = useLoop(active, reduce, 2600 + i * 500, {
    reverse: true,
    easing: Easing.inOut(Easing.sin),
    staticValue: rand(i, 3),
  });
  const s = useAnimatedStyle(() => ({
    opacity: 0.55 + v.value * 0.35,
    transform: [{ scale: 0.88 + v.value * 0.2 }],
  }));
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x - r,
          top: y - r,
          width: r * 2,
          height: r * 2,
        },
        s,
      ]}
    >
      <Svg width={r * 2} height={r * 2}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={color} stopOpacity={0.85} />
            <Stop offset="0.6" stopColor={color} stopOpacity={0.35} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={r} cy={r} r={r} fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  );
});

export const ColourSplash = memo(function ColourSplashImpl({
  width,
  height,
  active,
  reduce,
  strip,
}: DecoProps) {
  const blobs = useMemo(
    () =>
      FESTIVE.gulal.map((color, i) => ({
        color,
        x: width * (0.45 + rand(i, 7) * 0.55),
        y: (strip ? height * 0.5 : height * 0.32) * (0.4 + rand(i, 9) * 1.1),
        r: (strip ? 26 : width * 0.12) * (0.7 + rand(i, 11) * 0.6),
      })),
    [width, height, strip],
  );
  return (
    <>
      {blobs.map((b, i) => (
        <Blob key={i} i={i} {...b} active={active} reduce={reduce} />
      ))}
    </>
  );
});

// ---- Tricolour bunting ---------------------------------------------------------------------
export const TricolourBunting = memo(function TricolourBuntingImpl({
  width,
  height,
  active,
  reduce,
  strip,
}: DecoProps) {
  const v = useLoop(active, reduce, 2800, {
    reverse: true,
    easing: Easing.inOut(Easing.sin),
  });
  const sag = strip ? 10 : Math.min(28, height * 0.09);
  const flagH = strip ? 18 : 24;
  const h = sag + flagH + 12;
  const flags = useMemo(() => {
    const n = Math.max(8, Math.round(width / 34));
    const colors = [FESTIVE.saffron, FESTIVE.white, FESTIVE.green];
    return Array.from({ length: n }, (_, i) => {
      const t = (i + 0.5) / n;
      const x = width * t;
      const y = 4 + sag * Math.sin(Math.PI * t);
      return { x, y, color: colors[i % 3] };
    });
  }, [width, sag]);
  const fw = Math.min(26, (width / flags.length) * 0.8);
  const sway = useAnimatedStyle(() => ({
    transform: [{ rotate: `${(v.value - 0.5) * 1.6}deg` }],
  }));
  return (
    <Animated.View
      style={[
        { position: 'absolute', left: 0, top: 0, width, height: h },
        sway,
      ]}
    >
      <Svg width={width} height={h}>
        <Path
          d={`M0 4 Q${width / 2} ${4 + sag * 2} ${width} 4`}
          stroke="#B9B2A3"
          strokeWidth={1.4}
          fill="none"
        />
        {flags.map((f, i) => (
          <Path
            key={i}
            d={`M${f.x - fw / 2} ${f.y} L${f.x + fw / 2} ${f.y} L${f.x} ${
              f.y + flagH
            } Z`}
            fill={f.color}
            stroke={f.color === FESTIVE.white ? '#D9D3C5' : 'none'}
            strokeWidth={0.8}
          />
        ))}
      </Svg>
    </Animated.View>
  );
});

// ---- Kites ------------------------------------------------------------------------------------
const Kite = memo(function KiteImpl({
  x,
  y,
  size,
  color,
  i,
  active,
  reduce,
}: {
  x: number;
  y: number;
  size: number;
  color: string;
  i: number;
  active: boolean;
  reduce: boolean;
}) {
  const v = useLoop(active, reduce, 3800 + i * 900, {
    reverse: true,
    easing: Easing.inOut(Easing.sin),
    staticValue: rand(i, 5),
  });
  const s = useAnimatedStyle(() => ({
    transform: [
      { translateX: (v.value - 0.5) * 20 },
      { translateY: -Math.sin(v.value * Math.PI) * 10 },
      { rotate: `${(v.value - 0.5) * 16}deg` },
    ],
  }));
  const w = size;
  const h = size * 2.4;
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x - w / 2,
          top: y - size * 0.6,
          width: w * 1.6,
          height: h,
        },
        s,
      ]}
    >
      <Svg width={w * 1.6} height={h} viewBox="0 0 48 72">
        <Path d="M16 2 L30 18 L16 36 L2 18 Z" fill={color} />
        <Path
          d="M16 2 L16 36 M2 18 L30 18"
          stroke="#FFFFFF"
          strokeOpacity={0.55}
          strokeWidth={1}
        />
        <Path
          d="M16 36 C20 44 12 50 18 58"
          stroke={color}
          strokeWidth={1.4}
          fill="none"
        />
        <Path
          d="M16 36 C30 46 38 60 46 72"
          stroke="#FFFFFF"
          strokeOpacity={0.45}
          strokeWidth={0.7}
          fill="none"
        />
      </Svg>
    </Animated.View>
  );
});

export const Kites = memo(function KitesImpl({
  width,
  height,
  active,
  reduce,
  strip,
}: DecoProps) {
  const theme = useTheme();
  const colors = [theme.colors.accent, FESTIVE.saffron, theme.colors.secondary];
  const spots = strip
    ? [
        { x: 0.7, y: 0.35 },
        { x: 0.86, y: 0.25 },
      ]
    : [
        { x: 0.66, y: 0.16 },
        { x: 0.84, y: 0.1 },
        { x: 0.92, y: 0.3 },
      ];
  const size = strip ? 18 : Math.max(22, width * 0.065);
  return (
    <>
      {spots.map((p, i) => (
        <Kite
          key={i}
          i={i}
          x={width * p.x}
          y={height * p.y + (strip ? 0 : 20)}
          size={size}
          color={colors[i % 3]}
          active={active}
          reduce={reduce}
        />
      ))}
    </>
  );
});
