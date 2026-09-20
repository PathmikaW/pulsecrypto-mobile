import { useEffect, useRef } from 'react';
import { MarketUpdateSchema } from '../../contracts/schemas';
import { WS_BASE_URL } from '../api/config';
import { toMarketData } from '../data/mappers/MarketDataMapper';
import { useMarketStore } from '../data/repositories/MarketRepository';
import { WebSocketSource } from '../data/sources/WebSocketSource';
import type { MarketData } from '../domain/models/MarketData';
import type { TradingPairSymbol } from '../domain/models/TradingPair';
import { useAppState } from './useAppState';

// Derived from the backend's MAX_CONSECUTIVE_SKIPS * BROADCAST_INTERVAL_MS so the two can't drift apart (ADR-M6).
const MAX_CONSECUTIVE_SKIPS = 10;
const BROADCAST_INTERVAL_MS = 100;
const STALE_CONNECTION_TIMEOUT_MS = MAX_CONSECUTIVE_SKIPS * BROADCAST_INTERVAL_MS;

/** Owns the WS connection lifecycle (ADR-M6): validates each message against the mirrored contract before applying it. */
export function useWebSocket(): void {
  const sourceRef = useRef<WebSocketSource | null>(null);
  const appState = useAppState();

  useEffect(() => {
    // A broadcast tick delivers ~8 per-pair messages back to back; buffer them and commit once per animation frame so a tick is at most one render pass (ADR-M10).
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
