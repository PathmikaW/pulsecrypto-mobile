import type { MarketData } from '../models/MarketData';
import type { TradingPairSymbol } from '../models/TradingPair';

export type Unsubscribe = () => void;

// Market data is a continuous push stream from the backend WebSocket, not a fetchable
// resource — the interface is subscription-based to match that, rather than a promise-
// returning getter later retrofitted into an observer pattern (ADR-M8). Lives in core/,
// not inside a single feature, because both `watchlist` and `market-details` depend on it.
export interface IMarketRepository {
  subscribe(pair: TradingPairSymbol, onUpdate: (data: MarketData) => void): Unsubscribe;
  getSnapshot(pair: TradingPairSymbol): MarketData | null; // last-known value, synchronous
  getTrackedPairs(): TradingPairSymbol[]; // whatever the backend is currently broadcasting
}
