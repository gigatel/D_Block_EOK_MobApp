import React from 'react';
import { Lock, ShieldAlert } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { EmptyState, Header, Screen } from '@/components';
import { useBootstrap } from '@/features/data';
import { useSession } from '@/store/session';
import type { Permission } from '@/types/models';

export type AdminScreenProps = {
  title: string;
  /** Any one of these permissions grants access. */
  permission: Permission | Permission[];
  children: React.ReactNode;
  right?: React.ReactNode;
  footer?: React.ReactNode;
  scroll?: boolean;
  /** Modal screens use a close (X) instead of back. */
  modal?: boolean;
  /** Pull-to-refresh refetches bootstrap (default true). */
  refresh?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
};

/** Standard committee page: sign-in + permission gate, header, refreshable body. */
export function AdminScreen({
  title,
  permission,
  children,
  right,
  footer,
  scroll = true,
  modal,
  refresh = true,
  onRefresh,
  refreshing,
}: AdminScreenProps) {
  const navigation = useNavigation();
  const status = useSession(s => s.status);
  const perms = useSession(s => s.user?.permissions ?? []);
  const needed = Array.isArray(permission) ? permission : [permission];
  const allowed = needed.some(p => perms.includes(p));
  const boot = useBootstrap();

  const header = (
    <Header title={title} close={modal} right={allowed ? right : undefined} />
  );
  if (status !== 'signedIn') {
    return (
      <Screen header={header}>
        <EmptyState
          icon={Lock}
          title="Committee sign-in required"
          message="Sign in with your mobile number and SMS code to continue."
          actionLabel="Sign in"
          onAction={() => navigation.navigate('Login')}
        />
      </Screen>
    );
  }
  if (!allowed) {
    return (
      <Screen header={header}>
        <EmptyState
          icon={ShieldAlert}
          title="Committee access only"
          message="Your account does not have permission to open this section."
        />
      </Screen>
    );
  }
  return (
    <Screen
      header={header}
      scroll={scroll}
      footer={footer}
      refreshing={refreshing ?? (refresh ? boot.isRefetching : false)}
      onRefresh={onRefresh ?? (refresh ? () => boot.refetch() : undefined)}
    >
      {children}
    </Screen>
  );
}
