// Verified via Figma's REST API (specs/design-tokens.md). JetBrains Mono is reserved for
// numeric/tabular data (column alignment in a trading UI); Inter for labels/body; Hanken
// Grotesk for headings only — don't substitute across these roles.
//
// fontFamily names below are the exact per-weight names @expo-google-fonts/* exports (e.g.
// "JetBrainsMono_700Bold"), loaded via useFonts() in app.tsx - not the generic family name
// plus a separate `fontWeight` style. A custom TTF loaded through expo-font is one specific
// weight per named font; RN does not synthesize other weights from it, so `fontWeight` is
// ignored once that font is actually loaded. It's still specified below as a defensive
// fallback for the brief window before useFonts() resolves (or a build that hasn't picked
// up the font-loading config plugins via a native rebuild yet) - without it, that window
// renders at the OS default weight instead of an approximation of the real one.

export const typography = {
  priceDisplay: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontWeight: '700',
    fontSize: 32,
    lineHeight: 38.4,
    // Verified-pending: design-tokens.md doesn't have an extracted letterSpacing value for
    // this token (Figma API access has been rate-limited all session). This tightens the
    // default advance width of a 32px monospace price display toward Figma's denser look -
    // confirm the exact value in Figma's Inspect panel (select the LAST PRICE text layer,
    // Typography section, "Letter spacing") and this will be corrected to match exactly.
    letterSpacing: -1,
  },
  tableValue: { fontFamily: 'JetBrainsMono_500Medium', fontWeight: '500', fontSize: 14, lineHeight: 14 },
  tableValueSmall: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontWeight: '400',
    fontSize: 10,
    lineHeight: 10,
  },
  tableValueLarge: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 16,
  },
  // textTransform: 'uppercase' makes this token reliably all-caps regardless of the source
  // string's own casing (was: relying on every caller to type its string in caps already,
  // which "Spread"/"Buy Pressure"/"Sell Pressure" didn't, inconsistent with "24H HIGH" etc.
  // which happened to be typed that way).
  labelCaps: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 11,
    lineHeight: 11,
    textTransform: 'uppercase',
  },
  body: { fontFamily: 'Inter_400Regular', fontWeight: '400', fontSize: 14, lineHeight: 21 },
  bodySmall: { fontFamily: 'Inter_400Regular', fontWeight: '400', fontSize: 12, lineHeight: 16.8 },
  heading: { fontFamily: 'HankenGrotesk_600SemiBold', fontWeight: '600', fontSize: 20, lineHeight: 28 },
  // Corrected against a value manually pulled from Figma's Inspect panel (Hanken Grotesk,
  // weight 600, 24px, line-height 31.2px, letter-spacing 0) - was 700/32/38.4, guessed
  // before that value was available. Only used by TelemetryScreen's page heading.
  headingLarge: {
    fontFamily: 'HankenGrotesk_600SemiBold',
    fontWeight: '600',
    fontSize: 24,
    lineHeight: 31.2,
    letterSpacing: 0,
  },
} as const;
