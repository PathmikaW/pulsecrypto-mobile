import type { OrderBookLevel } from './OrderBook';
import type { TradingPairSymbol } from './TradingPair';

// Direct mapping of the backend's MarketUpdate wire payload (specs/data-models.md) — no
// restructuring beyond type narrowing. `lastUpdatedAt` is copied through unmodified; it is
// never recomputed client-side (ADR-B4/ADR-M2, §12.2).
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
