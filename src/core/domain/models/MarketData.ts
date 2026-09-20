import type { OrderBookLevel } from './OrderBook';
import type { TradingPairSymbol } from './TradingPair';

// Maps the backend's MarketUpdate 1:1; lastUpdatedAt is never recomputed client-side (ADR-B4, ADR-M2).
export interface MarketData {
  pair: TradingPairSymbol;
  price: number;
  change24h: number;
  spread: number;
  buyPressure: number;
  sellPressure: number;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  lastUpdatedAt: number;
}
