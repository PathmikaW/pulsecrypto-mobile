import { create } from 'zustand';

// Cross-feature global UI state ONLY — isOnline, activeTab, activeLocale (ADR-M8).
// Deliberately minimal, same discipline as core/. Market data and connection status live
// in core/data's MarketRepository instead, since they're written by the same WS pipeline.
interface UiState {
  isOnline: boolean;
  activeTab: string;
  activeLocale: string;
  setIsOnline: (isOnline: boolean) => void;
  setActiveTab: (tab: string) => void;
  setActiveLocale: (locale: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  isOnline: true,
  activeTab: 'Terminal',
  activeLocale: 'en',
  setIsOnline: (isOnline) => set({ isOnline }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setActiveLocale: (activeLocale) => set({ activeLocale }),
}));
