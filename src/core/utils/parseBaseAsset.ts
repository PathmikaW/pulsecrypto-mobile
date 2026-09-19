const KNOWN_QUOTE_ASSETS = ['USDT'];

// Not a general parser: every pair is USDT-quoted (ADR-B3).
export function parseBaseAsset(displayName: string | undefined, symbol: string): string {
  if (displayName?.includes('/')) return displayName.split('/')[0];
  const quote = KNOWN_QUOTE_ASSETS.find((q) => symbol.endsWith(q));
  return quote ? symbol.slice(0, -quote.length) : symbol;
}
