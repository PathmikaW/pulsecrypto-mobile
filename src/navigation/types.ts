import type { TradingPairSymbol } from '../core/domain/models/TradingPair';

// Five screens, not four (ADR-M10) — Telemetry and Settings share one screen component,
// since the Figma file specifies a single combined "Telemetry & Settings" destination
// even though the bottom nav shows them as two separate tabs (specs/mobile-screens.md).
export type RootStackParamList = {
  Markets: undefined;
  Terminal: { pair?: TradingPairSymbol } | undefined;
  Telemetry: undefined;
  Settings: undefined;
};
