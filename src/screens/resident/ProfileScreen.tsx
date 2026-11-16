import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  BookUser,
  Briefcase,
  Car,
  Droplet,
  Eye,
  HeartHandshake,
  Mail,
  MessageSquare,
  PawPrint,
  Phone,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react-native';
import {
  Appear,
  Avatar,
  Badge,
  Card,
  EmptyState,
  Header,
  ListItem,
  Screen,
  SwitchRow,
  Text,
  type Tone,
} from '@/components';
import {
  flatOf,
  me,
  residentName,
  useBootstrap,
  useSave,
} from '@/features/data';
import { useTheme } from '@/theme';
import type { Resident } from '@/types/models';
import { formatDate } from '@/utils/date';
import { GatedScreen } from './components/GatedScreen';
import { QueryState } from './components/QueryState';
import { Section } from './components/Section';

const VERIFICATION_TONE: Record<string, Tone> = {
  Verified: 'success',
  Pending: 'warning',
  Rejected: 'danger',
  'Not required': 'neutral',
};

function Plate({ number }: { number: string }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.plate,
        { borderColor: theme.colors.text, borderRadius: theme.radius.xs },
      ]}
    >
      <Text variant="label" style={styles.plateText}>
        {number
          .replace(/^([A-Z]{2})(\d{1,2})([A-Z]{0,3})(\d{4})$/, '$1 $2 $3 $4')
          .replace(/\s+/g, ' ')}
      </Text>
    </View>
  );
}

function ProfileContent() {
  const theme = useTheme();
  const { data, isLoading, error, refetch, isRefetching } = useBootstrap();
  const save = useSave();
  const resident = data ? me(data) : undefined;
  const flat = data && resident ? flatOf(data, resident.id) : undefined;
  const p = resident?.profile;

  const update = (patch: Partial<Resident>, message: string) => {
    if (!resident) return;
    save.mutate({
      collection: 'residents',
      id: resident.id,
      // The server stores the directory flags under `privacy`.
      body: {
        ...resident,
        ...patch,
        privacy: {
          ...resident.privacy,
          showInDirectory: patch.showInDirectory ?? resident.showInDirectory,
          showPhone: patch.showPhone ?? resident.showPhone,
          showEmail: patch.showEmail ?? resident.showEmail,
        },
      },
      successMessage: message,
    });
  };

  return (
    <Screen
      header={<Header title="My profile" />}
      onRefresh={refetch}
      refreshing={isRefetching}
    >
      <QueryState isLoading={isLoading} error={error} onRetry={refetch}>
        {!resident ? (
          <EmptyState
            icon={UserRound}
            title="Profile unavailable"
            message="Pull down to refresh."
          />
        ) : (
          <>
            <Appear index={0}>
              <Card style={styles.hero}>
                <Avatar
                  name={residentName(resident)}
                  color={resident.avatarColor}
                  size={72}
                />
                <View style={styles.flex}>
                  <Text variant="h2">{residentName(resident)}</Text>
                  <Text color="muted">
                    {flat
                      ? `${flat.houseNo} · ${flat.floor} floor · ${flat.areaSqYd} sq yd`
                      : 'D Block, East of Kailash'}
                  </Text>
                  <View style={styles.badges}>
                    <Badge label={resident.type} tone="primary" />
                    <Badge label={`Since ${formatDate(resident.joinedOn)}`} />
                  </View>
                </View>
              </Card>
            </Appear>

            <Appear index={1}>
              <Section title="Contact">
                <ListItem
                  icon={Phone}
                  title={`+91 ${resident.mobile}`}
                  subtitle="Mobile (sign-in number)"
                />
                <ListItem
                  icon={Mail}
                  title={resident.email || 'Not added'}
                  subtitle="Email"
                />
                {resident.occupation ? (
                  <ListItem
                    icon={Briefcase}
                    title={resident.occupation}
                    subtitle="Occupation"
                  />
                ) : null}
                {resident.bloodGroup ? (
                  <ListItem
                    icon={Droplet}
                    title={resident.bloodGroup}
                    subtitle="Blood group"
                  />
                ) : null}
              </Section>
            </Appear>

            <Appear index={2}>
              <Section
                title="Privacy"
                footer="Changes apply to the resident directory and SMS alerts immediately."
              >
                <SwitchRow
                  icon={BookUser}
                  title="Show me in the directory"
                  subtitle="Other residents can find you by name and flat"
                  value={resident.showInDirectory}
                  onChange={v =>
                    update(
                      { showInDirectory: v },
                      v
                        ? 'You are listed in the directory'
                        : 'Removed from the directory',
                    )
                  }
                />
                <SwitchRow
                  icon={Phone}
                  title="Share my phone number"
                  value={resident.showPhone}
                  disabled={!resident.showInDirectory}
                  onChange={v => update({ showPhone: v }, 'Privacy updated')}
                />
                <SwitchRow
                  icon={Eye}
                  title="Share my email"
                  value={resident.showEmail}
                  disabled={!resident.showInDirectory}
                  onChange={v => update({ showEmail: v }, 'Privacy updated')}
                />
                <SwitchRow
                  icon={MessageSquare}
                  title="SMS alerts"
                  subtitle="Important notices and complaint updates by SMS"
                  value={!!resident.privacy?.smsAlerts}
                  onChange={v =>
                    update(
                      { privacy: { smsAlerts: v } },
                      v ? 'SMS alerts on' : 'SMS alerts off',
                    )
                  }
                />
              </Section>
            </Appear>

            {p ? (
              <Appear index={3} style={{ gap: theme.spacing.lg }}>
                <Section title="Household">
                  {p.emergencyContact ? (
                    <ListItem
                      icon={HeartHandshake}
                      title={p.emergencyContact.name}
                      subtitle={`Emergency contact${
                        p.emergencyContact.relation
                          ? ` · ${p.emergencyContact.relation}`
                          : ''
                      } · ${p.emergencyContact.phone}`}
                    />
                  ) : null}
                  {p.familyMembers.map(m => (
                    <ListItem
                      key={m.name}
                      icon={Users}
                      title={m.name}
                      subtitle={[
                        m.relation,
                        m.yearOfBirth ? `born ${m.yearOfBirth}` : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    />
                  ))}
                  {p.pets.map((pet, i) => (
                    <ListItem
                      key={`pet-${i}`}
                      icon={PawPrint}
                      title={pet.name ?? pet.type}
                      subtitle={[pet.type, pet.breed]
                        .filter(Boolean)
                        .join(' · ')}
                    />
                  ))}
                </Section>

                {p.vehicles.length ? (
                  <Section title="Vehicles">
                    {p.vehicles.map(v => (
                      <ListItem
                        key={v.number}
                        icon={Car}
                        title={
                          [v.model, v.colour].filter(Boolean).join(' · ') ||
                          v.type
                        }
                        subtitle={`${v.type}${
                          v.stickerNo ? ` · Sticker ${v.stickerNo}` : ''
                        }`}
                        right={<Plate number={v.number} />}
                      />
                    ))}
                  </Section>
                ) : null}

                {p.domesticStaff.length ? (
                  <Section title="Domestic staff">
                    {p.domesticStaff.map(s => (
                      <ListItem
                        key={s.name}
                        icon={ShieldCheck}
                        title={s.name}
                        subtitle={`${s.role}${s.livesIn ? ' · lives in' : ''}`}
                        right={
                          <Badge
                            label={s.policeVerification.status}
                            tone={
                              VERIFICATION_TONE[s.policeVerification.status] ??
                              'neutral'
                            }
                          />
                        }
                      />
                    ))}
                  </Section>
                ) : null}

                <Text variant="caption" color="muted" align="center">
                  To change these details, contact the RWA office.
                </Text>
              </Appear>
            ) : null}

          </>
        )}
      </QueryState>
    </Screen>
  );
}

export function ProfileScreen() {
  return (
    <GatedScreen
      title="My profile"
      message="Sign in to view and manage your profile."
    >
      <ProfileContent />
    </GatedScreen>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  flex: { flex: 1, gap: 4 },
  badges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 4 },
  plate: {
    borderWidth: 1.5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#FFFFFF',
  },
  plateText: { color: '#111111', letterSpacing: 1 },
});
