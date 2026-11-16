import React from 'react';
import { StyleSheet, View } from 'react-native';

/** Overlapping colour dots for theme cards. */
export function SwatchRow({
  colors,
  size = 22,
}: {
  colors: string[];
  size?: number;
}) {
  return (
    <View
      style={styles.row}
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      {colors.map((c, i) => (
        <View
          key={`${c}-${i}`}
          style={[
            styles.dot,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: c,
              marginLeft: i ? -size / 4 : 0,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  dot: { borderWidth: 2, borderColor: '#FFFFFF' },
});
