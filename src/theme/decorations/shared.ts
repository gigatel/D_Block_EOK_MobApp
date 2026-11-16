import { useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { NavigationContext } from '@react-navigation/native';
import {
  cancelAnimation,
  Easing,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
  type EasingFunction,
  type SharedValue,
} from 'react-native-reanimated';

/** Props every decoration receives from DecorationLayer. */
export type DecoProps = {
  width: number;
  height: number;
  /** Animations run only while active (not paused, focused, app in foreground). */
  active: boolean;
  /** Reduce motion: render a static frame. */
  reduce: boolean;
  strip: boolean;
  /** Ink for weather/neutral effects: light on dark heroes, theme colour on light bands. */
  ink: string;
};

/** Deterministic pseudo-random in [0, 1) — stable layouts across renders. */
export function rand(i: number, salt = 1): number {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

type LoopOpts = {
  delay?: number;
  /** Ping-pong (0→1→0) instead of restarting at 0. */
  reverse?: boolean;
  easing?: EasingFunction;
  /** Value shown when motion is reduced (spread particles with different values). */
  staticValue?: number;
};

/**
 * A 0→1 looping shared value driven on the UI thread. Pauses (cancels) when
 * inactive and freezes on `staticValue` when reduce-motion is on.
 */
export function useLoop(
  active: boolean,
  reduce: boolean,
  duration: number,
  {
    delay = 0,
    reverse = false,
    easing = Easing.linear,
    staticValue = 0.5,
  }: LoopOpts = {},
): SharedValue<number> {
  const v = useSharedValue(reduce ? staticValue : 0);
  useEffect(() => {
    if (reduce) {
      cancelAnimation(v);
      v.value = staticValue;
      return undefined;
    }
    if (!active) {
      cancelAnimation(v);
      return undefined;
    }
    v.value = reverse ? v.value : 0;
    v.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration, easing }), -1, reverse),
    );
    return () => cancelAnimation(v);
  }, [active, reduce, duration, delay, reverse, easing, staticValue, v]);
  return v;
}

/** Focus state that also works outside a navigator (assumes focused there). */
export function useSafeIsFocused(): boolean {
  const navigation = useContext(NavigationContext);
  const [focused, setFocused] = useState(() =>
    navigation ? navigation.isFocused() : true,
  );
  useEffect(() => {
    if (!navigation) return undefined;
    setFocused(navigation.isFocused());
    const a = navigation.addListener('focus', () => setFocused(true));
    const b = navigation.addListener('blur', () => setFocused(false));
    return () => {
      a();
      b();
    };
  }, [navigation]);
  return focused;
}

export function useAppActive(): boolean {
  const [active, setActive] = useState(AppState.currentState !== 'background');
  useEffect(() => {
    const sub = AppState.addEventListener('change', s =>
      setActive(s === 'active'),
    );
    return () => sub.remove();
  }, []);
  return active;
}

export const FESTIVE = {
  marigold: '#F59E0B',
  marigoldDeep: '#EA580C',
  leaf: '#3F7D32',
  saffron: '#FF9933',
  white: '#FFFFFF',
  green: '#138808',
  navy: '#000080',
  flame: '#FFC94A',
  flameCore: '#FFF4C2',
  clay: '#8A3B12',
  gulal: ['#EC4899', '#F59E0B', '#3B82F6', '#22C55E', '#A855F7'],
  petals: ['#F9A8D4', '#FDE68A', '#FBCFE8'],
  autumn: ['#C2410C', '#D97706', '#A16207', '#B45309'],
};
