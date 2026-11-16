import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

/** Returns the current AppState and optionally calls back when returning to foreground. */
export function useAppState(onForeground?: () => void): AppStateStatus {
  const [state, setState] = useState<AppStateStatus>(
    (AppState.currentState as AppStateStatus | null) ?? 'active',
  );
  const callbackRef = useRef(onForeground);
  callbackRef.current = onForeground;

  useEffect(() => {
    const sub = AppState.addEventListener('change', next => {
      setState(prev => {
        if (prev.match(/inactive|background/) && next === 'active') {
          callbackRef.current?.();
        }
        return next;
      });
    });
    return () => sub.remove();
  }, []);

  return state;
}
