const KNOWN_QUOTE_ASSETS = ['USDT'];

// Every pair in this system is USDT-quoted (ADR-B3's exclusion filters rule out anything
// else, including for the required pairs) - this isn't a general-purpose parser, just
// enough to label the order book's "AMOUNT" column with the right base asset per pair.
export function parseBaseAsset(displayName: string | undefined, symbol: string): string {
  if (displayName?.includes('/')) return displayName.split('/')[0];
  const quote = KNOWN_QUOTE_ASSETS.find((q) => symbol.endsWith(q));
  return quote ? symbol.slice(0, -quote.length) : symbol;
}
