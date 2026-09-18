import { useEffect, useRef } from 'react';
import { MarketUpdateSchema } from '../../contracts/schemas';
import { WS_BASE_URL } from '../api/config';
import { toMarketData } from '../data/mappers/MarketDataMapper';
import { useMarketStore } from '../data/repositories/MarketRepository';
import { WebSocketSource } from '../data/sources/WebSocketSource';
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
    const source = new WebSocketSource({
      url: WS_BASE_URL,
      staleConnectionTimeoutMs: STALE_CONNECTION_TIMEOUT_MS,
      onStatusChange: (status) => {
        useMarketStore.getState().setConnectionStatus(status);
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
        useMarketStore.getState().updatePair(parsed.data.pair, toMarketData(parsed.data));
      },
    });
    sourceRef.current = source;
    source.start();

    return () => {
      source.stop();
      sourceRef.current = null;
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
