import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { RotateCw, ShieldCheck, Sparkles } from 'lucide-react-native';
import { Button, Icon, OtpInput, PressableScale, Text } from '@/components';
import { devSmsText } from '@/features/auth/devSms';
import { formatCountdown, useCountdown } from '@/features/auth/useCountdown';
import { extractOtp, startSmsListener, useSmsCode } from '@/features/auth/useSmsCode';
import type { RootScreenProps } from '@/navigation/types';
import { data } from '@/services';
import { completeSignIn } from '@/services/auth';
import { toApiError } from '@/services/api/errors';
import { toast } from '@/store/toast';
import { useReduceMotion, useTheme } from '@/theme';
import { haptic } from '@/utils/haptics';
import { FormBanner } from './components/AuthBrand';
import { AuthHero } from './components/AuthHero';
import { AuthLayout } from './components/AuthLayout';
import { CountdownRing } from './components/CountdownRing';
import { formatPhone } from './components/PhoneField';
import { SmsPulse } from './components/SmsPulse';

/** How long the green "verified" state shows before the app opens. */
const SUCCESS_HOLD_MS = 700;

export function OtpScreen({ route, navigation }: RootScreenProps<'Otp'>) {
  const params = route.params;
  const theme = useTheme();
  const reduce = useReduceMotion();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [errorTick, setErrorTick] = useState(0);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resending, setResending] = useState(false);
  const countdown = useCountdown(params.resendIn);
  const [timerTotal, setTimerTotal] = useState(params.resendIn);
  const [devSms, setDevSms] = useState<string | null>(params.devSms ?? null);
  const [autoFilled, setAutoFilled] = useState(false);

  // Auto-fill from the SMS (Android consent sheet) — the user can still edit any digit.
  const fill = (c: string) => {
    setCode(c);
    setError(null);
    setAutoFilled(true);
    haptic('selection');
  };
  useSmsCode(fill);
  // Debug builds: fill from the server's simulated SMS when no gateway is configured.
  useEffect(() => {
    const c = extractOtp(devSms);
    if (c) fill(c);
  }, [devSms]);

  const masked =
    params.mode === 'mfa' ? params.mobileHint : `+91 ${formatPhone(params.mobile).replace(/^\d{5}/, '•••••')}`;

  // Synchronous guard: auto-complete + button press in the same tick must not verify twice
  // (the server consumes the OTP on the first call).
  const inFlight = useRef(false);
  const verify = async (value: string) => {
    if (inFlight.current || success || value.length !== 6) return;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      const res =
        params.mode === 'mfa'
          ? await data.verifyMfa(params.challengeId, value)
          : await data.verifyOtp(params.mobile, value);
      if (res.ok === true) {
        // Show the green "verified" state briefly, then open the app.
        setSuccess(true);
        haptic('success');
        await new Promise<void>(r => setTimeout(r, reduce ? 250 : SUCCESS_HOLD_MS));
        await completeSignIn(res);
        toast(`Welcome, ${res.user?.name?.split(' ')[0] ?? 'back'}`);
        // Signing in swaps the navigator to the app (Login + Otp unmount).
        return;
      }
      if (res.ok === 'mfa') {
        // Some server accounts need a second SMS step even after the OTP.
        navigation.replace('Otp', {
          mode: 'mfa',
          challengeId: res.challengeId,
          mobileHint: res.mobileHint,
          resendIn: res.resendIn,
          mobile: params.mobile,
          devSms: devSmsText(res.devSms),
        });
        return;
      }
      haptic('error');
      setError(res.error);
      setAttemptsLeft(res.attemptsLeft ?? null);
      setErrorTick(t => t + 1);
      setCode('');
      setAutoFilled(false);
    } catch (e) {
      haptic('error');
      setError(toApiError(e).message);
      setErrorTick(t => t + 1);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  const resend = async () => {
    setResending(true);
    setError(null);
    try {
      const res = params.mode === 'mfa' ? await data.resendMfa(params.challengeId) : await data.requestOtp(params.mobile);
      if (res.ok) {
        startSmsListener();
        setAutoFilled(false);
        setDevSms(devSmsText(res.devSms));
        countdown.restart(res.resendIn);
        setTimerTotal(res.resendIn);
        setAttemptsLeft(null);
        setCode('');
        toast('A new code has been sent', 'info');
      } else {
        setError(res.error);
        if (res.resendIn) {
          countdown.restart(res.resendIn);
          setTimerTotal(res.resendIn);
        }
      }
    } catch (e) {
      setError(toApiError(e).message);
    } finally {
      setResending(false);
    }
  };

  const outOfAttempts = attemptsLeft === 0;
  const enter = (i: number) => (reduce ? undefined : FadeInDown.delay(260 + i * 70).duration(450));
  const errorText =
    error && attemptsLeft !== null && attemptsLeft > 0
      ? `${error} ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} left.`
      : error;

  return (
    <AuthLayout
      hero={
        <AuthHero
          compact
          onBack={success ? undefined : () => navigation.goBack()}
          centerpiece={<SmsPulse success={success} />}
          title={success ? 'Verified' : params.mode === 'mfa' ? 'Two-step sign-in' : 'Check your messages'}
        />
      }
    >
      <Animated.View entering={enter(0)} style={{ gap: theme.spacing.xs }}>
        <Text variant="h1">Enter the code</Text>
        <View style={styles.sentRow}>
          <Text color="muted">Sent by SMS to </Text>
          <Text variant="bodyStrong">{masked}</Text>
          {params.mode === 'otp' && !success ? (
            <PressableScale
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Change mobile number"
              hitSlop={10}
              style={{ marginLeft: theme.spacing.sm }}
            >
              <Text variant="label" color="primary">
                Change
              </Text>
            </PressableScale>
          ) : null}
        </View>
      </Animated.View>

      {devSms ? (
        <FormBanner
          tone="info"
          message={`Developer build — the server didn't send a real SMS (no SMS gateway). Simulated message: ${devSms}`}
        />
      ) : null}

      <Animated.View entering={enter(1)} style={{ gap: theme.spacing.md }}>
        <OtpInput
          value={code}
          onChange={c => {
            setCode(c);
            setAutoFilled(false);
            if (error && c.length > 0) setError(null);
          }}
          onComplete={verify}
          errorTick={errorTick}
          hasError={!!error}
          success={success}
        />
        <View style={styles.statusLine}>
          {success ? (
            <Animated.View key="ok" entering={reduce ? undefined : FadeIn} style={styles.chip}>
              <Icon icon={ShieldCheck} size={16} color="success" />
              <Text variant="small" color="success">
                Number verified — signing you in…
              </Text>
            </Animated.View>
          ) : autoFilled ? (
            <Animated.View
              key="auto"
              entering={reduce ? undefined : FadeIn}
              exiting={reduce ? undefined : FadeOut}
              style={[styles.chip, { backgroundColor: theme.colors.primarySoft, borderRadius: theme.radius.pill }]}
            >
              <Icon icon={Sparkles} size={14} color="primary" />
              <Text variant="caption" color="primary">
                Filled in from your SMS
              </Text>
            </Animated.View>
          ) : (
            <Text variant="caption" color="muted" align="center">
              The code fills in automatically when the SMS arrives.
            </Text>
          )}
        </View>
      </Animated.View>

      {errorText ? (
        <Animated.View entering={reduce ? undefined : FadeInDown.duration(250)}>
          <FormBanner message={errorText} />
        </Animated.View>
      ) : null}

      <Animated.View entering={enter(2)} style={{ gap: theme.spacing.lg }}>
        <Button
          title={success ? 'Verified' : 'Verify and continue'}
          icon={ShieldCheck}
          onPress={() => verify(code)}
          loading={busy && !success}
          disabled={code.length !== 6 || outOfAttempts || success}
          size="lg"
        />
        {!success ? (
          <View style={styles.center}>
            {countdown.done ? (
              <Button
                title="Resend code"
                variant="ghost"
                icon={RotateCw}
                onPress={resend}
                loading={resending}
                fullWidth={false}
              />
            ) : (
              <View style={styles.timer} accessibilityLiveRegion="polite">
                <CountdownRing remaining={countdown.remaining} total={timerTotal} />
                <Text variant="small" color="muted">
                  Resend code in {formatCountdown(countdown.remaining)}
                </Text>
              </View>
            )}
          </View>
        ) : null}
      </Animated.View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  sentRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  statusLine: { minHeight: 28, alignItems: 'center', justifyContent: 'center' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6 },
  center: { alignItems: 'center' },
  timer: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
});
