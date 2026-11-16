import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  CircleCheck,
  MessageSquarePlus,
  SearchX,
  UserCog,
} from 'lucide-react-native';
import {
  Appear,
  Badge,
  Button,
  Card,
  ChipGroup,
  EmptyState,
  Header,
  Icon,
  Input,
  PRIORITY_TONE,
  Screen,
  STATUS_TONE,
  Text,
  toneColors,
} from '@/components';
import { useBootstrap, useSave } from '@/features/data';
import { commentSchema } from '@/features/resident/schemas';
import type { RootScreenProps } from '@/navigation/types';
import { useCan, useSession } from '@/store/session';
import { showAlert } from '@/store/alert';
import { useTheme } from '@/theme';
import {
  COMPLAINT_STATUSES,
  type Complaint,
  type ComplaintStatus,
} from '@/types/models';
import { formatDateTime, timeAgo } from '@/utils/date';
import { newId } from '@/utils/ids';
import { GatedScreen } from './components/GatedScreen';
import { COMPLAINT_ICON } from './components/icons';
import { QueryState } from './components/QueryState';

function AdminPanel({ complaint }: { complaint: Complaint }) {
  const theme = useTheme();
  const user = useSession(s => s.user);
  const save = useSave();
  const [status, setStatus] = useState<ComplaintStatus>(complaint.status);
  const [assignee, setAssignee] = useState(complaint.assignedTo ?? '');
  useEffect(() => {
    setStatus(complaint.status);
    setAssignee(complaint.assignedTo ?? '');
  }, [complaint.status, complaint.assignedTo]);

  const changed =
    status !== complaint.status ||
    assignee.trim() !== (complaint.assignedTo ?? '');
  const apply = async () => {
    const parts: string[] = [];
    if (status !== complaint.status) parts.push(`Status changed to ${status}.`);
    if (assignee.trim() !== (complaint.assignedTo ?? ''))
      parts.push(
        assignee.trim() ? `Assigned to ${assignee.trim()}.` : 'Unassigned.',
      );
    try {
      await save.mutateAsync({
        collection: 'complaints',
        id: complaint.id,
        body: { ...complaint, status, assignedTo: assignee.trim() || null },
      });
      await save.mutateAsync({
        collection: 'complaint-updates',
        id: newId('cu'),
        body: {
          complaintId: complaint.id,
          author: `${user?.name ?? 'Committee'} (Committee)`,
          message: parts.join(' '),
          statusChange: status !== complaint.status ? status : null,
        },
        successMessage: 'Complaint updated',
      });
    } catch {
      // toast shown by useSave
    }
  };

  return (
    <Card variant="accent" style={{ gap: theme.spacing.md }}>
      <View style={styles.row}>
        <Icon icon={UserCog} size={18} color="text" />
        <Text variant="title">Committee actions</Text>
      </View>
      <ChipGroup
        options={COMPLAINT_STATUSES}
        value={status}
        onChange={setStatus}
      />
      <Input
        label="Assigned to"
        value={assignee}
        onChangeText={setAssignee}
        placeholder="e.g. Ramesh (Electrician)"
      />
      <Button
        title="Save changes"
        onPress={apply}
        disabled={!changed}
        loading={save.isPending}
      />
    </Card>
  );
}

function ComplaintDetailContent({ id }: { id: string }) {
  const theme = useTheme();
  const user = useSession(s => s.user);
  const manage = useCan('complaints.manage');
  const { data, isLoading, error, refetch, isRefetching } = useBootstrap();
  const save = useSave();
  const [comment, setComment] = useState('');
  const [commentError, setCommentError] = useState<string | null>(null);

  const complaint = data?.complaints.find(c => c.id === id);
  const updates = (data?.complaintUpdates ?? [])
    .filter(u => u.complaintId === id)
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  const isOwner = complaint && user && complaint.residentId === user.residentId;
  const canClose =
    isOwner && (complaint.status === 'Open' || complaint.status === 'Resolved');

  const addComment = async () => {
    const parsed = commentSchema.safeParse(comment);
    if (!parsed.success || !complaint) {
      setCommentError(
        parsed.success ? null : parsed.error.issues[0]?.message ?? 'Invalid',
      );
      return;
    }
    setCommentError(null);
    try {
      await save.mutateAsync({
        collection: 'complaint-updates',
        id: newId('cu'),
        body: {
          complaintId: complaint.id,
          author: user?.name ?? 'Resident',
          message: parsed.data,
          statusChange: null,
        },
        successMessage: 'Comment added',
      });
      setComment('');
    } catch {
      // toast shown by useSave
    }
  };

  const closeComplaint = () => {
    if (!complaint) return;
    showAlert(
      'Close this complaint?',
      'Close it if the issue is sorted. You can raise a new one any time.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close complaint',
          icon: CircleCheck,
          onPress: async () => {
            try {
              await save.mutateAsync({
                collection: 'complaints',
                id: complaint.id,
                body: { ...complaint, status: 'Closed' },
              });
              await save.mutateAsync({
                collection: 'complaint-updates',
                id: newId('cu'),
                body: {
                  complaintId: complaint.id,
                  author: user?.name ?? 'Resident',
                  message: 'Closed by resident.',
                  statusChange: 'Closed',
                },
                successMessage: 'Complaint closed',
              });
            } catch {
              // toast shown by useSave
            }
          },
        },
      ],
      { icon: CircleCheck, tone: 'success' },
    );
  };

  return (
    <Screen
      header={<Header title={complaint?.ticketNo ?? 'Complaint'} />}
      onRefresh={refetch}
      refreshing={isRefetching}
    >
      <QueryState isLoading={isLoading} error={error} onRetry={refetch}>
        {!complaint ? (
          <EmptyState
            icon={SearchX}
            title="Complaint not found"
            message="It may have been removed or you may not have access to it."
          />
        ) : (
          <>
            <Appear index={0}>
              <Card style={{ gap: theme.spacing.md }}>
                <View style={styles.row}>
                  <View
                    style={[
                      styles.icon,
                      {
                        backgroundColor: theme.colors.primarySoft,
                        borderRadius: theme.radius.md,
                      },
                    ]}
                  >
                    <Icon
                      icon={COMPLAINT_ICON[complaint.category]}
                      size={22}
                      color="primary"
                    />
                  </View>
                  <View style={styles.flex}>
                    <Text variant="caption" color="muted">
                      {complaint.category} · raised{' '}
                      {timeAgo(complaint.createdAt)}
                    </Text>
                    <Text variant="h3">{complaint.subject}</Text>
                  </View>
                </View>
                <View style={styles.badges}>
                  <Badge
                    label={complaint.status}
                    tone={STATUS_TONE[complaint.status]}
                  />
                  <Badge
                    label={`${complaint.priority} priority`}
                    tone={PRIORITY_TONE[complaint.priority]}
                  />
                </View>
                <Text>{complaint.description}</Text>
                <Text variant="small" color="muted">
                  {complaint.assignedTo
                    ? `Assigned to ${complaint.assignedTo}`
                    : 'Not assigned yet'}
                </Text>
              </Card>
            </Appear>

            {manage ? (
              <Appear index={1}>
                <AdminPanel complaint={complaint} />
              </Appear>
            ) : null}

            <Text variant="h3" accessibilityRole="header">
              Timeline
            </Text>
            <View>
              {updates.map((u, i) => {
                const tone = u.statusChange
                  ? toneColors(STATUS_TONE[u.statusChange], theme.colors)
                  : null;
                const last = i === updates.length - 1;
                return (
                  <Appear key={u.id} index={i + 2} style={styles.tlRow}>
                    <View style={styles.tlRail}>
                      <View
                        style={[
                          styles.dot,
                          {
                            backgroundColor: tone
                              ? theme.colors[tone.fg]
                              : theme.colors.border,
                            borderColor: theme.colors.background,
                          },
                        ]}
                      />
                      {!last ? (
                        <View
                          style={[
                            styles.line,
                            { backgroundColor: theme.colors.border },
                          ]}
                        />
                      ) : null}
                    </View>
                    <View
                      style={[
                        styles.tlBody,
                        { paddingBottom: last ? 0 : theme.spacing.lg },
                      ]}
                    >
                      <View style={styles.badges}>
                        <Text variant="label">{u.author}</Text>
                        {u.statusChange ? (
                          <Badge
                            label={u.statusChange}
                            tone={STATUS_TONE[u.statusChange]}
                          />
                        ) : null}
                      </View>
                      <Text variant="small">{u.message}</Text>
                      <Text variant="caption" color="muted">
                        {formatDateTime(u.createdAt)}
                      </Text>
                    </View>
                  </Appear>
                );
              })}
            </View>

            {complaint.status !== 'Closed' ? (
              <Card variant="tinted" style={{ gap: theme.spacing.md }}>
                <Input
                  label="Add a comment"
                  value={comment}
                  onChangeText={setComment}
                  error={commentError}
                  multiline
                  maxLength={1000}
                  placeholder="Share an update or extra details"
                />
                <Button
                  title="Post comment"
                  icon={MessageSquarePlus}
                  variant="secondary"
                  onPress={addComment}
                  loading={save.isPending}
                />
              </Card>
            ) : null}

            {canClose ? (
              <Button
                title="Close complaint"
                icon={CircleCheck}
                variant="soft"
                onPress={closeComplaint}
              />
            ) : null}
          </>
        )}
      </QueryState>
    </Screen>
  );
}

export function ComplaintDetailScreen({
  route,
}: RootScreenProps<'ComplaintDetail'>) {
  return (
    <GatedScreen title="Complaint" message="Sign in to view this complaint.">
      <ComplaintDetailContent id={route.params.id} />
    </GatedScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1, gap: 2 },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  tlRow: { flexDirection: 'row', gap: 12 },
  tlRail: { width: 16, alignItems: 'center' },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 3, marginTop: 3 },
  line: { width: 2, flex: 1, marginTop: 2 },
  tlBody: { flex: 1, gap: 2 },
});
