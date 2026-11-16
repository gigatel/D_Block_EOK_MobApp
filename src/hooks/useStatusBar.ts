import { useCallback } from 'react';
import { StatusBar } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

/** Light status-bar icons while this screen is focused (for dark heroes/images). */
export function useLightStatusBar(enabled = true): void {
  useFocusEffect(
    useCallback(() => {
      if (!enabled) return undefined;
      StatusBar.setBarStyle('light-content', true);
      return () => StatusBar.setBarStyle('dark-content', true);
    }, [enabled]),
  );
}
