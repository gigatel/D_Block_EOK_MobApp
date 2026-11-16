import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarDays, House, Images, LayoutGrid, Megaphone, type LucideIcon } from 'lucide-react-native';
import { Icon, Text } from '@/components';
import { useReduceMotion, useTheme } from '@/theme';
import { haptic } from '@/utils/haptics';
import type { TabParamList } from './types';

const ICONS: Record<keyof TabParamList, LucideIcon> = {
  Home: House,
  Events: CalendarDays,
  Gallery: Images,
  Notices: Megaphone,
  More: LayoutGrid,
};

function TabItem({ name, label, focused, onPress, onLongPress }: { name: keyof TabParamList; label: string; focused: boolean; onPress: () => void; onLongPress: () => void }) {
  const theme = useTheme();
  const reduce = useReduceMotion();
  const pill = useAnimatedStyle(() => ({
    opacity: reduce ? (focused ? 1 : 0) : withSpring(focused ? 1 : 0),
    transform: [{ scaleX: reduce ? 1 : withSpring(focused ? 1 : 0.4, { damping: 16 }) }],
  }));
  const lift = useAnimatedStyle(() => ({ transform: [{ translateY: reduce ? 0 : withSpring(focused ? -1 : 0) }] }));
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.item}>
      <Animated.View style={[styles.iconWrap, lift]}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.pill, { backgroundColor: theme.colors.primarySoft }, pill]} />
        <Icon icon={ICONS[name]} size={22} color={focused ? 'primary' : 'muted'} strokeWidth={focused ? 2.3 : 1.9} />
      </Animated.View>
      <Text variant="caption" color={focused ? 'primary' : 'muted'} style={[styles.label, focused && styles.labelOn]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Floating, themed bottom tab bar with an animated active pill. */
export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.bar,
        theme.shadow.raised,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          paddingBottom: Math.max(insets.bottom, 8),
        },
      ]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const { options } = descriptors[route.key];
        const label = typeof options.tabBarLabel === 'string' ? options.tabBarLabel : options.title ?? route.name;
        return (
          <TabItem
            key={route.key}
            name={route.name as keyof TabParamList}
            label={label}
            focused={focused}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) {
                haptic('selection');
                navigation.navigate(route.name, route.params);
              }
            }}
            onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  item: { flex: 1, alignItems: 'center', gap: 2, minHeight: 52 },
  iconWrap: { width: 58, height: 32, alignItems: 'center', justifyContent: 'center' },
  pill: { borderRadius: 16 },
  label: { fontSize: 11, lineHeight: 14 },
  labelOn: { fontWeight: '700' },
});
