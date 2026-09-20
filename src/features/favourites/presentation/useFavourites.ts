import { useFavouritesStore } from '../data/FavouritesRepository';
import type { TradingPairSymbol } from '../../../core/domain/models/TradingPair';

// The only sanctioned way for another feature to touch favourites (ADR-M8); exposed via the feature barrel.
export function useFavourites() {
  const favourites = useFavouritesStore((state) => state.favourites);
  const toggleFavourite = useFavouritesStore((state) => state.toggleFavourite);

  return {
    favourites,
    isFavourite: (pair: TradingPairSymbol) => favourites.includes(pair),
    toggle: toggleFavourite,
  };
}
