/* eslint-disable react-native/no-inline-styles -- geometry is computed per layout */
/**
 * Weather and nature decorations. Falling particles share one primitive
 * (`Faller`) whose phase offset spreads them out, so nothing "pops in".
 */
import React, { memo, useId, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle } from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';
import { useTheme } from '../ThemeProvider';
import { FESTIVE, rand, useLoop, type DecoProps } from './shared';

type FallerProps = {
  x: number;
  size: number;
  height: number;
  duration: number;
  /** 0–1 start offset so particles are distributed. */
  phase: number;
  /** Horizontal sine sway amplitude (px). */
  sway?: number;
  /** Linear horizontal drift over one fall (px), e.g. slanted rain. */
  drift?: number;
  /** Degrees rotated over one fall. */
  spin?: number;
  /** Fixed rotation (deg). */
  tilt?: number;
  opacity?: number;
  active: boolean;
  reduce: boolean;
  children: React.ReactNode;
};

const Faller = memo(function FallerImpl({
  x,
  size,
  height,
  duration,
  phase,
  sway = 0,
  drift = 0,
  spin = 0,
  tilt = 0,
  opacity = 1,
  active,
  reduce,
  children,
}: FallerProps) {
  const v = useLoop(active, reduce, duration, { staticValue: 0 });
  const s = useAnimatedStyle(() => {
    const p = (v.value + phase) % 1;
    return {
      opacity,
      transform: [
        { translateY: -size * 2 + p * (height + size * 4) },
        {
          translateX: Math.sin(p * Math.PI * 3 + phase * 6) * sway + p * drift,
        },
        { rotate: `${tilt + p * spin}deg` },
      ],
    };
  });
  return (
    <Animated.View
      style={[
        { position: 'absolute', left: x, top: 0, width: size, height: size },
        s,
      ]}
    >
      {children}
    </Animated.View>
  );
});

// ---- Snowfall --------------------------------------------------------------------------------
export const Snowfall = memo(function SnowfallImpl({
  width,
  height,
  active,
  reduce,
  strip,
  ink,
}: DecoProps) {
  const n = strip ? 10 : 16;
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const size = 4 + rand(i, 2) * 6;
        return (
          <Faller
            key={i}
            x={rand(i, 1) * width}
            size={size}
            height={height}
            duration={6000 + rand(i, 3) * 5000}
            phase={rand(i, 4)}
            sway={10}
            opacity={0.55 + rand(i, 5) * 0.4}
            active={active}
            reduce={reduce}
          >
            <View
              style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: ink,
              }}
            />
          </Faller>
        );
      })}
    </>
  );
});

// ---- Rain -------------------------------------------------------------------------------------
export const Rain = memo(function RainImpl({
  width,
  height,
  active,
  reduce,
  strip,
  ink,
}: DecoProps) {
  const n = strip ? 12 : 18;
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const len = 14 + rand(i, 2) * 12;
        return (
          <Faller
            key={i}
            x={rand(i, 1) * (width + 40)}
            size={len}
            height={height}
            duration={800 + rand(i, 3) * 600}
            phase={rand(i, 4)}
            drift={-height * 0.26}
            tilt={15}
            opacity={0.35 + rand(i, 5) * 0.3}
            active={active}
            reduce={reduce}
          >
            <View
              style={{
                width: 1.6,
                height: len,
                borderRadius: 1,
                backgroundColor: ink,
              }}
            />
          </Faller>
        );
      })}
    </>
  );
});

// ---- Lightning ------------------------------------------------------------------------------
export const Lightning = memo(function LightningImpl({
  width,
  height,
  active,
  reduce,
}: DecoProps) {
  const v = useLoop(active, reduce, 5200, { staticValue: 0 });
  const flash = useAnimatedStyle(() => {
    const t = v.value;
    const o = t > 0.7 && t < 0.72 ? 0.55 : t > 0.75 && t < 0.775 ? 0.32 : 0;
    return { opacity: o };
  });
  const bw = Math.min(70, width * 0.16);
  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, flash]}
    >
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: '#FFFFFF', opacity: 0.6 },
        ]}
      />
      <Svg
        width={bw}
        height={bw * 2}
        viewBox="0 0 40 80"
        style={{ position: 'absolute', left: width * 0.72, top: height * 0.04 }}
      >
        <Path
          d="M24 0 L6 42 L20 42 L12 80 L36 30 L22 30 L32 0 Z"
          fill="#FFF6C4"
        />
      </Svg>
    </Animated.View>
  );
});

// ---- Fog -------------------------------------------------------------------------------------
const FogBand = memo(function FogBandImpl({
  y,
  h,
  width,
  i,
  ink,
  active,
  reduce,
}: {
  y: number;
  h: number;
  width: number;
  i: number;
  ink: string;
  active: boolean;
  reduce: boolean;
}) {
  const id = `f${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const v = useLoop(active, reduce, 9000 + i * 3000, {
    reverse: true,
    easing: Easing.inOut(Easing.sin),
    staticValue: rand(i, 8),
  });
  const s = useAnimatedStyle(() => ({
    transform: [{ translateX: (v.value - 0.5) * width * 0.35 }],
  }));
  const w = width * 1.5;
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: -width * 0.25,
          top: y,
          width: w,
          height: h,
        },
        s,
      ]}
    >
      <Svg width={w} height={h}>
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={ink} stopOpacity={0} />
            <Stop offset="0.5" stopColor={ink} stopOpacity={0.32} />
            <Stop offset="1" stopColor={ink} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect
          x={0}
          y={0}
          width={w}
          height={h}
          rx={h / 2}
          fill={`url(#${id})`}
        />
      </Svg>
    </Animated.View>
  );
});

export const Fog = memo(function FogImpl({
  width,
  height,
  active,
  reduce,
  strip,
  ink,
}: DecoProps) {
  const bands = strip ? [0.2, 0.6] : [0.12, 0.34, 0.56];
  return (
    <>
      {bands.map((y, i) => (
        <FogBand
          key={i}
          i={i}
          y={height * y}
          h={strip ? 22 : height * 0.16}
          width={width}
          ink={ink}
          active={active}
          reduce={reduce}
        />
      ))}
    </>
  );
});

// ---- Clouds -----------------------------------------------------------------------------------
const Cloud = memo(function CloudImpl({
  y,
  size,
  width,
  i,
  ink,
  active,
  reduce,
}: {
  y: number;
  size: number;
  width: number;
  i: number;
  ink: string;
  active: boolean;
  reduce: boolean;
}) {
  const v = useLoop(active, reduce, 26000 + i * 9000, {
    staticValue: rand(i, 6),
  });
  const phase = rand(i, 9);
  const s = useAnimatedStyle(() => {
    const p = (v.value + phase) % 1;
    return { transform: [{ translateX: -size * 2 + p * (width + size * 2) }] };
  });
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: 0,
          top: y,
          width: size * 2,
          height: size,
        },
        s,
      ]}
    >
      <Svg width={size * 2} height={size} viewBox="0 0 100 50">
        <G fill={ink} fillOpacity={0.3}>
          <Ellipse cx={50} cy={34} rx={46} ry={14} />
          <Circle cx={34} cy={26} r={16} />
          <Circle cx={58} cy={20} r={20} />
          <Circle cx={76} cy={30} r={12} />
        </G>
      </Svg>
    </Animated.View>
  );
});

export const Clouds = memo(function CloudsImpl({
  width,
  height,
  active,
  reduce,
  strip,
  ink,
}: DecoProps) {
  const rows = strip ? [0.1, 0.35] : [0.06, 0.2, 0.34];
  const size = strip ? 34 : Math.max(40, width * 0.14);
  return (
    <>
      {rows.map((y, i) => (
        <Cloud
          key={i}
          i={i}
          y={height * y}
          size={size * (1 - i * 0.12)}
          width={width}
          ink={ink}
          active={active}
          reduce={reduce}
        />
      ))}
    </>
  );
});

// ---- Falling leaves & petals -----------------------------------------------------------------
export const FallingLeaves = memo(function FallingLeavesImpl({
  width,
  height,
  active,
  reduce,
  strip,
}: DecoProps) {
  const theme = useTheme();
  const palette = [...FESTIVE.autumn, theme.colors.accent];
  const n = strip ? 7 : 10;
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const size = 12 + rand(i, 2) * 10;
        return (
          <Faller
            key={i}
            x={rand(i, 1) * width}
            size={size}
            height={height}
            duration={7000 + rand(i, 3) * 5000}
            phase={rand(i, 4)}
            sway={18}
            spin={360 * (rand(i, 6) > 0.5 ? 1 : -1)}
            opacity={0.85}
            active={active}
            reduce={reduce}
          >
            <Svg width={size} height={size} viewBox="0 0 24 24">
              <Path
                d="M4 20 C4 10 10 4 20 4 C20 14 14 20 4 20 Z"
                fill={palette[i % palette.length]}
              />
              <Path
                d="M4 20 L16 8"
                stroke="#FFFFFF"
                strokeOpacity={0.4}
                strokeWidth={1}
              />
            </Svg>
          </Faller>
        );
      })}
    </>
  );
});

export const Petals = memo(function PetalsImpl({
  width,
  height,
  active,
  reduce,
  strip,
}: DecoProps) {
  const theme = useTheme();
  const palette = [...FESTIVE.petals, theme.colors.accent];
  const n = strip ? 8 : 12;
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const size = 8 + rand(i, 2) * 7;
        return (
          <Faller
            key={i}
            x={rand(i, 1) * width}
            size={size}
            height={height}
            duration={6500 + rand(i, 3) * 4500}
            phase={rand(i, 4)}
            sway={14}
            spin={240}
            opacity={0.9}
            active={active}
            reduce={reduce}
          >
            <Svg width={size} height={size} viewBox="0 0 20 20">
              <Ellipse
                cx={10}
                cy={10}
                rx={5}
                ry={9}
                fill={palette[i % palette.length]}
              />
            </Svg>
          </Faller>
        );
      })}
    </>
  );
});

// ---- Sun rays ------------------------------------------------------------------------------------
export const SunRays = memo(function SunRaysImpl({
  width,
  height,
  active,
  reduce,
  strip,
}: DecoProps) {
  const theme = useTheme();
  const id = `s${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const v = useLoop(active, reduce, 60000, { staticValue: 0 });
  const size = strip ? 160 : Math.max(width, height) * 0.9;
  const spin = useAnimatedStyle(() => ({
    transform: [{ rotate: `${v.value * 360}deg` }],
  }));
  const rays = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const a1 = (Math.PI * 2 * i) / 12;
        const a2 = a1 + Math.PI / 18;
        return `M50 50 L${50 + Math.cos(a1) * 50} ${50 + Math.sin(a1) * 50} L${
          50 + Math.cos(a2) * 50
        } ${50 + Math.sin(a2) * 50} Z`;
      }),
    [],
  );
  return (
    <View
      style={{
        position: 'absolute',
        left: width - size / 2,
        top: -size / 2,
        width: size,
        height: size,
      }}
    >
      <Animated.View style={[StyleSheet.absoluteFill, spin]}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <G fill={theme.colors.accent} fillOpacity={0.22}>
            {rays.map((d, i) => (
              <Path key={i} d={d} />
            ))}
          </G>
        </Svg>
      </Animated.View>
      <Svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FFE08A" stopOpacity={0.95} />
            <Stop
              offset="1"
              stopColor={theme.colors.accent}
              stopOpacity={0.85}
            />
          </LinearGradient>
        </Defs>
        <Circle cx={50} cy={50} r={9} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
});
