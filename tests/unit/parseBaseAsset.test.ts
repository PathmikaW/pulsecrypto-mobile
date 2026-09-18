import { parseBaseAsset } from '../../src/core/utils/parseBaseAsset';

describe('parseBaseAsset', () => {
  it('extracts the base asset from a displayName when available', () => {
    expect(parseBaseAsset('BTC/USDT', 'BTCUSDT')).toBe('BTC');
  });

  it('falls back to stripping the USDT suffix from the symbol when no displayName exists', () => {
    expect(parseBaseAsset(undefined, 'ETHUSDT')).toBe('ETH');
  });

  it('falls back to the raw symbol if neither a displayName nor a known quote suffix is found', () => {
    expect(parseBaseAsset(undefined, 'UNKNOWN')).toBe('UNKNOWN');
  });
});
