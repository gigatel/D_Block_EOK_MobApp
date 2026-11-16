import { useEffect, useState } from 'react';

/**
 * Shows the pull-to-refresh spinner only when the user pulled — background
 * refetches (focus, after writes) stay silent.
 */
export function usePullToRefresh(isRefetching: boolean) {
  const [pulled, setPulled] = useState(false);
  useEffect(() => {
    if (!isRefetching) setPulled(false);
  }, [isRefetching]);
  return { refreshing: pulled && isRefetching, start: () => setPulled(true) };
}
