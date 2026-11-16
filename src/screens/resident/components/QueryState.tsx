import React from 'react';
import { ErrorState, SkeletonList } from '@/components';
import type { ApiError } from '@/services/api/errors';

/** Standard loading / error handling for bootstrap-driven screens. */
export function QueryState({
  isLoading,
  error,
  onRetry,
  children,
  skeletonCount = 4,
  skeletonHeight,
}: {
  isLoading: boolean;
  error: ApiError | null;
  onRetry: () => void;
  children: React.ReactNode;
  skeletonCount?: number;
  skeletonHeight?: number;
}) {
  if (isLoading)
    return <SkeletonList count={skeletonCount} height={skeletonHeight} />;
  if (error) return <ErrorState message={error.message} onRetry={onRetry} />;
  return <>{children}</>;
}
