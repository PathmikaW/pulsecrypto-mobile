import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '../../../core/storage/mmkv';
import type { TradingPairSymbol } from '../../../core/domain/models/TradingPair';
import type { IFavouritesRepository } from '../domain/IFavouritesRepository';

interface FavouritesState {
  favourites: TradingPairSymbol[];
  toggleFavourite: (pair: TradingPairSymbol) => void;
}

// MMKV-persisted (ADR-M5) — synchronous reads mean favourites render correctly on the
// very first frame, no flash of an incorrect state while an async read resolves.
export const useFavouritesStore = create<FavouritesState>()(
  persist(
    (set, get) => ({
      favourites: [],
      toggleFavourite: (pair) => {
        const { favourites } = get();
        set({
          favourites: favourites.includes(pair)
            ? favourites.filter((p) => p !== pair)
            : [...favourites, pair],
        });
      },
    }),
    {
      name: 'favourites-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);

// Promise-based facade satisfying IFavouritesRepository — stays inside favourites/, since
// nothing outside this feature reads or writes favourites directly (ADR-M8).
export const favouritesRepository: IFavouritesRepository = {
  getAll: async () => useFavouritesStore.getState().favourites,
  toggle: async (pair) => {
    useFavouritesStore.getState().toggleFavourite(pair);
  },
};
