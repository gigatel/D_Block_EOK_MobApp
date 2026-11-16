import { AppState } from 'react-native';
import { focusManager, QueryClient } from '@tanstack/react-query';
import { shouldRetry } from './api/client';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 30 * 60_000,
      retry: shouldRetry,
      refetchOnWindowFocus: true,
    },
    mutations: { retry: false },
  },
});

// "Window focus" on mobile = app returning to the foreground.
AppState.addEventListener('change', status => {
  focusManager.setFocused(status === 'active');
});
