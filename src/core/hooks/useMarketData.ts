import { useSyncExternalStore } from 'react';
import { marketRepository } from '../data/repositories/MarketRepository';
import type { MarketData } from '../domain/models/MarketData';
import type { TradingPairSymbol } from '../domain/models/TradingPair';

// Bridges IMarketRepository's subscription-based port to React via useSyncExternalStore —
// the standard primitive for exactly this shape (external store, per-key subscription),
// and keeps callers depending on the port rather than Zustand directly (ADR-M8). Shared by
// watchlist rows and the market-details screen; a row only re-renders when its own pair's
// data changes, since getSnapshot returns a stable reference for unrelated pairs.
export function useMarketData(pair: TradingPairSymbol): MarketData | null {
  return useSyncExternalStore(
    (onStoreChange) => marketRepository.subscribe(pair, onStoreChange),
    () => marketRepository.getSnapshot(pair)
  );
}
