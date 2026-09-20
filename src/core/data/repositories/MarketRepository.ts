import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createThrottledStorage, mmkvStorage } from '../../storage/mmkv';
import type { MarketData } from '../../domain/models/MarketData';
import type { TradingPairSymbol } from '../../domain/models/TradingPair';
import type { IMarketRepository, Unsubscribe } from '../../domain/repositories/IMarketRepository';
import type { ConnectionStatus } from '../sources/WebSocketSource';

// The persisted cache only needs to be fresh for the next cold launch (ADR-M5), so writes are throttled.
const PERSIST_THROTTLE_MS = 2000;

interface MarketState {
  pairs: Record<TradingPairSymbol, MarketData>;
  connectionStatus: ConnectionStatus;
  /** Messages/sec over the last 1s window, for the telemetry ingestion-rate card (ADR-M10). */
  wsMessageRate: number;
  updatePair: (pair: TradingPairSymbol, data: MarketData) => void;
  /** Applies a batch in one set(): a broadcast tick sends ~8 per-pair messages, and committing them one by one re-rendered up to 8 times. */
  updatePairs: (updates: [TradingPairSymbol, MarketData][]) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setWsMessageRate: (rate: number) => void;
}

// WS-backed live store (ADR-M8). useWebSocket is the sole writer; data is never cleared on disconnect (ADR-M7) and is MMKV-persisted (ADR-M5).
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

// Read-side facade for IMarketRepository, keeping Zustand out of the features that depend on the interface.
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
