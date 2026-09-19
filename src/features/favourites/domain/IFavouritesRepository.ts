import type { TradingPairSymbol } from '../../../core/domain/models/TradingPair';

// Local key-value state needed only by this feature (ADR-M8), so a promise/mutation interface fits, unlike IMarketRepository.
export interface IFavouritesRepository {
  getAll(): Promise<TradingPairSymbol[]>;
  toggle(pair: TradingPairSymbol): Promise<void>;
}
