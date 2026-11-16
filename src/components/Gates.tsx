import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { Lock, ShieldAlert } from 'lucide-react-native';
import { useCan, useIsSignedIn } from '@/store/session';
import type { Permission } from '@/types/models';
import { EmptyState } from './States';

/** Renders children only for signed-in residents; otherwise a friendly sign-in prompt. */
export function AuthGate({ children, message = 'Sign in with your registered mobile number to see this.' }: { children: React.ReactNode; message?: string }) {
  const signedIn = useIsSignedIn();
  const navigation = useNavigation();
  if (signedIn) return <>{children}</>;
  return <EmptyState icon={Lock} title="Residents only" message={message} actionLabel="Sign in" onAction={() => navigation.navigate('Login')} />;
}

/** Renders children only if the user has the permission (server still enforces it). */
export function PermissionGate({ permission, children }: { permission: Permission; children: React.ReactNode }) {
  const allowed = useCan(permission);
  if (allowed) return <>{children}</>;
  return <EmptyState icon={ShieldAlert} title="Committee access only" message="Your account does not have permission to open this section." />;
}
