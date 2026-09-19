import { useEffect, useRef } from 'react';
import { MarketUpdateSchema } from '../../contracts/schemas';
import { WS_BASE_URL } from '../api/config';
import { toMarketData } from '../data/mappers/MarketDataMapper';
import { useMarketStore } from '../data/repositories/MarketRepository';
import { WebSocketSource } from '../data/sources/WebSocketSource';
import type { MarketData } from '../domain/models/MarketData';
import type { TradingPairSymbol } from '../domain/models/TradingPair';
import { useAppState } from './useAppState';

// Mirrors the backend's own MAX_CONSECUTIVE_SKIPS * BROADCAST_INTERVAL_MS (ADR-B4
// defaults: 10 * 100ms) — kept as a named derivation, not an unrelated magic number, so
// the two can't silently drift apart if the backend's tuning ever changes (ADR-M6).
const MAX_CONSECUTIVE_SKIPS = 10;
const BROADCAST_INTERVAL_MS = 100;
const STALE_CONNECTION_TIMEOUT_MS = MAX_CONSECUTIVE_SKIPS * BROADCAST_INTERVAL_MS;

/**
 * Owns the WebSocket connection lifecycle (ADR-M6): connects on mount, validates every
 * incoming message against the mirrored contract schema before applying it to
 * `marketStore`, and tears down on unmount. No ping/pong — broadcast cadence itself is the
 * liveness signal.
 */
export function useWebSocket(): void {
  const sourceRef = useRef<WebSocketSource | null>(null);
  const appState = useAppState();

  useEffect(() => {
    // The backend's conflation tick broadcasts ~8 near-simultaneous per-pair messages back
    // to back. Applying each with its own updatePair() was up to 8 separate set() calls /
    // React commits per tick - a real, measured source of the reported FPS drops under live
    // traffic. Instead, buffer parsed updates and commit them all in a single updatePairs()
    // call once per animation frame, so a full broadcast tick is at most one re-render pass
    // (ADR-M10 perf pass).
    const pendingUpdates = new Map<TradingPairSymbol, MarketData>();
    let flushHandle: number | null = null;

    const flushPendingUpdates = () => {
      flushHandle = null;
      if (pendingUpdates.size === 0) return;
      const updates = Array.from(pendingUpdates.entries());
      pendingUpdates.clear();
      useMarketStore.getState().updatePairs(updates);
    };

    const source = new WebSocketSource({
      url: WS_BASE_URL,
      staleConnectionTimeoutMs: STALE_CONNECTION_TIMEOUT_MS,
      onStatusChange: (status) => {
        useMarketStore.getState().setConnectionStatus(status);
      },
      onMessageRate: (rate) => {
        useMarketStore.getState().setWsMessageRate(rate);
      },
      onMessage: (raw) => {
        let parsedJson: unknown;
        try {
          parsedJson = JSON.parse(raw);
        } catch {
          if (__DEV__) console.warn('Dropped non-JSON market update payload');
          return;
        }
        const parsed = MarketUpdateSchema.safeParse(parsedJson);
        if (!parsed.success) {
          if (__DEV__) console.warn('Dropped invalid market update', parsed.error);
          return;
        }
        pendingUpdates.set(parsed.data.pair, toMarketData(parsed.data));
        if (flushHandle === null) {
          flushHandle = requestAnimationFrame(flushPendingUpdates);
        }
      },
    });
    sourceRef.current = source;
    source.start();

    return () => {
      source.stop();
      sourceRef.current = null;
      if (flushHandle !== null) {
        cancelAnimationFrame(flushHandle);
        flushHandle = null;
      }
      pendingUpdates.clear();
    };
  }, []);

  useEffect(() => {
    const source = sourceRef.current;
    if (!source) return;
    if (appState === 'active') {
      source.resumeOnForeground();
    } else {
      source.pauseReconnectOnBackground();
    }
  }, [appState]);
}
