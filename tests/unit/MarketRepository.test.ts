import { marketRepository, useMarketStore } from '../../src/core/data/repositories/MarketRepository';
import type { MarketData } from '../../src/core/domain/models/MarketData';

function makeMarketData(pair: string, price: number): MarketData {
  return { pair, price, spread: 1, buyPressure: 50, sellPressure: 50, bids: [], asks: [], lastUpdatedAt: 1 };
}

describe('marketStore / marketRepository', () => {
  beforeEach(() => {
    useMarketStore.setState({ pairs: {}, connectionStatus: 'connecting' });
  });

  it('keys pairs dynamically — getTrackedPairs reflects whatever has been updated, not a fixed count', () => {
    useMarketStore.getState().updatePair('BTCUSDT', makeMarketData('BTCUSDT', 1));
    useMarketStore.getState().updatePair('SOLUSDT', makeMarketData('SOLUSDT', 2));

    expect(marketRepository.getTrackedPairs().sort()).toEqual(['BTCUSDT', 'SOLUSDT']);
  });

  it('getSnapshot returns the last-known value synchronously, or null if untracked', () => {
    expect(marketRepository.getSnapshot('BTCUSDT')).toBeNull();

    const data = makeMarketData('BTCUSDT', 65000);
    useMarketStore.getState().updatePair('BTCUSDT', data);

    expect(marketRepository.getSnapshot('BTCUSDT')).toEqual(data);
  });

  it('subscribe notifies only on updates to the subscribed pair', () => {
    const onUpdate = jest.fn();
    const unsubscribe = marketRepository.subscribe('BTCUSDT', onUpdate);

    useMarketStore.getState().updatePair('ETHUSDT', makeMarketData('ETHUSDT', 3000));
    expect(onUpdate).not.toHaveBeenCalled();

    const btcData = makeMarketData('BTCUSDT', 65000);
    useMarketStore.getState().updatePair('BTCUSDT', btcData);
    expect(onUpdate).toHaveBeenCalledWith(btcData);

    unsubscribe();
    useMarketStore.getState().updatePair('BTCUSDT', makeMarketData('BTCUSDT', 66000));
    expect(onUpdate).toHaveBeenCalledTimes(1);
  });

  it('does not clear pairs on a connection-status change (ADR-M7 — stale data stays visible)', () => {
    useMarketStore.getState().updatePair('BTCUSDT', makeMarketData('BTCUSDT', 65000));
    useMarketStore.getState().setConnectionStatus('disconnected');

    expect(marketRepository.getSnapshot('BTCUSDT')).not.toBeNull();
  });
});
