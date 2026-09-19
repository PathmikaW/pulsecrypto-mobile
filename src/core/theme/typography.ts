// Verified via Figma's REST API (specs/design-tokens.md). JetBrains Mono is reserved for
// numeric/tabular data (column alignment in a trading UI); Inter for labels/body; Hanken
// Grotesk for headings only — don't substitute across these roles.
//
// fontFamily names below are the exact per-weight names @expo-google-fonts/* exports (e.g.
// "JetBrainsMono_700Bold"), loaded via useFonts() in app.tsx - not the generic family name
// plus a separate `fontWeight` style. A custom TTF loaded through expo-font is one specific
// weight per named font; RN does not synthesize other weights from it, so `fontWeight` on a
// custom font is silently ignored (this is why the app was rendering the OS system font at
// default weight everywhere until the fonts were actually loaded and referenced this way).

export const typography = {
  priceDisplay: { fontFamily: 'JetBrainsMono_700Bold', fontSize: 32, lineHeight: 38.4 },
  tableValue: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 14, lineHeight: 14 },
  tableValueSmall: { fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, lineHeight: 10 },
  tableValueLarge: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 16, lineHeight: 16 },
  labelCaps: { fontFamily: 'Inter_700Bold', fontSize: 11, lineHeight: 11 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21 },
  bodySmall: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 16.8 },
  heading: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 20, lineHeight: 28 },
  headingLarge: { fontFamily: 'HankenGrotesk_700Bold', fontSize: 32, lineHeight: 38.4 },
} as const;
