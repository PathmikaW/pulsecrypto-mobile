import type { MarketData } from '../models/MarketData';
import type { TradingPairSymbol } from '../models/TradingPair';

export type Unsubscribe = () => void;

// Subscription-based because market data is a push stream (ADR-M8); in core/ because watchlist and market-details both depend on it.
export interface IMarketRepository {
  subscribe(pair: TradingPairSymbol, onUpdate: (data: MarketData) => void): Unsubscribe;
  getSnapshot(pair: TradingPairSymbol): MarketData | null; // last-known value, synchronous
  getTrackedPairs(): TradingPairSymbol[]; // whatever the backend is currently broadcasting
}
