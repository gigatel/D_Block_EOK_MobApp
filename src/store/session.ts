import { create } from 'zustand';
import type { Permission, SessionUser } from '@/types/models';

export type SessionStatus = 'restoring' | 'signedOut' | 'signedIn';

type SessionState = {
  status: SessionStatus;
  user: SessionUser | null;
  /** Set when the server rejected the session (401) — login shows a notice. */
  expired: boolean;
  setSignedIn: (user: SessionUser) => void;
  setSignedOut: (opts?: { expired?: boolean }) => void;
  setUser: (user: SessionUser) => void;
};

export const useSession = create<SessionState>(set => ({
  status: 'restoring',
  user: null,
  expired: false,
  setSignedIn: user => set({ status: 'signedIn', user, expired: false }),
  setSignedOut: opts => set({ status: 'signedOut', user: null, expired: !!opts?.expired }),
  setUser: user => set({ user }),
}));

/** Drive every admin UI decision from permissions, never role names. */
export function useCan(permission: Permission): boolean {
  return useSession(s => !!s.user?.permissions.includes(permission));
}

export function useIsSignedIn(): boolean {
  return useSession(s => s.status === 'signedIn');
}

/** True if the user has any committee/admin permission. */
export function useIsCommittee(): boolean {
  return useSession(s => (s.user?.permissions.length ?? 0) > 0);
}
