// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { createElement, type ComponentProps } from 'react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';

const observation = vi.hoisted(() => ({
  prefetch: [] as unknown[],
  marker: true,
}));

vi.mock('next/link', () => ({
  default: ({
    prefetch,
    ...props
  }: ComponentProps<'a'> & { prefetch?: boolean | null }) => {
    observation.prefetch.push(prefetch);
    return createElement('a', {
      ...props,
      'data-prefetch': observation.marker
        ? prefetch === false
          ? 'off'
          : 'auto'
        : undefined,
    });
  },
}));
import DocumentNavigationLink from './fixtures/rsc-lifecycle-harness/document-navigation-link';

afterEach(() => {
  vi.unstubAllGlobals();
  cleanup();
  window.dispatchEvent(new Event('pageshow'));
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  observation.marker = true;
  observation.prefetch = [];
});
const renderLinks = () =>
  render(
    <>
      <DocumentNavigationLink href="/journey/guild">
        Guilda
      </DocumentNavigationLink>
      <DocumentNavigationLink href="/journey/guild/ebd">
        EBD
      </DocumentNavigationLink>
    </>,
  );
const depart = () =>
  act(() => {
    window.dispatchEvent(new Event('beforeunload', { cancelable: true }));
  });

test('normal navigation preserves prefetch, href and interaction', () => {
  const click = vi.fn((event) => event.preventDefault());
  render(
    <DocumentNavigationLink href="/journey/guild" onClick={click}>
      Guilda
    </DocumentNavigationLink>,
  );
  const link = screen.getByRole('link');
  expect(link).toHaveAttribute('data-prefetch', 'auto');
  expect(link).toHaveAttribute('href', '/journey/guild');
  fireEvent.click(link);
  expect(click).toHaveBeenCalledTimes(1);
});

test('queued prefetch is detached synchronously for every subscribed link before departure returns', () => {
  renderLinks();
  const event = new Event('beforeunload', { cancelable: true });
  act(() => {
    expect(window.dispatchEvent(event)).toBe(true);
    for (const link of screen.getAllByRole('link'))
      expect(link).toHaveAttribute('data-prefetch', 'off');
  });
  expect(event.defaultPrevented).toBe(false);
  expect(screen.getByRole('link', { name: 'EBD' })).toHaveAttribute(
    'href',
    '/journey/guild/ebd',
  );
});

test.each(['pageshow', 'pointerdown', 'keydown'])(
  'prefetch resumes on %s after returning or canceling a navigation',
  (event) => {
    renderLinks();
    depart();
    act(() => {
      window.dispatchEvent(new Event(event));
    });
    for (const link of screen.getAllByRole('link'))
      expect(link).toHaveAttribute('data-prefetch', 'auto');
  },
);

test('an explicit prefetch opt-out remains disabled after lifecycle changes', () => {
  render(
    <DocumentNavigationLink href="/auth" prefetch={false}>
      Auth
    </DocumentNavigationLink>,
  );
  depart();
  fireEvent(window, new Event('pageshow'));
  expect(screen.getByRole('link')).toHaveAttribute('data-prefetch', 'off');
});

test('listeners are shared and removed after the last subscriber; no stale departure on remount', () => {
  const add = vi.spyOn(window, 'addEventListener');
  const remove = vi.spyOn(window, 'removeEventListener');
  const view = renderLinks();
  expect(
    add.mock.calls.filter(([name]) => name === 'beforeunload'),
  ).toHaveLength(1);
  view.unmount();
  expect(
    remove.mock.calls.filter(([name]) => name === 'beforeunload'),
  ).toHaveLength(1);
  renderLinks();
  expect(screen.getByRole('link', { name: 'Guilda' })).toHaveAttribute(
    'data-prefetch',
    'auto',
  );
});

test('remounting links cannot reset a departing document before pageshow', () => {
  const view = renderLinks();
  depart();
  view.unmount();
  renderLinks();
  expect(screen.getByRole('link', { name: 'Guilda' })).toHaveAttribute(
    'data-prefetch',
    'off',
  );
  fireEvent(window, new Event('pageshow'));
  expect(screen.getByRole('link', { name: 'Guilda' })).toHaveAttribute(
    'data-prefetch',
    'auto',
  );
});

test('SSR snapshot remains normal even while a client document is departing', () => {
  renderLinks();
  depart();
  vi.stubGlobal('window', undefined);
  expect(
    renderToString(
      <DocumentNavigationLink href="/journey">Home</DocumentNavigationLink>,
    ),
  ).toContain('data-prefetch="auto"');
  vi.unstubAllGlobals();
});

test('a late hydration cannot register new prefetch work after document departure', async () => {
  renderLinks();
  observation.marker = false;
  const container = document.createElement('div');
  vi.stubGlobal('window', undefined);
  container.innerHTML = renderToString(
    <DocumentNavigationLink href="/journey/guild">Late</DocumentNavigationLink>,
  );
  vi.unstubAllGlobals();
  document.body.append(container);
  depart();
  observation.prefetch = [];
  let root: ReturnType<typeof hydrateRoot> | undefined;
  const hydrationErrors: unknown[] = [];
  try {
    await act(async () => {
      root = hydrateRoot(
        container,
        <DocumentNavigationLink href="/journey/guild">
          Late
        </DocumentNavigationLink>,
        { onRecoverableError: (error) => hydrationErrors.push(error) },
      );
    });
    expect(observation.prefetch.length).toBeGreaterThan(0);
    expect(observation.prefetch.every((value) => value === false)).toBe(true);
    expect(hydrationErrors).toEqual([]);
  } finally {
    act(() => root?.unmount());
    container.remove();
  }
});
