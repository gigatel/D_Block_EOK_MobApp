/** Sign-in: mobile number + SMS code only, then the OTP screen signs the user in. */
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { data } from '@/services';
import { queryClient } from '@/services/queryClient';
import { useSession } from '@/store/session';
import { LoginScreen } from '../LoginScreen';
import { OtpScreen } from '../OtpScreen';
import { formatPhone, normalisePhoneDigits } from '../components/PhoneField';

const Stack = createNativeStackNavigator();

async function render(name: 'Login' | 'Otp', params?: object) {
  let r!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    r = ReactTestRenderer.create(
      <SafeAreaProvider
        initialMetrics={{ frame: { x: 0, y: 0, width: 360, height: 760 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}
      >
        <QueryClientProvider client={queryClient}>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              {name === 'Login' ? (
                <Stack.Screen name="Login" component={LoginScreen} />
              ) : (
                <Stack.Screen name="Otp" component={OtpScreen as React.ComponentType} initialParams={params} />
              )}
            </Stack.Navigator>
          </NavigationContainer>
        </QueryClientProvider>
      </SafeAreaProvider>,
    );
  });
  return r;
}

const texts = (r: ReactTestRenderer.ReactTestRenderer) =>
  r.root
    .findAll(n => (n.type as unknown) === 'Text')
    .map(n => [n.props.children].flat().join(''))
    .join(' | ');

afterAll(() => queryClient.clear());

describe('phone number helpers', () => {
  it.each([
    ['98765 43210', '9876543210'],
    ['+91 98765-43210', '9876543210'],
    ['919876543210', '9876543210'],
    ['09876543210', '9876543210'],
  ])('normalises %s', (input, out) => expect(normalisePhoneDigits(input)).toBe(out));

  it('groups digits 5 + 5', () => {
    expect(formatPhone('9876543210')).toBe('98765 43210');
    expect(formatPhone('987')).toBe('987');
  });
});

it('login offers only mobile number + SMS code', async () => {
  const r = await render('Login');
  const t = texts(r);
  expect(t).toContain('Mobile number');
  expect(t).toContain('Get OTP');
  expect(t).not.toContain('Password');
  expect(t).not.toMatch(/demo/i);
  expect(r.root.findAll(n => n.props.secureTextEntry === true)).toHaveLength(0);
  await ReactTestRenderer.act(async () => r.unmount());
});

it('OTP screen verifies the code and signs in', async () => {
  useSession.getState().setSignedOut();
  await data.requestOtp('9000000101');
  const r = await render('Otp', { mode: 'otp', mobile: '9000000101', resendIn: 30 });
  expect(texts(r)).toContain('+91 ••••• 00101');
  const input = r.root.find(n => n.props.textContentType === 'oneTimeCode' && typeof n.props.onChangeText === 'function');
  await ReactTestRenderer.act(async () => {
    input.props.onChangeText('123456');
    await new Promise<void>(res => setTimeout(res, 1600));
  });
  expect(useSession.getState().status).toBe('signedIn');
  await ReactTestRenderer.act(async () => r.unmount());
});
