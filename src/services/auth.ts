import { data } from '@/services';
import type { AuthSuccess } from '@/services/data/types';
import { setUnauthorizedHandler } from '@/services/api/client';
import { queryClient } from '@/services/queryClient';
import { clearSession, getSession, saveSession } from '@/services/storage/tokenStorage';
import { useSession } from '@/store/session';
import { useThemePreview } from '@/store/themePreview';
import { logger } from '@/utils/logger';

const COOKIE_SESSION_MS = 12 * 60 * 60 * 1000;

/** Persist the session, mark signed-in and refetch everything for the new user. */
export async function completeSignIn(result: AuthSuccess): Promise<void> {
  await saveSession({
    token: result.token ?? null,
    expiresAt: result.expiresAt ?? new Date(Date.now() + COOKIE_SESSION_MS).toISOString(),
  });
  useSession.getState().setSignedIn(result.user);
  queryClient.removeQueries();
}

async function resetLocalSession(expired: boolean) {
  await clearSession();
  queryClient.clear();
  useThemePreview.getState().backToLive();
  useSession.getState().setSignedOut({ expired });
}

export async function signOut(): Promise<void> {
  try {
    await data.logout();
  } catch {
    logger.warn('Logout request failed; clearing local session anyway');
  }
  await resetLocalSession(false);
}

/** Called on app start: restore the stored session if the server still accepts it. */
export async function restoreSession(): Promise<void> {
  try {
    const stored = await getSession();
    if (!stored) {
      // Live API: the native cookie store may still hold a server session.
      const cookieUser = data.mode === 'mock' ? null : await data.getSession().catch(() => null);
      if (cookieUser) {
        await saveSession({ token: null, expiresAt: new Date(Date.now() + COOKIE_SESSION_MS).toISOString() });
        useSession.getState().setSignedIn(cookieUser);
      } else {
        useSession.getState().setSignedOut();
      }
      return;
    }
    const user = await data.getSession();
    if (user) {
      useSession.getState().setSignedIn(user);
    } else {
      await resetLocalSession(true);
    }
  } catch {
    // Offline: keep the user signed out of protected screens but don't drop the token.
    useSession.getState().setSignedOut();
  }
}

/** Re-check the session when the app returns to the foreground. */
export async function revalidateSession(): Promise<void> {
  if (useSession.getState().status !== 'signedIn') {
    return;
  }
  try {
    const user = await data.getSession();
    if (!user) {
      await resetLocalSession(true);
    } else {
      useSession.getState().setUser(user);
    }
  } catch {
    // Network errors are not a reason to sign out.
  }
}

setUnauthorizedHandler(() => {
  if (useSession.getState().status === 'signedIn') {
    resetLocalSession(true);
  }
});
