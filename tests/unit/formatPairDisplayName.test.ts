import { formatPairDisplayName } from '../../src/core/utils/formatPairDisplayName';

describe('formatPairDisplayName', () => {
  it('uses the real displayName when available', () => {
    expect(formatPairDisplayName('BTC/USDT', 'BTCUSDT')).toBe('BTC/USDT');
  });

  it('derives "BASE/QUOTE" from the raw symbol when no displayName is available yet', () => {
    expect(formatPairDisplayName(undefined, 'ETHUSDT')).toBe('ETH/USDT');
  });

  it('falls back to the raw symbol if no known quote asset matches', () => {
    expect(formatPairDisplayName(undefined, 'UNKNOWN')).toBe('UNKNOWN');
  });
});
