import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { ArrowRight, Lock, PhoneCall } from 'lucide-react-native';
import { Button, Icon, PressableScale, Text } from '@/components';
import { otpRequestSchema } from '@/features/auth/schemas';
import { devSmsText } from '@/features/auth/devSms';
import { startSmsListener } from '@/features/auth/useSmsCode';
import { useBootstrap } from '@/features/data';
import { data } from '@/services';
import { toApiError } from '@/services/api/errors';
import { useSession } from '@/store/session';
import { useReduceMotion, useTheme } from '@/theme';
import { haptic } from '@/utils/haptics';
import { callNumber } from '@/utils/links';
import { FormBanner } from './components/AuthBrand';
import { AuthHero } from './components/AuthHero';
import { AuthLayout } from './components/AuthLayout';
import { BrandLogo } from './components/BrandLogo';
import { PhoneField } from './components/PhoneField';

export function LoginScreen() {
  const theme = useTheme();
  const reduce = useReduceMotion();
  const navigation = useNavigation();
  const expired = useSession(s => s.expired);
  const officePhone = useBootstrap().data?.settings.phone;
  const [mobile, setMobile] = useState('');
  const [fieldError, setFieldError] = useState<string>();
  const [errorTick, setErrorTick] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const fail = (message: string) => {
    haptic('error');
    setFormError(message);
  };

  const submit = async () => {
    if (busy) return;
    setFormError(null);
    const parsed = otpRequestSchema.safeParse({ mobile });
    if (!parsed.success) {
      haptic('error');
      setFieldError(parsed.error.issues[0]?.message ?? 'Enter a valid 10-digit mobile number');
      setErrorTick(t => t + 1);
      return;
    }
    setFieldError(undefined);
    setBusy(true);
    try {
      startSmsListener();
      const res = await data.requestOtp(parsed.data.mobile);
      if (res.ok) {
        haptic('success');
        navigation.navigate('Otp', {
          mode: 'otp',
          mobile: parsed.data.mobile,
          resendIn: res.resendIn,
          devSms: devSmsText(res.devSms),
        });
      } else {
        fail(res.resendIn ? `${res.error} (${res.resendIn}s)` : res.error);
      }
    } catch (e) {
      fail(toApiError(e).message);
    } finally {
      setBusy(false);
    }
  };

  const enter = (i: number) => (reduce ? undefined : FadeInDown.delay(260 + i * 70).duration(450));

  return (
    <AuthLayout
      hero={
        <AuthHero
          centerpiece={<BrandLogo size={96} />}
          title="Welcome home"
          subtitle="Your society, in your pocket"
        />
      }
    >
      <Animated.View entering={enter(0)} style={{ gap: theme.spacing.xs }}>
        <Text variant="h1">Sign in</Text>
        <Text color="muted">
          Enter your mobile number and we’ll text you a one-time code.
        </Text>
      </Animated.View>

      {expired ? (
        <Animated.View entering={reduce ? undefined : FadeIn}>
          <FormBanner tone="warning" message="Your session expired. Please sign in again." />
        </Animated.View>
      ) : null}

      <Animated.View entering={enter(1)}>
        <PhoneField
          value={mobile}
          onChange={d => {
            setMobile(d);
            if (fieldError) setFieldError(undefined);
            if (formError) setFormError(null);
          }}
          onSubmit={submit}
          error={fieldError}
          errorTick={errorTick}
        />
      </Animated.View>

      {formError ? (
        <Animated.View entering={reduce ? undefined : FadeInDown.duration(250)}>
          <FormBanner message={formError} />
        </Animated.View>
      ) : null}

      <Animated.View entering={enter(2)} style={{ gap: theme.spacing.md }}>
        <Button
          title={busy ? 'Sending code…' : 'Get OTP'}
          iconRight={ArrowRight}
          onPress={submit}
          loading={busy}
          disabled={mobile.length !== 10}
          size="lg"
          accessibilityHint="Sends a 6-digit code to this number by SMS"
        />
        <View style={styles.trust}>
          <Icon icon={Lock} size={14} color="muted" />
          <Text variant="caption" color="muted">
            Secure sign-in · no password needed
          </Text>
        </View>
      </Animated.View>

      <View style={styles.spacer} />

      {officePhone ? (
        <Animated.View entering={enter(3)}>
          <PressableScale
            onPress={() => callNumber(officePhone)}
            accessibilityRole="button"
            accessibilityLabel="Need help signing in? Call the RWA office"
            style={[
              styles.help,
              {
                borderRadius: theme.radius.lg,
                backgroundColor: theme.colors.surfaceAlt,
                minHeight: theme.touchTarget,
                paddingHorizontal: theme.spacing.lg,
              },
            ]}
          >
            <Icon icon={PhoneCall} size={18} color="primary" />
            <Text variant="small" color="muted" style={styles.flex}>
              Number not registered or no SMS?
            </Text>
            <Text variant="label" color="primary">
              Call RWA office
            </Text>
          </PressableScale>
        </Animated.View>
      ) : null}
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  trust: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  spacer: { flexGrow: 1 },
  help: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  flex: { flex: 1 },
});
