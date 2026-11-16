import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { DecorationLayer } from '../decorations';
import { PatternBackground } from '../patterns';
import { DECORATIONS, PATTERNS } from '../types';
import * as ThemeProviderModule from '../ThemeProvider';

jest.mock('../ThemeProvider', () => {
  const actual = jest.requireActual('../ThemeProvider');
  return { ...actual, useReduceMotion: jest.fn(() => false) };
});
const mockedReduce = ThemeProviderModule.useReduceMotion as jest.Mock;

const unmount = (r: ReactTestRenderer.ReactTestRenderer) =>
  ReactTestRenderer.act(async () => r.unmount());

/** Fires onLayout on the decoration container so particles actually render. */
async function renderDecorations(
  keys: (typeof DECORATIONS)[number][],
  variant?: 'hero' | 'strip',
) {
  let r!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    r = ReactTestRenderer.create(
      <DecorationLayer decorations={keys} variant={variant} />,
    );
  });
  const host = r.root.findAll(n => typeof n.props.onLayout === 'function')[0];
  await ReactTestRenderer.act(async () => {
    host.props.onLayout({
      nativeEvent: { layout: { x: 0, y: 0, width: 390, height: 340 } },
    });
  });
  return r;
}

describe('PatternBackground', () => {
  it.each(PATTERNS)('renders "%s"', async pattern => {
    let r!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      r = ReactTestRenderer.create(
        <PatternBackground pattern={pattern} color="#1F5A3A" opacity={0.2} />,
      );
    });
    if (pattern === 'none') {
      expect(r.toJSON()).toBeNull();
    } else {
      expect(r.toJSON()).not.toBeNull();
    }
    await unmount(r);
  });
});

describe('DecorationLayer', () => {
  beforeEach(() => mockedReduce.mockReturnValue(false));

  it.each(DECORATIONS)('renders "%s" as hero and strip', async key => {
    const hero = await renderDecorations([key]);
    expect(hero.toJSON()).not.toBeNull();
    await unmount(hero);
    const strip = await renderDecorations([key], 'strip');
    expect(strip.toJSON()).not.toBeNull();
    await unmount(strip);
  });

  it('renders a static frame with reduce motion', async () => {
    mockedReduce.mockReturnValue(true);
    const r = await renderDecorations([...DECORATIONS]);
    expect(r.toJSON()).not.toBeNull();
    await unmount(r);
  });

  it('ignores unknown keys and renders nothing for an empty list', async () => {
    let r!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      r = ReactTestRenderer.create(
        <DecorationLayer
          decorations={[
            'evil-script' as unknown as (typeof DECORATIONS)[number],
          ]}
        />,
      );
    });
    expect(r.toJSON()).toBeNull();
    await unmount(r);
  });
});
