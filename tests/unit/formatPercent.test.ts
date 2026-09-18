import { formatPercent } from '../../src/core/utils/formatPercent';

describe('formatPercent', () => {
  it('formats a 0-100 buy/sell pressure value as a percentage', () => {
    expect(formatPercent(63, 'en-US')).toBe('63.00%');
  });

  it('formats a negative change value with a sign', () => {
    expect(formatPercent(-2.5, 'en-US')).toBe('-2.50%');
  });
});
