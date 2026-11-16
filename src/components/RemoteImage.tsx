import React, { useState } from 'react';
import { Image, ImageProps, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { ImageOff } from 'lucide-react-native';
import { useReduceMotion, useTheme } from '@/theme';
import { Icon } from './Icon';

export type RemoteImageProps = Omit<ImageProps, 'source' | 'style'> & {
  uri: string;
  /** Phase 3: `Authorization` header for private media. */
  headers?: Record<string, string>;
  style?: StyleProp<ViewStyle>;
  radius?: number;
};

/** Network image with themed placeholder, fade-in and an error state. */
export function RemoteImage({ uri, headers, style, radius = 0, resizeMode = 'cover', ...rest }: RemoteImageProps) {
  const theme = useTheme();
  const reduce = useReduceMotion();
  const [failed, setFailed] = useState(false);
  const opacity = useSharedValue(reduce ? 1 : 0);
  const fade = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <View style={[{ backgroundColor: theme.colors.surfaceAlt, borderRadius: radius, overflow: 'hidden' }, style]}>
      {failed ? (
        <View style={styles.center}>
          <Icon icon={ImageOff} color="muted" />
        </View>
      ) : (
        <Animated.View style={[StyleSheet.absoluteFill, fade]}>
          <Image
            {...rest}
            source={{ uri, headers, cache: 'force-cache' }}
            resizeMode={resizeMode}
            style={StyleSheet.absoluteFill}
            onLoad={() => {
              opacity.value = withTiming(1, { duration: 260 });
            }}
            onError={() => setFailed(true)}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({ center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' } });
