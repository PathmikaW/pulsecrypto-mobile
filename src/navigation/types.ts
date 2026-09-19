import type { TradingPairSymbol } from '../core/domain/models/TradingPair';

// Five screens, not four: Telemetry and Settings share one screen component (ADR-M10).
export type RootStackParamList = {
  Markets: undefined;
  Terminal: { pair?: TradingPairSymbol } | undefined;
  Telemetry: undefined;
  Settings: undefined;
};
