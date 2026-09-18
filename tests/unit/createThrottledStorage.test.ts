import { createThrottledStorage } from '../../src/core/storage/mmkv';
import type { StateStorage } from 'zustand/middleware';

function makeSpyStorage(): StateStorage & { writes: [string, string][] } {
  const writes: [string, string][] = [];
  return {
    writes,
    getItem: () => null,
    setItem: (name, value) => {
      writes.push([name, value]);
    },
    removeItem: () => {},
  };
}

describe('createThrottledStorage', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('does not write to the underlying storage immediately', () => {
    const inner = makeSpyStorage();
    const throttled = createThrottledStorage(inner, 1000);

    throttled.setItem('key', 'value');

    expect(inner.writes).toEqual([]);
  });

  it('flushes the latest value after the throttle interval elapses', () => {
    const inner = makeSpyStorage();
    const throttled = createThrottledStorage(inner, 1000);

    throttled.setItem('key', 'v1');
    throttled.setItem('key', 'v2');
    throttled.setItem('key', 'v3');
    jest.advanceTimersByTime(1000);

    // only the latest value survives — intermediate writes are coalesced, not queued
    expect(inner.writes).toEqual([['key', 'v3']]);
  });

  it('schedules a new write after a flush, rather than dropping subsequent updates', () => {
    const inner = makeSpyStorage();
    const throttled = createThrottledStorage(inner, 1000);

    throttled.setItem('key', 'v1');
    jest.advanceTimersByTime(1000);
    throttled.setItem('key', 'v2');
    jest.advanceTimersByTime(1000);

    expect(inner.writes).toEqual([
      ['key', 'v1'],
      ['key', 'v2'],
    ]);
  });

  it('throttles independently per key', () => {
    const inner = makeSpyStorage();
    const throttled = createThrottledStorage(inner, 1000);

    throttled.setItem('a', '1');
    throttled.setItem('b', '2');
    jest.advanceTimersByTime(1000);

    expect(inner.writes).toEqual(
      expect.arrayContaining([
        ['a', '1'],
        ['b', '2'],
      ])
    );
  });
});
