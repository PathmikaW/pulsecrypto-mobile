import { useSyncExternalStore } from 'react';
import { marketRepository } from '../data/repositories/MarketRepository';
import type { MarketData } from '../domain/models/MarketData';
import type { TradingPairSymbol } from '../domain/models/TradingPair';

// Bridges IMarketRepository's subscription-based port to React via useSyncExternalStore —
// the standard primitive for exactly this shape (external store, per-key subscription),
// and keeps callers depending on the port rather than Zustand directly (ADR-M8). Shared by
// watchlist rows and the market-details screen; a row only re-renders when its own pair's
// data changes, since getSnapshot returns a stable reference for unrelated pairs.
//
// `enabled` (default true) exists because Bottom Tabs keeps every visited screen mounted
// (that's the fix for the earlier tab-switch remount lag) — without this, a screen that's
// simply not the active tab still re-renders on every ~100ms WS tick for data nobody can
// see, which is exactly what was cratering the JS thread FPS reported live in Telemetry.
// When disabled, `subscribe` is a no-op (never registers with the store, so onStoreChange
// never fires and no re-render is triggered) while `getSnapshot` still reads live state, so
// the screen shows fresh data immediately on refocus without any extra resync logic.
export function useMarketData(pair: TradingPairSymbol, options?: { enabled?: boolean }): MarketData | null {
  const enabled = options?.enabled ?? true;
  return useSyncExternalStore(
    (onStoreChange) => (enabled ? marketRepository.subscribe(pair, onStoreChange) : () => {}),
    () => marketRepository.getSnapshot(pair)
  );
}
