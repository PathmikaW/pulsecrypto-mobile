const numberFormatCache = new Map<string, Intl.NumberFormat>();

// Intl.NumberFormat construction is expensive and this runs ~60x/tick; the key space (locale x fixed option shapes) is small and bounded.
export function getCachedNumberFormat(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let formatter = numberFormatCache.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, options);
    numberFormatCache.set(key, formatter);
  }
  return formatter;
}
