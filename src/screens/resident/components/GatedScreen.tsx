import React from 'react';
import { AuthGate, Header, Screen } from '@/components';
import { useIsSignedIn } from '@/store/session';

/**
 * Residents-only page: signed-out visitors get the page header plus a sign-in
 * prompt; signed-in residents get the real content.
 */
export function GatedScreen({
  title,
  message,
  children,
}: {
  title: string;
  message?: string;
  children: React.ReactNode;
}) {
  const signedIn = useIsSignedIn();
  if (signedIn) return <>{children}</>;
  return (
    <Screen header={<Header title={title} />}>
      <AuthGate message={message}>{null}</AuthGate>
    </Screen>
  );
}
