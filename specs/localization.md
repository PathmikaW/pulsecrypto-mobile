# Localization (i18n) — Implementation Spec

Source: ADR-M9. Structured from the start; ships with English (`en`) as the only complete
translation, proving the mechanism end-to-end.

## Setup

`core/i18n/i18n.ts`:
```typescript
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import common from './locales/en/common.json';
import watchlist from './locales/en/watchlist.json';
import marketDetails from './locales/en/market-details.json';
import favourites from './locales/en/favourites.json';

i18next.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  lng: resolveInitialLocale(), // device locale via expo-localization, or MMKV override if set
  fallbackLng: 'en',
  ns: ['common', 'watchlist', 'market-details', 'favourites'],
  defaultNS: 'common',
  resources: {
    en: { common, watchlist, 'market-details': marketDetails, favourites },
  },
  interpolation: { escapeValue: false }, // React already escapes
});

function resolveInitialLocale(): string {
  const override = mmkvStorage.getString('language-override');
  if (override) return override;
  const deviceLocale = Localization.getLocales()[0]?.languageCode ?? 'en';
  return i18next.options.resources?.[deviceLocale] ? deviceLocale : 'en';
}
```

## Namespace files (initial English content — extend as screens are built)

`core/i18n/locales/en/common.json`:
```json
{
  "connection": {
    "connecting": "Connecting...",
    "connected": "Live",
    "disconnected": "Disconnected",
    "reconnecting": "Reconnecting..."
  },
  "untrackedPair": "Not currently tracked"
}
```

`core/i18n/locales/en/watchlist.json`:
```json
{
  "title": "Market Watchlist",
  "searchPlaceholder": "Search...",
  "noResults": "No trading pairs match your search"
}
```

`core/i18n/locales/en/market-details.json`:
```json
{
  "currentPrice": "Current Price",
  "buyPressure": "Buy Pressure",
  "sellPressure": "Sell Pressure",
  "spread": "Spread",
  "orderBook": "Order Book",
  "lastUpdated": "Last updated {{time}}"
}
```

`core/i18n/locales/en/favourites.json`:
```json
{
  "addFavourite": "Add to favourites",
  "removeFavourite": "Remove from favourites"
}
```

Add keys to the matching feature's namespace file as each screen is implemented — don't
create a fifth catch-all file; if a string doesn't obviously belong to one of these four,
default it to `common.json`.

## Rule: no hardcoded user-facing strings

Every string a user reads goes through `useTranslation()` / `t('namespace:key')`. This
includes empty states, error messages, and accessibility labels — not just visible screen
titles. Component tests should render key screens with i18next mocked to a non-English
locale (even a fake one, e.g. all-caps or bracketed keys) specifically to catch a string
that silently bypassed translation.

## Manual language override

Persisted in MMKV under the same mechanism as favourites (ADR-M5), key `language-override`.
When set by explicit user action (a settings screen, if one exists — not required by the
assignment, but the infrastructure supports it), it takes precedence over device locale on
next launch, per `resolveInitialLocale()` above.

## Number & date formatting — locale-aware by construction

`core/utils/formatPrice.ts`:
```typescript
export function formatPrice(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD', // display currency for USDT-quoted pairs; not a claim about the asset itself
    minimumFractionDigits: 2,
    maximumFractionDigits: 8, // some pairs need more precision than 2dp
  }).format(value);
}
```

`core/utils/formatPercent.ts`:
```typescript
export function formatPercent(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
}
```

`LastUpdatedLabel` (`core/components/LastUpdatedLabel.tsx`) formats `MarketData.lastUpdatedAt`
via `Intl.DateTimeFormat(locale, { timeStyle: 'medium' })` — never a hand-rolled date string.

Never hardcode a thousands-separator or decimal-point convention (`1,234.56`) directly in a
template string — always go through `Intl`.
