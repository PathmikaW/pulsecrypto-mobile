const KNOWN_QUOTE_ASSETS = ['USDT'];

// Figma always shows "BTC/USDT" formatting, never the raw "BTCUSDT" symbol. The REST
// /pairs/meta call provides a real displayName, but the Terminal header shouldn't fall
// back to an unformatted symbol just because that call hasn't resolved yet (or is down) -
// every pair in this system is USDT-quoted (ADR-B3), so "BTC/USDT" can always be derived
// directly from the symbol without needing the backend at all.
export function formatPairDisplayName(displayName: string | undefined, symbol: string): string {
  if (displayName) return displayName;
  const quote = KNOWN_QUOTE_ASSETS.find((q) => symbol.endsWith(q));
  return quote ? `${symbol.slice(0, -quote.length)}/${quote}` : symbol;
}
