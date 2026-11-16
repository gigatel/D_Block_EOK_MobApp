/* eslint-env jest */
/**
 * Lightweight Reanimated 4 test double. The official mock currently initialises
 * the native module under @react-native/jest-preset (RN 0.88) and crashes, so
 * tests use this instead: animations resolve to their final value immediately,
 * layout-animation builders are chainable no-ops.
 */
const React = require('react');
const RN = require('react-native');

const identity = v => v;
const chain = () => {
  const target = function () {};
  const proxy = new Proxy(target, {
    get: (_t, prop) => (prop === 'build' ? () => ({}) : () => proxy),
    apply: () => proxy,
  });
  return proxy;
};
const createAnimatedComponent = Component =>
  React.forwardRef((props, ref) => {
    const { entering: _e, exiting: _x, layout: _l, animatedProps, ...rest } = props;
    return React.createElement(Component, { ...rest, ...(animatedProps || {}), ref });
  });

const Easing = new Proxy(
  {},
  { get: () => (...args) => (typeof args[0] === 'function' ? args[0] : identity) },
);

const Animated = {
  View: createAnimatedComponent(RN.View),
  Text: createAnimatedComponent(RN.Text),
  Image: createAnimatedComponent(RN.Image),
  ScrollView: createAnimatedComponent(RN.ScrollView),
  FlatList: createAnimatedComponent(RN.FlatList),
  createAnimatedComponent,
};

const layoutNames = [
  'FadeIn', 'FadeOut', 'FadeInDown', 'FadeInUp', 'FadeOutDown', 'FadeOutUp', 'FadeInLeft', 'FadeInRight',
  'SlideInDown', 'SlideInUp', 'SlideOutDown', 'SlideOutUp', 'SlideInRight', 'SlideInLeft', 'SlideOutLeft', 'SlideOutRight',
  'ZoomIn', 'ZoomOut', 'ZoomInDown', 'BounceIn', 'LinearTransition', 'Layout', 'FadingTransition', 'CurvedTransition',
];
const layout = Object.fromEntries(layoutNames.map(n => [n, chain()]));

module.exports = {
  __esModule: true,
  default: Animated,
  ...Animated,
  ...layout,
  Easing,
  useSharedValue: v => {
    const ref = React.useRef({ value: v });
    return ref.current;
  },
  useAnimatedStyle: fn => fn(),
  useAnimatedProps: fn => fn(),
  useDerivedValue: fn => ({ value: fn() }),
  useAnimatedReaction: () => undefined,
  useAnimatedRef: () => React.useRef(null),
  useAnimatedScrollHandler: () => () => undefined,
  useScrollOffset: () => ({ value: 0 }),
  useReducedMotion: () => false,
  useFrameCallback: () => ({ setActive: () => undefined, isActive: false }),
  withTiming: (v, _c, cb) => {
    cb && cb(true);
    return v;
  },
  withSpring: (v, _c, cb) => {
    cb && cb(true);
    return v;
  },
  withDelay: (_d, v) => v,
  withRepeat: v => v,
  withSequence: (...vs) => vs[vs.length - 1],
  withDecay: () => 0,
  cancelAnimation: () => undefined,
  runOnJS: fn => fn,
  runOnUI: fn => fn,
  scheduleOnRN: (fn, ...args) => fn(...args),
  interpolate: (_v, _i, output) => output[0],
  interpolateColor: (_v, _i, output) => output[0],
  Extrapolation: { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' },
  Extrapolate: { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' },
  ReduceMotion: { System: 'system', Always: 'always', Never: 'never' },
  measure: () => null,
  makeMutable: v => ({ value: v }),
};
