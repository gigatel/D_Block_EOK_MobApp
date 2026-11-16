import React from 'react';
import { StyleSheet, View } from 'react-native';
import { initials } from '@/features/data/selectors';
import { Text } from './Text';

export function Avatar({ name, color = '#1F5A3A', size = 44 }: { name: string; color?: string; size?: number }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={[styles.base, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
      <Text style={{ color: '#FFFFFF', fontSize: size * 0.38, lineHeight: size * 0.46, fontWeight: '700' }}>
        {initials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({ base: { alignItems: 'center', justifyContent: 'center' } });
