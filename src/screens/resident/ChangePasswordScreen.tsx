import React, { useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Eye, EyeOff, KeyRound, Lock, ShieldCheck } from 'lucide-react-native';
import {
  Appear,
  Button,
  Header,
  IconButton,
  Input,
  ProgressBar,
  Screen,
  Text,
} from '@/components';
import {
  changePasswordSchema,
  fieldErrors,
  passwordStrength,
} from '@/features/auth/schemas';
import { data } from '@/services';
import { toApiError } from '@/services/api/errors';
import { toast } from '@/store/toast';
import { useTheme } from '@/theme';
import { haptic } from '@/utils/haptics';
import { FormBanner } from '../auth/components/AuthBrand';
import { GatedScreen } from './components/GatedScreen';

function ChangePasswordContent() {
  const theme = useTheme();
  const navigation = useNavigation();
  const [currentPassword, setCurrent] = useState('');
  const [newPassword, setNew] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const strength = passwordStrength(newPassword);
  const strengthColor =
    strength.score >= 3
      ? 'success'
      : strength.score === 2
      ? 'warning'
      : 'danger';

  const submit = async () => {
    setFormError(null);
    const parsed = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirm,
    });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      await data.changePassword(
        parsed.data.currentPassword,
        parsed.data.newPassword,
      );
      haptic('success');
      toast('Password changed. Other devices have been signed out.');
      navigation.goBack();
    } catch (e) {
      haptic('error');
      setFormError(toApiError(e).message);
    } finally {
      setBusy(false);
    }
  };

  const eye = (
    <IconButton
      icon={show ? EyeOff : Eye}
      label={show ? 'Hide passwords' : 'Show passwords'}
      onPress={() => setShow(v => !v)}
      color="muted"
      size={20}
    />
  );

  return (
    <Screen header={<Header title="Change password" />}>
      <Appear index={0}>
        <Text color="muted">
          Use at least 8 characters with letters and numbers. Changing your
          password signs out your other devices.
        </Text>
      </Appear>
      <Appear index={1} style={{ gap: theme.spacing.md }}>
        <Input
          label="Current password"
          icon={Lock}
          value={currentPassword}
          onChangeText={setCurrent}
          error={errors.currentPassword}
          secureTextEntry={!show}
          autoCapitalize="none"
          autoComplete="current-password"
          textContentType="password"
          right={eye}
        />
        <Input
          label="New password"
          icon={KeyRound}
          value={newPassword}
          onChangeText={setNew}
          error={errors.newPassword}
          secureTextEntry={!show}
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
        />
        {newPassword ? (
          <View style={{ gap: theme.spacing.xs }}>
            <ProgressBar
              value={(strength.score + 1) / 5}
              color={strengthColor}
              height={6}
            />
            <Text variant="caption" color={strengthColor}>
              Strength: {strength.label}
            </Text>
          </View>
        ) : null}
        <Input
          label="Confirm new password"
          icon={ShieldCheck}
          value={confirm}
          onChangeText={setConfirm}
          error={errors.confirm}
          secureTextEntry={!show}
          autoCapitalize="none"
          returnKeyType="done"
          onSubmitEditing={submit}
        />
        {formError ? <FormBanner message={formError} /> : null}
        <Button
          title="Update password"
          onPress={submit}
          loading={busy}
          size="lg"
        />
      </Appear>
    </Screen>
  );
}

export function ChangePasswordScreen() {
  return (
    <GatedScreen
      title="Change password"
      message="Sign in to change your password."
    >
      <ChangePasswordContent />
    </GatedScreen>
  );
}
