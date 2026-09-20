import { create } from 'zustand';
import type { TradingPairSymbol } from '../core/domain/models/TradingPair';

// Cross-feature UI state only (ADR-M8), same discipline as core/. Market data and connection status live in core/data.
interface UiState {
  /** Single global overlay rendered at the app root. */
  isDrawerOpen: boolean;
  /** The pair shown in Terminal's TopAppBar; Telemetry shows the same one. */
  selectedPair: TradingPairSymbol | null;
  openDrawer: () => void;
  closeDrawer: () => void;
  setSelectedPair: (pair: TradingPairSymbol) => void;
}

export const useUiStore = create<UiState>((set) => ({
  isDrawerOpen: false,
  selectedPair: null,
  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),
  setSelectedPair: (selectedPair) => set({ selectedPair }),
}));
