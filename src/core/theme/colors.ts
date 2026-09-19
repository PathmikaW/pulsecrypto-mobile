// Verified via Figma's REST API (specs/design-tokens.md) — not visually approximated.

export const colors = {
  background: {
    screenTerminal: '#0B1420',
    screenTelemetry: '#0B0E14',
    navBar: '#141C28',
    recessed: '#18202D',
    card: '#1E2633',
    tableHeader: '#222A37',
    divider: '#2D3543',
    // The Market Depth panel's floating Liquidity Gap/Pressure overlay specifically -
    // distinct from the general `card` tone.
    depthLegend: '#45474B',
  },
  text: {
    primary: '#DBE3F4',
    numeric: '#C6C6CB',
    label: '#909095',
    onAccent: '#FFFFFF',
  },
  signal: {
    positive: '#3FE092',
    positiveDeep: '#00C479',
    positiveMuted: '#004A2A',
    negative: '#EA295B',
    negativeMuted: '#FFB2BA',
  },
} as const;
