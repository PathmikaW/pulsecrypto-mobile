import type { MarketUpdate } from '../../../contracts/schemas';
import type { MarketData } from '../../domain/models/MarketData';

// MarketUpdate (wire) and MarketData (domain) are field-for-field identical apart from
// `timestamp`, which is a broadcast-tick-scoped value the domain model has no use for —
// `lastUpdatedAt` is the one the app renders (specs/data-models.md).
export function toMarketData(update: MarketUpdate): MarketData {
  return {
    pair: update.pair,
    price: update.price,
    spread: update.spread,
    buyPressure: update.buyPressure,
    sellPressure: update.sellPressure,
    bids: update.bids,
    asks: update.asks,
    lastUpdatedAt: update.lastUpdatedAt,
  };
}
