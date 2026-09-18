export function formatPrice(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD', // display currency for USDT-quoted pairs; not a claim about the asset itself
    minimumFractionDigits: 2,
    maximumFractionDigits: 8, // some pairs need more precision than 2dp
  }).format(value);
}
