// Verified via Figma's REST API (specs/design-tokens.md). JetBrains Mono is for numeric data, Inter for labels/body, Hanken Grotesk for headings only.
//
// fontFamily is the exact per-weight name @expo-google-fonts exports; a loaded custom font doesn't synthesize other weights,
// so `fontWeight` is only a fallback for before useFonts() resolves.
//
// letterSpacing is 0.55 everywhere per Figma, except headingLarge (0, verified separately).

export const typography = {
  priceDisplay: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontWeight: '700',
    fontSize: 32,
    lineHeight: 38.4,
    letterSpacing: 0.55,
  },
  tableValue: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 14,
    letterSpacing: 0.55,
  },
  tableValueSmall: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontWeight: '400',
    fontSize: 10,
    lineHeight: 10,
    letterSpacing: 0.55,
  },
  tableValueLarge: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 16,
    letterSpacing: 0.55,
  },
  // Forces all-caps regardless of the source string's casing.
  labelCaps: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 11,
    lineHeight: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.55,
  },
  body: {
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 21,
    letterSpacing: 0.55,
  },
  bodySmall: {
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 16.8,
    letterSpacing: 0.55,
  },
  heading: {
    fontFamily: 'HankenGrotesk_600SemiBold',
    fontWeight: '600',
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: 0.55,
  },
  headingLarge: {
    fontFamily: 'HankenGrotesk_600SemiBold',
    fontWeight: '600',
    fontSize: 24,
    lineHeight: 31.2,
    letterSpacing: 0,
  },
} as const;
