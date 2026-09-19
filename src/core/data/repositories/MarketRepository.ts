import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createThrottledStorage, mmkvStorage } from '../../storage/mmkv';
import type { MarketData } from '../../domain/models/MarketData';
import type { TradingPairSymbol } from '../../domain/models/TradingPair';
import type { IMarketRepository, Unsubscribe } from '../../domain/repositories/IMarketRepository';
import type { ConnectionStatus } from '../sources/WebSocketSource';

// The MMKV cache only needs to be reasonably fresh for the next cold launch (ADR-M5), not
// disk-synced on every ~100ms WS tick — throttling the persisted write is a real
// performance win at this update cadence (see createThrottledStorage's own comment).
const PERSIST_THROTTLE_MS = 2000;

interface MarketState {
  pairs: Record<TradingPairSymbol, MarketData>;
  connectionStatus: ConnectionStatus;
  /** Real messages/sec over the last 1s window — powers the telemetry screen's "WS
   * Message Ingestion Rate" card (ADR-M10: cheaply-real metrics get wired to real values). */
  wsMessageRate: number;
  updatePair: (pair: TradingPairSymbol, data: MarketData) => void;
  /** Applies a batch of pair updates in a single set() / React commit - see useWebSocket's
   * rAF-aligned flush (ADR-M10 perf pass). A backend broadcast tick sends ~8 near-simultaneous
   * per-pair messages; committing them one at a time was up to 8 re-renders per tick. */
  updatePairs: (updates: [TradingPairSymbol, MarketData][]) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setWsMessageRate: (rate: number) => void;
}

// The WS-backed live data source (ADR-M8). `useWebSocket` is the sole writer, via
// `updatePair`/`setConnectionStatus` — never cleared on disconnect (ADR-M7), so stale data
// stays visible. MMKV-persisted so cold launch never shows an empty screen (ADR-M5).
export const useMarketStore = create<MarketState>()(
  persist(
    (set) => ({
      pairs: {},
      connectionStatus: 'connecting',
      wsMessageRate: 0,
      updatePair: (pair, data) => set((state) => ({ pairs: { ...state.pairs, [pair]: data } })),
      updatePairs: (updates) =>
        set((state) => {
          const pairs = { ...state.pairs };
          for (const [pair, data] of updates) pairs[pair] = data;
          return { pairs };
        }),
      setConnectionStatus: (status) => set({ connectionStatus: status }),
      setWsMessageRate: (wsMessageRate) => set({ wsMessageRate }),
    }),
    {
      name: 'market-data-storage',
      storage: createJSONStorage(() => createThrottledStorage(mmkvStorage, PERSIST_THROTTLE_MS)),
      partialize: (state) => ({ pairs: state.pairs }),
    }
  )
);

// Read-side facade satisfying IMarketRepository — keeps Zustand's own API out of
// `watchlist`/`market-details`, which depend on the interface, not the store directly.
export const marketRepository: IMarketRepository = {
  subscribe(pair, onUpdate): Unsubscribe {
    return useMarketStore.subscribe((state, prevState) => {
      const next = state.pairs[pair];
      if (next && next !== prevState.pairs[pair]) onUpdate(next);
    });
  },
  getSnapshot(pair): MarketData | null {
    return useMarketStore.getState().pairs[pair] ?? null;
  },
  getTrackedPairs(): TradingPairSymbol[] {
    return Object.keys(useMarketStore.getState().pairs);
  },
};
