import { useFavouritesStore } from '../data/FavouritesRepository';
import type { TradingPairSymbol } from '../../../core/domain/models/TradingPair';

// The ONLY sanctioned way another feature touches favourites state (ADR-M8) — exported via
// this feature's barrel, never by importing favourites/data or favourites/domain directly.
export function useFavourites() {
  const favourites = useFavouritesStore((state) => state.favourites);
  const toggleFavourite = useFavouritesStore((state) => state.toggleFavourite);

  return {
    favourites,
    isFavourite: (pair: TradingPairSymbol) => favourites.includes(pair),
    toggle: toggleFavourite,
  };
}
