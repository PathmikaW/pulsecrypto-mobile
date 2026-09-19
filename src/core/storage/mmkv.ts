import { createMMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

// react-native-mmkv v4 uses createMMKV(config), not `new MMKV(config)`.
export const mmkv = createMMKV({ id: 'pulsecrypto-storage' });

// Adapts MMKV to Zustand persist's StateStorage (ADR-M5); synchronous reads avoid a flash of wrong state on launch.
export const mmkvStorage: StateStorage = {
  getItem: (name) => mmkv.getString(name) ?? null,
  setItem: (name, value) => mmkv.set(name, value),
  removeItem: (name) => {
    mmkv.remove(name);
  },
};

// Trailing-edge throttle per key: without it, persist serializes every pair's full order book to MMKV on each ~100ms tick (ADR-M5).
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
