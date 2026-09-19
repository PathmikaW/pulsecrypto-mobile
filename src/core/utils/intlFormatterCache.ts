const numberFormatCache = new Map<string, Intl.NumberFormat>();

// Constructing an Intl.NumberFormat is expensive (documented V8/MDN perf pitfall) - this
// app calls format helpers up to ~60x/tick on Terminal (order book) and ~16x/tick on
// Watchlist, so a fresh instance per call was a measurable source of the reported FPS
// drops. The cache key space is small and bounded: it's just (locale x the handful of
// fixed option shapes this app actually uses), never user-controlled, so the Map can't
// grow unbounded.
export function getCachedNumberFormat(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let formatter = numberFormatCache.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, options);
    numberFormatCache.set(key, formatter);
  }
  return formatter;
}
