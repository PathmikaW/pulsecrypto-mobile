# Offline / Connection-State Behavior — Implementation Spec

Source: ADR-M6, ADR-M7. Implements the assignment's offline-behavior requirement:
display connection status, keep showing last-known data, reconnect automatically.

## Connection state machine

```typescript
type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
```

Owned by `useWebSocket` (`core/hooks/useWebSocket.ts`), surfaced to the rest of the app via
Zustand (a simple UI-facing field, per ADR-M2). `ConnectionIndicator`
(`core/components/ConnectionIndicator.tsx`) renders it, localized (ADR-M9).

**Transitions:**
- App launch / socket construction → `connecting`
- `onopen` fires → `connected`
- Socket closes, errors, or the liveness timeout below fires while status was `connected`
  → `disconnected`
- A reconnect attempt is scheduled/in flight → `reconnecting`
- Reconnect succeeds (`onopen` again) → `connected`

## Liveness detection — broadcast silence, no heartbeat

The backend broadcasts every `BROADCAST_INTERVAL_MS` (100ms default) whenever healthy —
that cadence *is* the liveness signal (ADR-M6). Do not implement or expect a ping/pong
message from either side.

```typescript
const STALE_CONNECTION_TIMEOUT_MS = MAX_CONSECUTIVE_SKIPS * BROADCAST_INTERVAL_MS; // ~1000ms
// both constants mirror the backend's own env defaults — document this derivation in code,
// don't hardcode 1000 as an unrelated magic number.

let lastMessageAt = Date.now();
// on every inbound WS message, regardless of pair: lastMessageAt = Date.now();

const staleCheckInterval = setInterval(() => {
  if (Date.now() - lastMessageAt > STALE_CONNECTION_TIMEOUT_MS) {
    setConnectionStatus('disconnected');
    // triggers the reconnect effect below
  }
}, STALE_CONNECTION_TIMEOUT_MS / 2); // check at roughly double the timeout's resolution
```

## Reconnection — exponential backoff with jitter

```
attempt 1: ~1s   (1000ms ± jitter)
attempt 2: ~2s
attempt 3: ~4s
attempt 4: ~8s
attempt 5+: capped at 30s
```
Add jitter (e.g. `±20%` random variance) to avoid a thundering-herd reconnect pattern if
this were ever running against a shared backend with multiple clients reconnecting
simultaneously — not critical for a single-device demo, but costs nothing to include and
is correct practice.

Reset the backoff counter to attempt 1 as soon as a connection successfully reaches
`connected`.

## Incoming message validation (ADR-M6, v8.1 addition)

Every message received by `useWebSocket` is parsed and validated against the mirrored Zod
schema (`src/contracts/schemas.ts`, `MarketUpdateSchema`) before it's handed to
`marketStore.updatePair`:

```typescript
socket.onmessage = (event) => {
  lastMessageAt = Date.now();
  const parsed = MarketUpdateSchema.safeParse(JSON.parse(event.data));
  if (!parsed.success) {
    if (__DEV__) console.warn('Dropped invalid market update', parsed.error);
    return; // never throw, never apply a partially-shaped object to the store
  }
  useMarketStore.getState().updatePair(parsed.data.pair, parsed.data);
};
```

This is the concrete mechanism behind the assignment's "appropriate error handling"
non-functional requirement on the live-data path — a malformed or unexpected payload is
dropped silently (logged only in dev), not applied to the store and not allowed to throw
and take down the socket handler.

## App backgrounding

Use `AppState` (`core/hooks/useAppState.ts`) to detect background/foreground transitions:
- On background: do not force-close the socket immediately, but stop actively reconnecting
  if disconnected — no point burning battery/network reconnecting to a screen nobody sees.
- On foreground: if status is `disconnected`, immediately attempt reconnection rather than
  waiting for the next scheduled backoff tick.

## Data behavior while disconnected

**The Zustand `marketStore` is never cleared on disconnect.** The UI continues rendering
the last-received `MarketData` for every pair, unchanged, for as long as the connection is
down. This is the "continue showing the most recently received data" requirement — it is a
property of *not doing anything* to the store on disconnect, not an active caching
mechanism (the MMKV persistence in ADR-M5 additionally survives app restarts, which is a
separate, complementary guarantee for cold launch).

`ConnectionIndicator` is the only UI element that changes state on disconnect — prices,
order books, etc. stay exactly as last rendered.

## Pull-to-refresh — must not touch the WebSocket

Pull-to-refresh on the watchlist re-triggers TanStack Query's `refetch()` for
`GET /pairs/meta` only. It must not construct a new WebSocket connection, close the
existing one, or otherwise interact with `useWebSocket`'s state — those are two completely
independent data paths (ADR-M2's client/server-state split exists precisely so this
separation is structural, not something to be careful about by convention).

## Testing

- `useWebSocket`'s state-transition logic, including the stale-silence timeout, should be
  unit-testable by injecting a fake timer and a mock socket — no real network connection.
- A component test should verify that disconnecting (simulated) does not clear
  `marketStore`'s rendered values, only `ConnectionIndicator`'s displayed state.
