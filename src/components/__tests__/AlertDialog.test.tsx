import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Text } from 'react-native';
import { showAlert, useAlertStore } from '@/store/alert';
import { AlertHost } from '../AlertDialog';

const texts = (r: ReactTestRenderer.ReactTestRenderer) =>
  r.root.findAllByType(Text).map(t => [t.props.children].flat().join(''));

const pressButton = async (r: ReactTestRenderer.ReactTestRenderer, label: string) => {
  const btn = r.root.findAll(n => n.props.accessibilityRole === 'button' && n.props.accessibilityLabel === label && typeof n.props.onPress === 'function')[0];
  await ReactTestRenderer.act(async () => {
    await btn.props.onPress();
  });
};

describe('AlertHost', () => {
  afterEach(() => useAlertStore.setState({ queue: [] }));

  it('renders title, message and buttons, runs the action and closes', async () => {
    const onSignOut = jest.fn();
    let r!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      r = ReactTestRenderer.create(<AlertHost />);
    });
    await ReactTestRenderer.act(async () => {
      showAlert('Sign out?', 'You will need your mobile number.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign out', style: 'destructive', onPress: onSignOut },
      ]);
    });
    expect(texts(r)).toEqual(expect.arrayContaining(['Sign out?', 'You will need your mobile number.', 'Cancel', 'Sign out']));
    await pressButton(r, 'Sign out');
    expect(onSignOut).toHaveBeenCalledTimes(1);
    expect(useAlertStore.getState().queue).toHaveLength(0);
    await ReactTestRenderer.act(async () => r.unmount());
  });

  it('defaults to a single OK button', async () => {
    let r!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      r = ReactTestRenderer.create(<AlertHost />);
      showAlert('Saved');
    });
    expect(texts(r)).toEqual(expect.arrayContaining(['Saved', 'OK']));
    await ReactTestRenderer.act(async () => r.unmount());
  });
});
