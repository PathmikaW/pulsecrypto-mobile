// Verified via Figma's REST API (specs/design-tokens.md). JetBrains Mono is reserved for
// numeric/tabular data (column alignment in a trading UI); Inter for labels/body; Hanken
// Grotesk for headings only — don't substitute across these roles.

export const typography = {
  priceDisplay: { fontFamily: 'JetBrains Mono', fontWeight: '700', fontSize: 32, lineHeight: 38.4 },
  tableValue: { fontFamily: 'JetBrains Mono', fontWeight: '500', fontSize: 14, lineHeight: 14 },
  tableValueSmall: { fontFamily: 'JetBrains Mono', fontWeight: '400', fontSize: 10, lineHeight: 10 },
  tableValueLarge: { fontFamily: 'JetBrains Mono', fontWeight: '500', fontSize: 16, lineHeight: 16 },
  labelCaps: { fontFamily: 'Inter', fontWeight: '700', fontSize: 11, lineHeight: 11 },
  body: { fontFamily: 'Inter', fontWeight: '400', fontSize: 14, lineHeight: 21 },
  bodySmall: { fontFamily: 'Inter', fontWeight: '400', fontSize: 12, lineHeight: 16.8 },
  heading: { fontFamily: 'Hanken Grotesk', fontWeight: '600', fontSize: 20, lineHeight: 28 },
  headingLarge: { fontFamily: 'Hanken Grotesk', fontWeight: '700', fontSize: 32, lineHeight: 38.4 },
} as const;
