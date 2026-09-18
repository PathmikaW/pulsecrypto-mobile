import { toMarketData } from '../../src/core/data/mappers/MarketDataMapper';
import type { MarketUpdate } from '../../src/contracts/schemas';

const update: MarketUpdate = {
  pair: 'BTCUSDT',
  timestamp: 1720802025,
  lastUpdatedAt: 1720802025123,
  price: 109235.42,
  change24h: -2.5,
  spread: 0.41,
  buyPressure: 63,
  sellPressure: 37,
  bids: [{ price: 109235.0, quantity: 1.203 }],
  asks: [{ price: 109235.41, quantity: 0.884 }],
};

describe('toMarketData', () => {
  it('maps every MarketUpdate field except `timestamp` through unmodified', () => {
    const result = toMarketData(update);

    expect(result).toEqual({
      pair: 'BTCUSDT',
      price: 109235.42,
      change24h: -2.5,
      spread: 0.41,
      buyPressure: 63,
      sellPressure: 37,
      bids: [{ price: 109235.0, quantity: 1.203 }],
      asks: [{ price: 109235.41, quantity: 0.884 }],
      lastUpdatedAt: 1720802025123,
    });
  });

  it('passes lastUpdatedAt through with no recomputation', () => {
    expect(toMarketData(update).lastUpdatedAt).toBe(update.lastUpdatedAt);
  });
});
