import React, { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Send } from 'lucide-react-native';
import {
  Button,
  Header,
  Icon,
  Input,
  PressableScale,
  Screen,
  SegmentedControl,
  Text,
} from '@/components';
import { fieldErrors } from '@/features/auth/schemas';
import { useSave } from '@/features/data';
import { complaintSchema } from '@/features/resident/schemas';
import { useTheme } from '@/theme';
import {
  COMPLAINT_CATEGORIES,
  PRIORITIES,
  type ComplaintCategory,
  type Priority,
} from '@/types/models';
import { newId } from '@/utils/ids';
import { GatedScreen } from './components/GatedScreen';
import { COMPLAINT_ICON } from './components/icons';

function NewComplaintContent() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const save = useSave();
  const [category, setCategory] = useState<ComplaintCategory | null>(null);
  const [priority, setPriority] = useState<Priority>('Medium');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 4 tiles per row on phones ≥ 400dp, 3 on small phones, 4 on tablets (capped width).
  const cols = width < 400 ? 3 : 4;
  const contentWidth = Math.min(width, 640) - theme.gutter * 2;
  const tile = (contentWidth - theme.spacing.sm * (cols - 1)) / cols;

  const submit = async () => {
    const parsed = complaintSchema.safeParse({
      category: category ?? undefined,
      priority,
      subject,
      description,
    });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    try {
      await save.mutateAsync({
        collection: 'complaints',
        id: newId('cp'),
        body: { ...parsed.data, status: 'Open' },
        successMessage: 'Complaint submitted. The committee has been notified.',
      });
      navigation.goBack();
    } catch {
      // useSave shows the error toast.
    }
  };

  return (
    <Screen
      header={<Header title="New complaint" close />}
      footer={
        <Button
          title="Submit complaint"
          icon={Send}
          onPress={submit}
          loading={save.isPending}
          size="lg"
        />
      }
    >
      <View style={{ gap: theme.spacing.sm }}>
        <Text variant="label">What is it about?</Text>
        <View
          style={[styles.grid, { gap: theme.spacing.sm }]}
          accessibilityRole="radiogroup"
        >
          {COMPLAINT_CATEGORIES.map(c => {
            const selected = c === category;
            return (
              <PressableScale
                key={c}
                onPress={() => setCategory(c)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={c}
                style={[
                  styles.tile,
                  {
                    width: tile,
                    borderRadius: theme.radius.md,
                    backgroundColor: selected
                      ? theme.colors.primary
                      : theme.colors.surface,
                    borderColor: selected
                      ? theme.colors.primary
                      : theme.colors.border,
                  },
                  selected ? theme.shadow.card : null,
                ]}
              >
                <Icon
                  icon={COMPLAINT_ICON[c]}
                  size={22}
                  color={selected ? 'onPrimary' : 'primary'}
                />
                <Text
                  variant="caption"
                  color={selected ? 'onPrimary' : 'text'}
                  align="center"
                  numberOfLines={2}
                  style={styles.tileText}
                >
                  {c}
                </Text>
              </PressableScale>
            );
          })}
        </View>
        {errors.category ? (
          <Text
            variant="caption"
            color="danger"
            accessibilityLiveRegion="polite"
          >
            {errors.category}
          </Text>
        ) : null}
      </View>

      <View style={{ gap: theme.spacing.sm }}>
        <Text variant="label">How urgent?</Text>
        <SegmentedControl
          options={PRIORITIES}
          value={priority}
          onChange={setPriority}
        />
      </View>

      <Input
        label="Subject"
        value={subject}
        onChangeText={setSubject}
        error={errors.subject}
        maxLength={120}
        counter
        placeholder="e.g. Street light not working near D-42"
      />
      <Input
        label="Details"
        value={description}
        onChangeText={setDescription}
        error={errors.description}
        multiline
        maxLength={2000}
        counter
        placeholder="Where exactly, since when, anything the team should know…"
      />
      <Text variant="caption" color="muted">
        Your name and flat are attached automatically. You’ll get updates in
        Notifications.
      </Text>
    </Screen>
  );
}

export function NewComplaintScreen() {
  return (
    <GatedScreen title="New complaint" message="Sign in to raise a complaint.">
      <NewComplaintContent />
    </GatedScreen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  tile: {
    minHeight: 84,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 8,
    borderWidth: 1,
  },
  tileText: { fontWeight: '600' },
});
