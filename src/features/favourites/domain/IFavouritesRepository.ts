import type { TradingPairSymbol } from '../../../core/domain/models/TradingPair';

// Favourites are simple local key-value state with no streaming behavior, and — unlike
// market data — are genuinely needed by only this feature's own logic (ADR-M8). A
// conventional promise/mutation-based interface is the correct fit, unlike
// IMarketRepository's subscription shape.
export interface IFavouritesRepository {
  getAll(): Promise<TradingPairSymbol[]>;
  toggle(pair: TradingPairSymbol): Promise<void>;
}
