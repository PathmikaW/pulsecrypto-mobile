import { createMMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

// react-native-mmkv v4 rewrote its API onto Nitro Modules — `createMMKV(config)`, not
// `new MMKV(config)` (verified against the installed package's own .d.ts, not training
// data — v4 is a breaking change from the `new MMKV()` API shown in older docs/specs).
export const mmkv = createMMKV({ id: 'pulsecrypto-storage' });

// Adapts MMKV's synchronous key/value API to Zustand persist middleware's StateStorage
// shape (ADR-M5) — synchronous reads are what avoid a flash of incorrect state on launch.
export const mmkvStorage: StateStorage = {
  getItem: (name) => mmkv.getString(name) ?? null,
  setItem: (name, value) => mmkv.set(name, value),
  removeItem: (name) => {
    mmkv.remove(name);
  },
};

// Trailing-edge throttle for a StateStorage's writes, keyed by the persisted key name.
// marketStore updates at up to ~10 ticks/sec/pair - without this, Zustand's persist
// middleware serializes and writes the entire pairs object (every tracked pair's full
// order book) to MMKV on every single tick, which is real, measurable work the UI thread
// doesn't need to pay for that often. The MMKV cache only needs to be reasonably fresh at
// the next cold launch (ADR-M5), not literally disk-synced every 100ms, so throttling
// trades a few seconds of cache staleness for a lot less write pressure.
export function createThrottledStorage(storage: StateStorage, intervalMs: number): StateStorage {
  const pending = new Map<string, string>();
  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  return {
    getItem: storage.getItem,
    removeItem: storage.removeItem,
    setItem: (name, value) => {
      pending.set(name, value);
      if (timers.has(name)) return;
      const timer = setTimeout(() => {
        const latest = pending.get(name);
        pending.delete(name);
        timers.delete(name);
        if (latest !== undefined) storage.setItem(name, latest);
      }, intervalMs);
      timers.set(name, timer);
    },
  };
}
