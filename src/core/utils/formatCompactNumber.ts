const SUFFIXES: readonly { threshold: number; suffix: string }[] = [
  { threshold: 1e12, suffix: 'T' },
  { threshold: 1e9, suffix: 'B' },
  { threshold: 1e6, suffix: 'M' },
  { threshold: 1e3, suffix: 'K' },
];

// Matches Figma's abbreviated stat style (e.g. "1.2T", "1.2k BTC") — a raw
// toLocaleString() of a real 24h volume figure is an unreadably long string
// ("1,603,963,507.375") for a small stat cell.
export function formatCompactNumber(value: number, locale: string): string {
  const abs = Math.abs(value);
  const match = SUFFIXES.find((s) => abs >= s.threshold);
  if (!match) return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);

  const scaled = value / match.threshold;
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(scaled)}${match.suffix}`;
}
