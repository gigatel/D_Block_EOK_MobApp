import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { data } from '@/services';
import { toApiError, type ApiError } from '@/services/api/errors';
import { useSession } from '@/store/session';
import { toast } from '@/store/toast';
import type { Bootstrap, Collection } from '@/types/bootstrap';
import { haptic } from '@/utils/haptics';

export const bootstrapKey = (userId: string | null | undefined) => ['bootstrap', userId ?? 'anon'] as const;

/**
 * The single read model: GET /api/bootstrap, cached per user.
 * Refreshes on app foreground, pull-to-refresh and after every write.
 */
export function useBootstrap() {
  const userId = useSession(s => s.user?.id);
  const status = useSession(s => s.status);
  return useQuery<Bootstrap, ApiError>({
    queryKey: bootstrapKey(userId),
    queryFn: async () => {
      try {
        return await data.getBootstrap();
      } catch (e) {
        throw toApiError(e);
      }
    },
    enabled: status !== 'restoring',
  });
}

/** Select a slice of bootstrap with memoisation by TanStack Query. */
export function useBootstrapSelect<T>(select: (b: Bootstrap) => T) {
  const userId = useSession(s => s.user?.id);
  const status = useSession(s => s.status);
  return useQuery<Bootstrap, ApiError, T>({
    queryKey: bootstrapKey(userId),
    queryFn: () => data.getBootstrap(),
    enabled: status !== 'restoring',
    select,
  });
}

type SaveVars = { collection: Collection; id: string; body: object; successMessage?: string };

/** Idempotent upsert (PUT /api/{collection}/{id}) + refresh + haptic/toast feedback. */
export function useSave() {
  const qc = useQueryClient();
  return useMutation<unknown, ApiError, SaveVars>({
    mutationFn: async ({ collection, id, body }) => {
      try {
        return await data.upsert(collection, id, body);
      } catch (e) {
        throw toApiError(e);
      }
    },
    onSuccess: (_r, vars) => {
      haptic('success');
      if (vars.successMessage) {
        toast(vars.successMessage, 'success');
      }
      return qc.invalidateQueries({ queryKey: ['bootstrap'] });
    },
    onError: err => {
      haptic('error');
      toast(err.message, 'error');
    },
  });
}

/** Soft delete (DELETE /api/{collection}/{id}). */
export function useRemove() {
  const qc = useQueryClient();
  return useMutation<void, ApiError, { collection: Collection; id: string; successMessage?: string }>({
    mutationFn: async ({ collection, id }) => {
      try {
        await data.remove(collection, id);
      } catch (e) {
        throw toApiError(e);
      }
    },
    onSuccess: (_r, vars) => {
      haptic('success');
      if (vars.successMessage) {
        toast(vars.successMessage, 'success');
      }
      return qc.invalidateQueries({ queryKey: ['bootstrap'] });
    },
    onError: err => {
      haptic('error');
      toast(err.message, 'error');
    },
  });
}

/** GET /api/health — polled while visible (Settings shows the server status). */
export function useServerHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => data.checkHealth(),
    refetchInterval: 30_000,
    retry: false,
    staleTime: 10_000,
  });
}
