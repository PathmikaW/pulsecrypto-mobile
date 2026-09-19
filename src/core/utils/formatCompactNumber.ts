import { getCachedNumberFormat } from './intlFormatterCache';

const SUFFIXES: readonly { threshold: number; suffix: string }[] = [
  { threshold: 1e12, suffix: 'T' },
  { threshold: 1e9, suffix: 'B' },
  { threshold: 1e6, suffix: 'M' },
  { threshold: 1e3, suffix: 'K' },
];

// Abbreviated stats ("1.2T"): a raw toLocaleString of a 24h volume is too long for a stat cell.
export function formatCompactNumber(value: number, locale: string): string {
  const abs = Math.abs(value);
  const match = SUFFIXES.find((s) => abs >= s.threshold);
  if (!match) return getCachedNumberFormat(locale, { maximumFractionDigits: 2 }).format(value);

  const scaled = value / match.threshold;
  return `${getCachedNumberFormat(locale, { maximumFractionDigits: 1 }).format(scaled)}${match.suffix}`;
}
