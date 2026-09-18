import { create } from 'zustand';

// Cross-feature global UI state ONLY — isOnline, activeTab, activeLocale (ADR-M8).
// Deliberately minimal, same discipline as core/. Market data and connection status live
// in core/data's MarketRepository instead, since they're written by the same WS pipeline.
interface UiState {
  isOnline: boolean;
  activeTab: string;
  activeLocale: string;
  /** The account drawer is a single global overlay (rendered once at the app root), not a
   * per-screen instance — opening it from any screen's TopAppBar is exactly the
   * cross-feature UI state this store exists for. */
  isDrawerOpen: boolean;
  setIsOnline: (isOnline: boolean) => void;
  setActiveTab: (tab: string) => void;
  setActiveLocale: (locale: string) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  isOnline: true,
  activeTab: 'Terminal',
  activeLocale: 'en',
  isDrawerOpen: false,
  setIsOnline: (isOnline) => set({ isOnline }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setActiveLocale: (activeLocale) => set({ activeLocale }),
  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),
}));
