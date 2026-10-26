import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

// Execute the installed, patched Next transport, rather than a copy of the fix.
function transport() {
  const window = new EventTarget();
  const fetch = vi.fn(() => Promise.resolve({ ok: true }));
  const exports: {
    fetch?: (
      input: string,
      init?: RequestInit & { priority?: string },
    ) => Promise<unknown>;
  } = {};
  runInNewContext(
    readFileSync(
      'node_modules/next/dist/client/components/segment-cache/fetch.js',
      'utf8',
    ),
    {
      window,
      fetch,
      exports,
      module: { exports },
      process: { env: {} },
      require: () => ({}),
    },
  );
  if (!exports.fetch) throw new Error('Next transport missing');
  const request = exports.fetch;
  const event = (name: string) => window.dispatchEvent(new Event(name));
  return { fetch, request, event };
}

describe('Next RSC document departure at the network boundary', () => {
  it('keeps normal prefetch and request options unchanged', async () => {
    const { fetch, request } = transport();
    const options = { priority: 'low', headers: { RSC: '1' } };
    await request('/prefetch', options);
    expect(fetch).toHaveBeenCalledExactlyOnceWith('/prefetch', options);
  });

  it('defers a cache-key continuation that reaches fetch after beforeunload', async () => {
    const { fetch, request, event } = transport();
    let finishHash!: () => void;
    const hash = new Promise<void>((resolve) => {
      finishHash = resolve;
    });
    const prefetch = hash.then(() =>
      request('/late-cache-key', { priority: 'low' }),
    );
    event('beforeunload');
    finishHash();
    await Promise.resolve();
    expect(fetch).not.toHaveBeenCalled();
    event('pageshow');
    await prefetch;
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('also defers work from a boundary hydrating after departure', async () => {
    const { fetch, request, event } = transport();
    event('beforeunload');
    const late = request('/late-hydration', { priority: 'low' });
    expect(fetch).not.toHaveBeenCalled();
    event('pageshow');
    await late;
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it.each(['pageshow'])(
    'resumes once on %s and preserves all queued work',
    async (resume) => {
      const { fetch, request, event } = transport();
      event('beforeunload');
      const pending = ['/a', '/b', '/c', '/d'].map((path) =>
        request(path, { priority: 'low' }),
      );
      expect(fetch).not.toHaveBeenCalled();
      event(resume);
      event(resume);
      await Promise.all(pending);
      expect(fetch).toHaveBeenCalledTimes(4);
    },
  );

  it.each(['pointerdown', 'keydown'])(
    'does not mistake %s for canceled document navigation',
    async (input) => {
      const { fetch, request, event } = transport();
      event('beforeunload');
      const pending = request('/prefetch', { priority: 'low' });
      event(input);
      expect(fetch).not.toHaveBeenCalled();
      await request('/active-navigation', { priority: 'auto' });
      expect(fetch).toHaveBeenCalledTimes(1);
      event('pageshow');
      await pending;
      expect(fetch).toHaveBeenCalledTimes(2);
    },
  );

  it('never delays a navigation while prefetch is deferred', async () => {
    const { fetch, request, event } = transport();
    event('beforeunload');
    const pending = request('/prefetch', { priority: 'low' });
    await request('/navigation', { priority: 'auto' });
    expect(fetch).toHaveBeenCalledExactlyOnceWith('/navigation', {
      priority: 'auto',
    });
    event('pageshow');
    await pending;
  });

  it('honors abort of deferred work and removes it from the resume queue', async () => {
    const { fetch, request, event } = transport();
    const controller = new AbortController();
    event('beforeunload');
    const pending = request('/prefetch', {
      priority: 'low',
      signal: controller.signal,
    });
    const rejected = expect(pending).rejects.toBe('superseded');
    controller.abort('superseded');
    await rejected;
    event('pageshow');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('passes already aborted work to native fetch with the original signal', async () => {
    const { fetch, request, event } = transport();
    const controller = new AbortController();
    controller.abort();
    const options = { priority: 'low', signal: controller.signal };
    event('beforeunload');
    await request('/aborted', options);
    expect(fetch).toHaveBeenCalledExactlyOnceWith('/aborted', options);
  });

  it('retains departure across unmount/remount and a second departure after resume', async () => {
    const { fetch, request, event } = transport();
    event('beforeunload');
    const first = request('/first-boundary', { priority: 'low' });
    const remounted = request('/remounted-boundary', { priority: 'low' });
    expect(fetch).not.toHaveBeenCalled();
    event('pageshow');
    await Promise.all([first, remounted]);
    event('beforeunload');
    const second = request('/second-departure', { priority: 'low' });
    expect(fetch).toHaveBeenCalledTimes(2);
    event('pageshow');
    await second;
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('propagates real network failures after resumption', async () => {
    const { fetch, request, event } = transport();
    const failure = new TypeError('network unavailable');
    fetch.mockRejectedValueOnce(failure);
    event('beforeunload');
    const pending = request('/failed', { priority: 'low' });
    const rejected = expect(pending).rejects.toBe(failure);
    event('pageshow');
    await rejected;
  });
});
