import { useSyncExternalStore } from 'react';
import { marketRepository } from '../data/repositories/MarketRepository';
import type { MarketData } from '../domain/models/MarketData';
import type { TradingPairSymbol } from '../domain/models/TradingPair';

// Bridges IMarketRepository to React via useSyncExternalStore (ADR-M8); a row re-renders only when its own pair changes.
//
// `enabled` exists because Bottom Tabs keeps visited screens mounted; without it, hidden screens re-render on every WS tick (ADR-M11).
// When disabled, subscribe is a no-op but getSnapshot still reads live state, so a refocused screen shows fresh data immediately.
export function useMarketData(pair: TradingPairSymbol, options?: { enabled?: boolean }): MarketData | null {
  const enabled = options?.enabled ?? true;
  return useSyncExternalStore(
    (onStoreChange) => (enabled ? marketRepository.subscribe(pair, onStoreChange) : () => {}),
    () => marketRepository.getSnapshot(pair)
  );
}
