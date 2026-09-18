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
