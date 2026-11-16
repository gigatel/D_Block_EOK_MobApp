import React from 'react';
import { ErrorState, SkeletonList } from '@/components';
import type { ApiError } from '@/services/api/errors';

/** Standard loading / error handling for bootstrap-backed screens. */
export function QueryBoundary<T>({
  data,
  isLoading,
  error,
  onRetry,
  skeleton = <SkeletonList />,
  children,
}: {
  data: T | undefined;
  isLoading: boolean;
  error: ApiError | null;
  onRetry: () => void;
  skeleton?: React.ReactNode;
  children: (data: T) => React.ReactNode;
}) {
  if (data !== undefined) return <>{children(data)}</>;
  if (isLoading) return <>{skeleton}</>;
  return (
    <ErrorState
      message={error?.message ?? 'Please check your connection.'}
      onRetry={onRetry}
    />
  );
}
