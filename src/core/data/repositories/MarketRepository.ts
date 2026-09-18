import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '../../storage/mmkv';
import type { MarketData } from '../../domain/models/MarketData';
import type { TradingPairSymbol } from '../../domain/models/TradingPair';
import type { IMarketRepository, Unsubscribe } from '../../domain/repositories/IMarketRepository';
import type { ConnectionStatus } from '../sources/WebSocketSource';

interface MarketState {
  pairs: Record<TradingPairSymbol, MarketData>;
  connectionStatus: ConnectionStatus;
  updatePair: (pair: TradingPairSymbol, data: MarketData) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
}

// The WS-backed live data source (ADR-M8). `useWebSocket` is the sole writer, via
// `updatePair`/`setConnectionStatus` — never cleared on disconnect (ADR-M7), so stale data
// stays visible. MMKV-persisted so cold launch never shows an empty screen (ADR-M5).
export const useMarketStore = create<MarketState>()(
  persist(
    (set) => ({
      pairs: {},
      connectionStatus: 'connecting',
      updatePair: (pair, data) => set((state) => ({ pairs: { ...state.pairs, [pair]: data } })),
      setConnectionStatus: (status) => set({ connectionStatus: status }),
    }),
    {
      name: 'market-data-storage',
      storage: createJSONStorage(() => mmkvStorage),
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
