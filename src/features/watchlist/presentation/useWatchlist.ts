import { toAppError } from '../../../core/api/errors';
import { useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useMarketStore } from '../../../core/data/repositories/MarketRepository';
import { usePairsMeta } from '../../../core/hooks/usePairsMeta';
import { formatPairDisplayName } from '../../../core/utils/formatPairDisplayName';
import { useFavourites } from '../../favourites';
import type { TradingPairSymbol } from '../../../core/domain/models/TradingPair';

export interface WatchlistRow {
  symbol: TradingPairSymbol;
  displayName: string;
  /** false when /pairs/meta has no entry for this pair: untracked, or REST is down and only live/cached WS data exists (ADR-M8). */
  isTracked: boolean;
  isFavourite: boolean;
}

// Union of tracked and favourited pairs (ADR-M8), filtered client-side; no debounce needed at ~8 rows.
export function useWatchlist() {
  const pairsMetaQuery = usePairsMeta();
  const { favourites, toggle } = useFavourites();
  const [searchQuery, setSearchQuery] = useState('');
  // Read from the store directly (IMarketRepository has no reactive key list) so the list falls back to live/cached data when /pairs/meta is down (ADR-M7).
  // useShallow: Object.keys() returns a new array each call, which would loop under Object.is.
  const liveTrackedPairs = useMarketStore(useShallow((state) => Object.keys(state.pairs)));

  const rows = useMemo<WatchlistRow[]>(() => {
    const metaBySymbol = new Map((pairsMetaQuery.data?.pairs ?? []).map((meta) => [meta.symbol, meta]));
    const favouriteSet = new Set(favourites);
    const symbols = new Set([...metaBySymbol.keys(), ...liveTrackedPairs, ...favouriteSet]);

    const allRows: WatchlistRow[] = [...symbols].map((symbol) => {
      const meta = metaBySymbol.get(symbol);
      return {
        symbol,
        displayName: formatPairDisplayName(meta?.displayName, symbol),
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
  }, [pairsMetaQuery.data, liveTrackedPairs, favourites, searchQuery]);

  return {
    rows,
    searchQuery,
    setSearchQuery,
    toggleFavourite: toggle,
    refetch: pairsMetaQuery.refetch,
    isRefetching: pairsMetaQuery.isRefetching,
    metaError: pairsMetaQuery.error ? toAppError(pairsMetaQuery.error) : null,
  };
}
