import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { formatCountdown, useCountdown } from '../useCountdown';

jest.useFakeTimers();

type Api = ReturnType<typeof useCountdown>;
function Probe({
  seconds,
  onRender,
}: {
  seconds: number;
  onRender: (a: Api) => void;
}) {
  onRender(useCountdown(seconds));
  return null;
}

describe('useCountdown', () => {
  it('counts down to zero, stops, and restarts', async () => {
    let api!: Api;
    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<Probe seconds={3} onRender={a => (api = a)} />);
    });
    expect(api.remaining).toBe(3);
    expect(api.done).toBe(false);

    for (let i = 0; i < 3; i++) {
      await ReactTestRenderer.act(async () => {
        jest.advanceTimersByTime(1000);
      });
    }
    expect(api.remaining).toBe(0);
    expect(api.done).toBe(true);

    await ReactTestRenderer.act(async () => {
      jest.advanceTimersByTime(5000);
    });
    expect(api.remaining).toBe(0);

    await ReactTestRenderer.act(async () => {
      api.restart(30);
    });
    expect(api.remaining).toBe(30);
    await ReactTestRenderer.act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(api.remaining).toBe(29);
  });

  it('formats m:ss', () => {
    expect(formatCountdown(30)).toBe('0:30');
    expect(formatCountdown(65)).toBe('1:05');
  });
});
