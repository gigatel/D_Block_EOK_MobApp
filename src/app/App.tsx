import React, { useEffect } from 'react';
import { AppState, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { AlertHost, PreviewBanner, ToastHost } from '@/components';
import { RootNavigator } from '@/navigation';
import { restoreSession, revalidateSession } from '@/services/auth';
import { queryClient } from '@/services/queryClient';
import { ThemeProvider, useTheme } from '@/theme';
import { ErrorBoundary } from './ErrorBoundary';

// Default status-bar style; screens with dark heroes switch it with useLightStatusBar().
StatusBar.setBarStyle('dark-content');

function Shell() {
  const theme = useTheme();
  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <ErrorBoundary>
        <RootNavigator />
      </ErrorBoundary>
      <PreviewBanner />
      <ToastHost />
      <AlertHost />
    </View>
  );
}

export function App() {
  useEffect(() => {
    restoreSession();
    const sub = AppState.addEventListener('change', s => s === 'active' && revalidateSession());
    return () => sub.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <Shell />
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
