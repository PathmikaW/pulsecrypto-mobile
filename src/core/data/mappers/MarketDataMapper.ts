import type { MarketUpdate } from '../../../contracts/schemas';
import type { MarketData } from '../../domain/models/MarketData';

// Wire and domain models differ only by `timestamp`; the domain keeps lastUpdatedAt (specs/data-models.md).
export function toMarketData(update: MarketUpdate): MarketData {
  return {
    pair: update.pair,
    price: update.price,
    change24h: update.change24h,
    spread: update.spread,
    buyPressure: update.buyPressure,
    sellPressure: update.sellPressure,
    bids: update.bids,
    asks: update.asks,
    lastUpdatedAt: update.lastUpdatedAt,
  };
}
