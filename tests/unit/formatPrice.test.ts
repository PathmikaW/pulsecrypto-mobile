import { formatPrice } from '../../src/core/utils/formatPrice';

describe('formatPrice', () => {
  it('formats as USD currency with at least 2 fraction digits', () => {
    expect(formatPrice(109235.42, 'en-US')).toBe('$109,235.42');
  });

  it('extends fraction digits up to 8 for sub-cent precision', () => {
    expect(formatPrice(0.00001234, 'en-US')).toBe('$0.00001234');
  });

  it('formats using the given locale, not a hardcoded convention', () => {
    // de-DE uses '.' for thousands and ',' for the decimal separator.
    expect(formatPrice(1234.5, 'de-DE')).toContain('1.234,5');
  });
});
