import { useMemo, useState } from 'react';
import { usePairsMeta } from '../../../core/hooks/usePairsMeta';
import { useFavourites } from '../../favourites';
import type { TradingPairSymbol } from '../../../core/domain/models/TradingPair';

export interface WatchlistRow {
  symbol: TradingPairSymbol;
  displayName: string;
  /** false = favourited but outside the backend's currently-resolved pair set (ADR-M8) */
  isTracked: boolean;
  isFavourite: boolean;
}

// Row set = union of tracked pairs (from /pairs/meta) and favourited pairs (ADR-M8's
// untracked-favourite handling) — filtered by the search query, client-side, no debounce
// needed at this data volume (five to ~eight rows).
export function useWatchlist() {
  const pairsMetaQuery = usePairsMeta();
  const { favourites, toggle } = useFavourites();
  const [searchQuery, setSearchQuery] = useState('');

  const rows = useMemo<WatchlistRow[]>(() => {
    const metaBySymbol = new Map((pairsMetaQuery.data?.pairs ?? []).map((meta) => [meta.symbol, meta]));
    const favouriteSet = new Set(favourites);
    const symbols = new Set([...metaBySymbol.keys(), ...favouriteSet]);

    const allRows: WatchlistRow[] = [...symbols].map((symbol) => {
      const meta = metaBySymbol.get(symbol);
      return {
        symbol,
        displayName: meta?.displayName ?? symbol,
        isTracked: meta != null,
        isFavourite: favouriteSet.has(symbol),
      };
    });

    const query = searchQuery.trim().toLowerCase();
    const filtered = query
      ? allRows.filter(
          (row) => row.symbol.toLowerCase().includes(query) || row.displayName.toLowerCase().includes(query)
        )
      : allRows;

    return filtered.sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [pairsMetaQuery.data, favourites, searchQuery]);

  return {
    rows,
    searchQuery,
    setSearchQuery,
    toggleFavourite: toggle,
    refetch: pairsMetaQuery.refetch,
    isRefetching: pairsMetaQuery.isRefetching,
  };
}
