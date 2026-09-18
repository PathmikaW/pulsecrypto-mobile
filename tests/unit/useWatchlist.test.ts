import { act, renderHook } from '@testing-library/react-native';
import { useMarketStore } from '../../src/core/data/repositories/MarketRepository';
import { useFavouritesStore } from '../../src/features/favourites/data/FavouritesRepository';
import { useWatchlist } from '../../src/features/watchlist/presentation/useWatchlist';
import type { MarketData } from '../../src/core/domain/models/MarketData';

jest.mock('../../src/core/hooks/usePairsMeta', () => ({
  usePairsMeta: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports -- must import after the mock is registered
const { usePairsMeta } = require('../../src/core/hooks/usePairsMeta');
const mockedUsePairsMeta = usePairsMeta as jest.Mock;

function makeMeta(symbol: string, displayName: string) {
  return { symbol, displayName, tradingStatus: 'TRADING' as const, high24h: 1, low24h: 1, volume24h: 1 };
}

function makeMarketData(pair: string): MarketData {
  return {
    pair,
    price: 1,
    change24h: 0,
    spread: 1,
    buyPressure: 50,
    sellPressure: 50,
    bids: [],
    asks: [],
    lastUpdatedAt: 1,
  };
}

describe('useWatchlist', () => {
  beforeEach(() => {
    useFavouritesStore.setState({ favourites: [] });
    useMarketStore.setState({ pairs: {} });
    mockedUsePairsMeta.mockReturnValue({
      data: {
        pairs: [makeMeta('BTCUSDT', 'BTC/USDT'), makeMeta('ETHUSDT', 'ETH/USDT')],
        resolvedAt: '2026-01-01T00:00:00.000Z',
      },
      refetch: jest.fn(),
      isRefetching: false,
    });
  });

  it('returns a row for every tracked pair', () => {
    const { result } = renderHook(() => useWatchlist());

    expect(result.current.rows.map((r) => r.symbol)).toEqual(['BTCUSDT', 'ETHUSDT']);
    expect(result.current.rows.every((r) => r.isTracked)).toBe(true);
  });

  it('includes a favourited pair outside the tracked set, marked as untracked (ADR-M8)', () => {
    useFavouritesStore.setState({ favourites: ['SOLUSDT'] });
    const { result } = renderHook(() => useWatchlist());

    const solRow = result.current.rows.find((r) => r.symbol === 'SOLUSDT');
    expect(solRow?.isTracked).toBe(false);
    expect(solRow?.isFavourite).toBe(true);
    expect(solRow?.displayName).toBe('SOLUSDT'); // no meta available, falls back to the raw symbol
  });

  it('filters rows by search query, case-insensitively, matching symbol or display name', () => {
    const { result } = renderHook(() => useWatchlist());

    act(() => result.current.setSearchQuery('eth'));

    expect(result.current.rows.map((r) => r.symbol)).toEqual(['ETHUSDT']);
  });

  it('falls back to live/cached WS data when /pairs/meta has no data (backend down or still loading)', () => {
    mockedUsePairsMeta.mockReturnValue({ data: undefined, refetch: jest.fn(), isRefetching: false });
    useMarketStore.setState({ pairs: { DOGEUSDT: makeMarketData('DOGEUSDT') } });

    const { result } = renderHook(() => useWatchlist());

    // Without the fallback this would be an empty list forever, even though real data
    // exists in the store — that was the actual bug (mobile-screens.md's offline-state
    // requirement, ADR-M7).
    expect(result.current.rows.map((r) => r.symbol)).toEqual(['DOGEUSDT']);
    expect(result.current.rows[0].isTracked).toBe(false); // no meta, but still shown
  });

  it('marks a pair as favourite once toggled', () => {
    const { result } = renderHook(() => useWatchlist());

    act(() => result.current.toggleFavourite('BTCUSDT'));

    expect(result.current.rows.find((r) => r.symbol === 'BTCUSDT')?.isFavourite).toBe(true);
  });
});
