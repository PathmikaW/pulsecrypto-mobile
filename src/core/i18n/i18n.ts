import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import { mmkv } from '../storage/mmkv';
import common from './locales/en/common.json';
import watchlist from './locales/en/watchlist.json';
import marketDetails from './locales/en/market-details.json';
import favourites from './locales/en/favourites.json';

export const LANGUAGE_OVERRIDE_KEY = 'language-override';

const resources = {
  en: { common, watchlist, 'market-details': marketDetails, favourites },
};

function resolveInitialLocale(): string {
  const override = mmkv.getString(LANGUAGE_OVERRIDE_KEY);
  if (override && override in resources) return override;
  const deviceLocale = Localization.getLocales()[0]?.languageCode ?? 'en';
  return deviceLocale in resources ? deviceLocale : 'en';
}

// Documented i18next init; the default export and its named `use` are the same function.
// eslint-disable-next-line import/no-named-as-default-member
void i18next.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  lng: resolveInitialLocale(),
  fallbackLng: 'en',
  ns: ['common', 'watchlist', 'market-details', 'favourites'],
  defaultNS: 'common',
  resources,
  interpolation: { escapeValue: false }, // React already escapes
});

export default i18next;
