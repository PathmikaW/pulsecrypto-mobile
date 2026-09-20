import { getCachedNumberFormat } from './intlFormatterCache';

export function formatPercent(value: number, locale: string): string {
  return getCachedNumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
}
