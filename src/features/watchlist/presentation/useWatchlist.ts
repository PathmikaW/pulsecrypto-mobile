import { useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useMarketStore } from '../../../core/data/repositories/MarketRepository';
import { usePairsMeta } from '../../../core/hooks/usePairsMeta';
import { useFavourites } from '../../favourites';
import type { TradingPairSymbol } from '../../../core/domain/models/TradingPair';

export interface WatchlistRow {
  symbol: TradingPairSymbol;
  displayName: string;
  /** false = no /pairs/meta entry for this pair (either genuinely untracked, or the REST
   * call is down/loading and only live/cached WS data is available) — ADR-M8. */
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
  // Read directly from the store (not via IMarketRepository, which has no "reactive list
  // of keys" method — only per-pair subscribe). This is what keeps the watchlist populated
  // from live/MMKV-cached WS data even when /pairs/meta is down or still loading — without
  // it, the row set was entirely REST-dependent and never fell back to cached data, which
  // is exactly the "keep showing the most recently received data" requirement this was
  // missing (mobile-screens.md's loading/error-state section, ADR-M7).
  // useShallow avoids an infinite render loop: Object.keys() returns a new array
  // reference every call, which Zustand's default Object.is check would otherwise treat
  // as "changed" on every single render.
  const liveTrackedPairs = useMarketStore(useShallow((state) => Object.keys(state.pairs)));

  const rows = useMemo<WatchlistRow[]>(() => {
    const metaBySymbol = new Map((pairsMetaQuery.data?.pairs ?? []).map((meta) => [meta.symbol, meta]));
    const favouriteSet = new Set(favourites);
    const symbols = new Set([...metaBySymbol.keys(), ...liveTrackedPairs, ...favouriteSet]);

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
  }, [pairsMetaQuery.data, liveTrackedPairs, favourites, searchQuery]);

  return {
    rows,
    searchQuery,
    setSearchQuery,
    toggleFavourite: toggle,
    refetch: pairsMetaQuery.refetch,
    isRefetching: pairsMetaQuery.isRefetching,
  };
}
