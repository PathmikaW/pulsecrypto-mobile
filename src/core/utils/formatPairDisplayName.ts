const KNOWN_QUOTE_ASSETS = ['USDT'];

// Derived from the symbol (every pair is USDT-quoted, ADR-B3) so the header never shows a raw symbol while /pairs/meta is unresolved.
export function formatPairDisplayName(displayName: string | undefined, symbol: string): string {
  if (displayName) return displayName;
  const quote = KNOWN_QUOTE_ASSETS.find((q) => symbol.endsWith(q));
  return quote ? `${symbol.slice(0, -quote.length)}/${quote}` : symbol;
}
