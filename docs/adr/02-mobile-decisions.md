## 3. Mobile Architecture Decisions

### ADR-M1: React Native Framework — Expo (Dev Client / Prebuild)

**Context.** A choice is needed between Expo and bare React Native CLI.

**Options considered:**

| Option                           | Pros                                            | Cons                                                                                                                                             |
| -------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Expo (Managed / Expo Go)         | Fastest possible setup                          | No custom native modules — ruled out immediately, since Reanimated, MMKV, and the live WebSocket client all require native code                  |
| **Expo (Dev Client / Prebuild)** | Full native access, strong developer experience | Tied to Expo's release cadence (mitigated — frequent releases, no forced cloud dependency)                                                       |
| Bare React Native CLI            | Full native control                             | Equivalent native capability to Dev Client today, at the cost of hand-maintaining native project files across every React Native version upgrade |

**Decision.** Expo, using Dev Client and Continuous Native Generation (`npx expo prebuild`) — not Expo Go, and not bare CLI. See §5 for the specific SDK version and a note on an SDK 56 regression that directly affects this project's animation library.

**Rationale.**

1. **Native Access When Needed:**

   - `npx expo prebuild` generates real `android/` and `ios/` directories — standard Gradle and Xcode projects, not a sandbox.
   - These can be opened in Xcode or Android Studio and edited directly, exactly as a bare CLI project's native folders would be.
   - The Expo Modules API provides a clean interface for writing custom native modules when required.
   - This matches the role's description of production-grade mobile work occasionally requiring direct native-project work when required — the native projects exist and are fully editable; they're simply not hand-carried across every framework upgrade by default.

2. **Capability for a Platform With Future Native Needs:**

   - Config plugins exist for common categories of native SDK a wagering platform would plausibly integrate over time — geolocation/geofencing compliance, KYC, biometrics — and where a config plugin doesn't yet exist for a specific SDK, the underlying native code still installs the same way it would in a bare project, since a Dev Client build _is_ a real native project.
   - Full control over code signing and provisioning profiles remains with the developer, not with Expo.
   - EAS Build is entirely optional: `npx expo prebuild` followed by `npx expo run:android` / `npx expo run:ios` compiles with a local Gradle/Xcode toolchain, with no Expo account or cloud dependency required at any point.

3. **Lower Long-Run Maintenance Cost:**

   - Continuous Native Generation regenerates native projects from declarative configuration rather than requiring native project files (Podfile, Gradle, AppDelegate, MainApplication) to be hand-maintained through every React Native version bump.
   - This is a real, recurring engineering cost under the bare CLI model — one that scales with the number of native dependencies a project accumulates over time — and Dev Client avoids it by construction.

4. **Industry Direction, Both Sides Considered:**

   - React Native's own documentation recommends Expo as the default starting point for new projects.
   - Coinbase's Mobile DevX team has publicly stated its engineers work with React Native and Expo in production — a directly relevant precedent from a fintech/crypto company.
   - New Architecture (Fabric/TurboModules) is fully supported.
   - **Counter-evidence, stated plainly rather than omitted:** the picture isn't one-sided. Shopify announced in 2026 that it is moving its major applications away from React Native entirely, back to native Swift/Kotlin, citing AI-assisted native development narrowing cross-platform's traditional cost advantage — and as part of that move, Shopify is winding down its sponsorship of React Native open-source projects it built, including FlashList (see ADR-M3). That doesn't change the calculus for a small, from-scratch real-time viewer like PulseCrypto, where the native-integration surface is minimal and the iteration-speed benefit is real — but an honest technical comparison includes both data points, not only the one that supports the choice made.

5. **Fit for the Assignment as Specified:**

   - Faster iteration without sacrificing native capability.
   - Both Expo and bare RN CLI are explicitly listed as acceptable in the assignment brief — this is treated as an engineering judgment call rather than a compliance requirement, and is documented as such.

**Trade-offs accepted.**

- Dependency on Expo's release cadence, mitigated by frequent releases and the fact that EAS is never mandatory.
- A small number of bleeding-edge OS APIs may require a hand-written native module before a config plugin exists for them — equally true under bare CLI, so not a comparative disadvantage.
- A residual "unlearning curve" for engineers who still associate Expo with its older managed/bare split — addressed directly by point 1 above, since that split is outdated once Dev Client and CNG are the actual comparison point.

**Why not bare CLI:**

- Native capability is equivalent, not inferior, once Dev Client/Prebuild — rather than Expo Go — is the fair point of comparison.
- Bare CLI's one genuine remaining edge case (a team that never wants a generation step, or an OS API with literally zero native-module coverage anywhere) doesn't apply to this project.
- Bare CLI's traditional reputation for offering more genuine native control no longer reflects a real capability gap in 2026 — treating it as automatically the more rigorous choice would be weighing the tool's reputation rather than its actual, current capability.

---

### ADR-M2: State Management — Zustand + TanStack Query

**Context.** Both high-frequency WebSocket data and lower-frequency REST metadata need to be managed, across a pair set whose size beyond the required five is resolved dynamically by the backend (ADR-B3) rather than fixed.

**Decision.** Two purpose-fit tools, not one used for everything:

| Data                            | Source        | Tool                         | Why                                                                                |
| ------------------------------- | ------------- | ---------------------------- | ---------------------------------------------------------------------------------- |
| Market data (price, order book) | WebSocket     | **Zustand**                  | High-frequency updates (100ms cadence), selector-based re-renders, direct mutation |
| Metadata (pair info, 24h stats) | REST          | **TanStack Query**           | Built-in caching, background refetch, loading/error states, request deduplication  |
| Favourites                      | Local storage | Zustand (persist middleware) | Simple, persisted key-value state                                                  |
| Connection status               | WebSocket     | Zustand                      | Simple UI-facing enum                                                              |
| Search query                    | UI            | Zustand / local state        | UI filter state                                                                    |

**Rationale.**

1. **Zustand for WebSocket-driven state:** its selector pattern keeps re-renders scoped to only the components subscribed to data that actually changed — important at a 100ms update cadence, where a naive context-based approach would re-render far more of the tree than necessary on every tick.
2. **TanStack Query for REST state — a deliberately forward-looking choice, not a today-only justification.** As it stands, `/pairs/meta` is the only REST call in the app, and a case could be made that a purpose-built server-state library is more than that single endpoint needs on its own. That framing undersells the actual reasoning: the split between "client state" (Zustand) and "server state" (TanStack Query) is an architectural boundary, and boundaries are far cheaper to establish before a codebase grows into needing them than to retrofit afterward, once ad hoc `fetch` calls and hand-rolled loading-state booleans have already spread across several screens. This mirrors the same reasoning already applied elsewhere in this document — the extensibility built into ADR-B3's pair resolution, or ADR-M8's feature-first structure being explicitly sized for a feature that doesn't exist yet — PulseCrypto's architecture is treated throughout as a production system's first iteration, not a disposable assignment scaffold, and the REST state layer is held to that same standard rather than to "what does today's one endpoint strictly require."
3. **Dynamic pair count, handled by design, not by exception:** `marketStore` is keyed by symbol, not by a fixed-length structure — it accommodates however many pairs the backend is actually broadcasting, and that count or membership can differ between app sessions if the backend resolved a different additional-pair set on its last restart. No component or store logic assumes an exact count of five.
4. **`lastUpdatedAt` handling:** `marketStore.updatePair` sets `lastUpdatedAt` directly from the field the backend's conflation tick produced (ADR-B4), with no client-side recomputation — the backend remains the single source of truth for "when was this data current," and `LastUpdatedLabel` (ADR-M8) simply renders what it's given, formatted per the active locale (ADR-M9).

**Trade-offs accepted.** Two libraries instead of one, and one dependency (TanStack Query) whose full value won't be visible until the REST surface grows beyond a single endpoint — accepted deliberately, as the cheaper time to establish this boundary is now, not after the fact.

---

### ADR-M3: List Rendering — FlashList

**Context.** The watchlist renders a dynamically-sized set of five or more pairs, each updating roughly every 100ms.

**Options considered:**

| Option        | Pros                                                          | Cons                                                                  |
| ------------- | ------------------------------------------------------------- | --------------------------------------------------------------------- |
| FlatList      | Built-in, familiar                                            | Recreates cells on frequent updates — a real cost at this update rate |
| **FlashList** | Recycles list cells instead of destroying and recreating them | Extra dependency; maintenance-continuity note below                   |
| SectionList   | Grouped sections                                              | Unnecessary structure for a flat watchlist                            |

**Decision.** FlashList (v2 line, built for React Native's New Architecture — see §5 for the specific version), which the project is already on via Expo.

**Rationale.**

1. Cell recycling is the property that matters under sustained update bursts, and it scales the same whether the list has five rows or eight.
2. Combined with `React.memo` on row components and Zustand's selector pattern (ADR-M2), only the row whose underlying data actually changed re-renders — the recycling and the selector-scoping work together, not independently.
3. Rather than cite an unverified performance multiplier, this ADR originally promised a measured FlashList-vs-FlatList comparison. **That comparison was not performed (v9.1 correction).** Performance was instead validated on the running app: the in-app JS-thread FPS gauge (ADR-M10) read 55 FPS on the Android Emulator (Pixel 8, API 35) during live updates across eight pairs, after the fixes in ADR-M4 and ADR-M11. The recycling benefit is argued from FlashList's documented behavior, not measured here.

**Maintenance continuity, noted transparently.** FlashList was built and has primarily been maintained by Shopify. As part of its 2026 move away from React Native (see ADR-M1), Shopify has announced it is winding down its sponsorship of related open-source projects, including FlashList, by the end of the year. This does not change the technical recommendation — FlashList remains the strongest available option for this use case, and the library continues to function — but it is a maintenance-continuity risk worth monitoring, and it's stated here, consistently with ADR-M1, rather than left unmentioned in one place and disclosed in another.

**Trade-offs accepted.** An additional dependency with a slightly different API surface than FlatList, and the governance consideration noted above.

---

### ADR-M4: Animations — react-native-reanimated

**Context.** Price changes need to briefly flash green/red, and order book volume changes need to animate smoothly, without degrading under a 100ms update cadence.

**Options considered:**

| Option                      | Pros                                                                  | Cons                                             |
| --------------------------- | --------------------------------------------------------------------- | ------------------------------------------------ |
| Animated API (built-in)     | No extra dependency                                                   | Runs on the JS thread — can stutter under load   |
| **react-native-reanimated** | Runs on the UI thread, 60fps achievable independent of JS thread load | Extra native dependency                          |
| Lottie                      | Suited to complex, designed animations                                | Overkill for a color flash or a bar-width change |

**Decision.** `react-native-reanimated` (current major — see §5, including a specific version-pinning note relevant to this exact library).

**Rationale.**

1. Reanimated runs animations on the UI thread via worklets, so price-flash and order-book bar-width transitions are never blocked by JS-thread work processing the next incoming tick.
2. This is the single highest-leverage decision for the requirement that the interface remain smooth and responsive during sustained update bursts — an animation approach tied to the JS thread would be the first thing to visibly degrade under load, precisely when the assignment is testing for that degradation.
3. It's the de facto standard for this category of app (trading, real-time dashboards) for the same reason.

**Trade-offs accepted.** An additional native dependency, handled transparently by the Expo Dev Client setup (ADR-M1); a somewhat more involved animation API than the built-in `Animated`, in exchange for guaranteed UI-thread execution. See §5 for a known Expo SDK 56 regression affecting this exact library, and why that makes the specific SDK version choice non-cosmetic.

**Closing a JS-thread leak in an already-worklet-driven animation (v9.0).** Real-device
testing under live WS traffic (see ADR-M11) found `PriceText` — the price-flash component,
the single most frequently updated piece of UI in the app — still routed its flash
direction (up/down, which decides the flash's color) through a plain `useState`, even
though the flash's opacity animation itself was already a reanimated worklet. The
`setState` call meant every single price tick (every visible watchlist row, plus the
Terminal screen's own price, at the backend's 100ms broadcast cadence) forced a JS-thread
re-render purely to recolor a UI-thread-animated overlay — the exact class of regression
ADR-M4 exists to prevent, reintroduced through one small oversight rather than a rejection
of the pattern. Fixed by moving the direction into a second `useSharedValue`, read directly
inside the same `useAnimatedStyle` worklet that already reads the opacity value; the effect
that used to call `setDirection` now only mutates shared values, triggering zero React
re-renders. The lesson generalizes: reanimated only delivers ADR-M4's guarantee for the
_entire_ data path from a value change to a painted pixel — a single `useState` anywhere in
that path reintroduces JS-thread coupling regardless of how the rest of the path is built,
and is easy to miss in review since the component still visibly "looks" UI-thread-animated.

---

### ADR-M5: Local Persistence — MMKV

**Context.** Favourites, the last known market state, and (per ADR-M9) a manually-chosen language override all need to persist across app restarts.

**Options considered:**

| Option       | Pros                            | Cons                                                       |
| ------------ | ------------------------------- | ---------------------------------------------------------- |
| AsyncStorage | Simple, built-in                | Asynchronous only, slower, string-based                    |
| **MMKV**     | Synchronous, ~30x faster, typed | Native module (already available via the Dev Client setup) |
| SQLite       | Relational, powerful            | Overkill for simple key-value data                         |

**Decision.** MMKV, integrated via Zustand's `persist` middleware.

**Rationale.**

1. **Synchronous reads matter specifically on app launch:** a synchronous read means favourites — and, per ADR-M9, the user's language preference — render correctly on the very first frame, with no flash of an incorrect state while an asynchronous read resolves.
2. **No additional native-integration cost:** MMKV requires the native module already present via the Dev Client setup (ADR-M1), so adopting it doesn't introduce a new category of setup work.
3. **Performance headroom:** the roughly 30x read/write speed advantage over AsyncStorage is not strictly necessary for a small favourites array, but it is the correct default for any state that will be read synchronously on every app launch, and it costs nothing extra to choose it here.

```typescript
// features/favourites/data/FavouritesRepository.ts
export const useFavouritesStore = create<FavouritesState>()(
  persist(
    (set, get) => ({
      favourites: [],
      toggleFavourite: (pair) => {
        /* add or remove the symbol */
      },
    }),
    { name: 'favourites-storage', storage: createJSONStorage(() => mmkvStorage) }
  )
);

// core/data/repositories/MarketRepository.ts — caches last known state so the app never shows an empty screen on launch
export const useMarketStore = create<MarketState>()(
  persist(
    (set) => ({
      pairs: {},
      connectionStatus: 'connecting',
      wsMessageRate: 0,
      updatePair: (pair, data) => {
        /* ... */
      },
      updatePairs: (updates) => {
        /* one set() for a whole broadcast tick */
      },
      // ...
    }),
    {
      name: 'market-data-storage',
      // trailing-edge throttled writes (core/storage/mmkv.ts) — persist would otherwise serialize
      // every pair's full order book on each ~100ms tick
      storage: createJSONStorage(() => createThrottledStorage(mmkvStorage, PERSIST_THROTTLE_MS)),
      partialize: (state) => ({ pairs: state.pairs }),
    }
  )
);
```

`react-native-mmkv` v4 is a Nitro-modules rewrite: the instance is created with `createMMKV(config)`, not `new MMKV(config)` as older docs and earlier drafts of this ADR showed.

**An edge case worth naming here, resolved fully in ADR-M8.** Because the backend's additional (non-required) pairs are resolved dynamically (ADR-B3), a pair a user has favourited can, in principle, fall outside the backend's currently tracked set after a restart if its liquidity ranking has changed. This does not corrupt the favourites list — it's simply symbols — but it does need explicit UI handling, specified in full under ADR-M8.

**Trade-offs accepted.** A native module dependency, already covered by the Dev Client decision in ADR-M1.

---

### ADR-M6: WebSocket Client Strategy — Custom Hook

**Context.** The mobile app needs to connect to the backend's WebSocket server and handle reconnection reliably, and needs a way to detect a connection that has silently died without either side sending a close frame.

**Options considered:**

| Option                             | Pros                                                      | Cons                                                                                               |
| ---------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Native WebSocket API alone         | No dependency                                             | No reconnection, no backoff, no app-state awareness                                                |
| A third-party reconnection library | Some behavior provided out of the box                     | Generally browser-focused, limited configurability for RN-specific concerns like app backgrounding |
| **Custom hook**                    | Full control, tailored to React Native's runtime behavior | More code to write and maintain                                                                    |

**Decision.** A custom `useWebSocket` hook, backed by a framework-agnostic `WebSocketSource` class (`core/data/sources/WebSocketSource.ts`) that owns the connection state machine — so backoff, silence detection and app-state handling are unit-testable without React or a real socket. The hook (`core/hooks/useWebSocket.ts`) only wires the source to the store.

**Options considered — connection liveness detection specifically:**

| Option                                 | Description                                                                                                          | Verdict                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dedicated ping/pong heartbeat protocol | Client and server exchange keepalive messages on a timer, independent of data traffic                                | **Rejected.** This backend broadcasts on a fixed cadence (`BROADCAST_INTERVAL_MS`, 100ms) whenever it's healthy, which is already a liveness signal — a connection that's actually alive is, by definition, delivering broadcasts. A separate heartbeat protocol would answer a question the data stream already answers, at the cost of an extra message type and server-side handling for it. |
| **Broadcast-silence timeout**          | Track time since the last message of any kind was received; treat the connection as dead if that exceeds a threshold | **Selected** — no new protocol surface, no server-side changes, and the threshold is defined as a multiple of the backend's own known broadcast interval rather than an arbitrary separate number                                                                                                                                                                                               |

**Features.**

- Exponential backoff with ±20% jitter (1s → 2s → 4s → 8s, capped at 30s) for reconnection attempts, computed by the shared `computeBackoffMs` (`core/utils/backoff.ts`, also used by the REST retry policy — ADR-M12).
- Liveness via broadcast silence, not a separate heartbeat: `STALE_CONNECTION_TIMEOUT_MS` (1000ms, computed in `useWebSocket.ts` as `MAX_CONSECUTIVE_SKIPS × BROADCAST_INTERVAL_MS` = 10 × 100ms — the same multiple of the broadcast interval the backend itself uses in ADR-B4 to decide a client has fallen behind; the two inputs are duplicated as constants in the mobile code, since the mobile app has no access to the backend's env, so a backend retune must be mirrored by hand) — if no message arrives within that window, the connection is treated as dead and reconnection begins.
- App-state awareness — the connection is paused when the app is backgrounded and re-established on foreground, rather than reconnecting uselessly while the app isn't visible.
- An explicit connection-status union: `'connecting' | 'connected' | 'disconnected' | 'reconnecting'` (lowercase string literals in the code).

**Rationale.**

1. **No redundant liveness mechanism:** building a parallel keepalive channel next to a data stream that already implies "I'm alive" on every tick would be complexity solving a problem this specific design doesn't have — this was caught and corrected during review rather than shipped as an unexamined default.
2. **The threshold stays tied to its source, not a second independent number:** documenting `STALE_CONNECTION_TIMEOUT_MS` as a multiple of `BROADCAST_INTERVAL_MS` means the two can't silently drift apart if the broadcast interval is ever retuned — a plain, unrelated hardcoded timeout wouldn't have that property.
3. **Reliability:** an explicit state machine, owned by the application rather than a third-party library, handles edge cases specific to a mobile runtime (backgrounding, network interface switching) that a browser-focused library wouldn't anticipate.
4. **Testability:** the hook's state transitions — including the silence timeout — can be tested in isolation, independent of a real socket connection.
5. **Directly satisfies the assignment's stated requirement** to automatically reconnect when connectivity is restored, with the added correctness of not fighting the OS over background network usage.

**Trade-offs accepted.** More code than adopting a reconnection library, in exchange for full control over mobile-specific edge cases; the silence-timeout approach depends on the backend genuinely broadcasting at a predictable cadence whenever healthy, which ADR-B4 already guarantees by design — if that guarantee ever changed, this threshold would need revisiting alongside it.

**Defensive validation & error boundary — added for full NFR coverage (v8.1).** The
assignment's non-functional requirements explicitly call for "appropriate error handling,"
and a review of this document against that requirement found two concrete gaps: nothing
validated an incoming WebSocket message before applying it to `marketStore`, and nothing
prevented a rendering error from crashing the entire app to a white screen. Both are cheap
to close and are added here rather than left as an implicit assumption:

- **Message validation:** every incoming WS message is parsed against the mirrored Zod
  schema in `src/contracts/schemas.ts` (the same schema ADR-X1 already requires mobile to
  keep in sync with the backend) before it reaches `marketStore.updatePair`. A message that
  fails validation is logged (dev-only, not surfaced to the user) and dropped — it does not
  throw, does not crash the app, and does not corrupt the store with a partially-shaped
  object. This costs nothing new to adopt: the schema already exists for the contracts-sync
  requirement: this is simply putting it to use at the point data enters the app, not a new
  dependency or mechanism.
- **Error boundary:** the app's root (`app.tsx`, wrapping the navigator) is wrapped in a
  single top-level React error boundary with a minimal, localized fallback screen (a
  message plus a "reload" action) — not per-screen boundaries, which would be more
  structure than a five-to-eight-screen app needs. A rendering bug in one screen degrades
  to a recoverable fallback, not a native crash. No new dependency is required — a small
  class component implementing `componentDidCatch` is standard React and sufficient here;
  a library like `react-error-boundary` is optional convenience, not a functional
  requirement.

**Fail fast on a plaintext transport in production (v9.0).** A security review (prompted by
the developer explicitly calling out security as a priority alongside performance) found
that nothing stopped a production build from silently shipping the same plaintext
`http://`/`ws://` defaults used for local development (`EXPO_PUBLIC_API_BASE_URL`,
`EXPO_PUBLIC_WS_BASE_URL` — plaintext is correct and expected there, e.g. the Android
Emulator's `10.0.2.2` loopback) if an env var were ever left unset or misconfigured for a
real release build. `src/core/api/config.ts` now throws at module load, outside `__DEV__`
only, if either URL doesn't use `https://`/`wss://` — a deliberately loud, unrecoverable
failure rather than a warning, since a silently-plaintext production build carrying live
market data traffic is a worse outcome than a build that refuses to start. Costs nothing in
development, where `__DEV__` is always true.

---

### ADR-M7: Offline Strategy

**Context.** The assignment requires defined behavior when the backend becomes unavailable: showing connection status, continuing to display the most recent data, and reconnecting automatically once connectivity is restored.

**Decision.** A three-tier approach:

- **Required:** stale data remains visible when the backend is unavailable; a connection-status indicator is always shown; reconnection is automatic with exponential backoff (ADR-M6).
- **Additional, low-cost value:** the last known market state is cached in MMKV (ADR-M5), so the app never shows an empty screen on a cold launch, even before the first live update arrives.
- **Explicitly out of scope:** a full offline mode with historical data or complex synchronization logic — not required by the assignment, and would add complexity without corresponding value here.

```typescript
const [connectionStatus, setConnectionStatus] = useState<
  'connecting' | 'connected' | 'disconnected' | 'reconnecting'
>('connecting');

const handleMarketUpdate = (data: MarketUpdate) => {
  useMarketStore.getState().updatePair(data.pair, data);
};

const handleDisconnect = () => {
  setConnectionStatus('disconnected');
  // The Zustand store is left untouched — stale data continues to render.
};

useEffect(() => {
  if (connectionStatus === 'disconnected') {
    const backoff = exponentialBackoff(attempt);
    setTimeout(() => {
      setConnectionStatus('reconnecting');
      connectWebSocket();
    }, backoff);
  }
}, [connectionStatus]);
```

_(The snippet above is illustrative pseudocode of the flow. The implementation is the `WebSocketSource` state machine (ADR-M6) writing into `marketStore`; verified end-to-end on the Android Emulator in v9.1 — stopping the backend showed "RECONNECTING…" with every row's last price still on screen, and restarting it returned the indicator to "LIVE" with no user action.)_

**Rationale.** This satisfies the assignment's stated requirement directly, and the MMKV-cached last-known-state addition is a small amount of extra value (no empty screen on cold launch) for very little additional complexity, since the persistence mechanism already exists for favourites (ADR-M5).

**Trade-offs accepted.** Displayed data can be stale during a disconnection — mitigated by the always-visible connection-status indicator, which is the assignment's own stated mechanism for surfacing this to the user.

---

### ADR-M8: Mobile Project Structure — Feature-First Architecture with Internal Layering

**Context.** A maintainable, testable mobile structure is needed — one that scales gracefully as the application grows beyond its initial two to three screens, and whose repository interfaces reflect how each kind of data actually behaves rather than forcing every data source through the same shape.

**Options considered:**

| Option                                                                | Pros                                                                                                                                                               | Cons                                                                                                                                                        |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Layer-first (`src/domain`, `src/data`, `src/presentation`)            | Architectural boundaries visible at a glance for a very small app                                                                                                  | Poor scalability — adding one feature requires touching three or more disparate top-level folders; higher merge-conflict risk as the codebase and team grow |
| Feature-first, flat (`src/features/Watchlist.tsx`)                    | Good navigability, changes stay localized                                                                                                                          | Tends toward "God files" mixing domain logic, data access, and UI in one place without internal structure                                                   |
| **Feature-first with internal layering, plus a shared `core/` layer** | Localized feature development*and* enforced Clean Architecture boundaries within each feature; a small, deliberate shared layer for what's genuinely cross-feature | Slightly deeper nesting — mitigated by standard IDE path tooling                                                                                            |

**Decision.** Feature-first architecture with internal layering per feature, plus a small, explicitly-scoped `core/` layer for models, ports, and components genuinely needed by more than one feature.

A shared layer inside an otherwise feature-first structure is not a contradiction of the pattern — it's the standard, deliberate exception most feature-first conventions (including Feature-Sliced Design's own "shared" layer) make for exactly this situation. The discipline is in keeping `core/` as small as it can genuinely be and defaulting new code to feature ownership, not in avoiding a shared layer altogether — a shared layer used as a dumping ground defeats the purpose just as much as not having one does.

**Structure:**

```text
pulsecrypto-mobile/
├── android/                          # Generated by expo prebuild — gitignored, not committed (ADR-M1)
├── ios/                              # Generated by expo prebuild — gitignored, not committed
├── src/
│   ├── contracts/
│   │   └── schemas.ts                # Byte-identical mirror of the backend's contracts/schemas.ts (ADR-X1);
│   │                                 # `pnpm run check:contracts` diffs it against the backend on demand
│   ├── core/                         # Deliberately small — what 2+ features need, plus app-wide infrastructure
│   │   ├── domain/
│   │   │   ├── models/               # MarketData.ts (incl. lastUpdatedAt), OrderBook.ts, TradingPair.ts
│   │   │   └── repositories/
│   │   │       └── IMarketRepository.ts   # subscription-based — see interface spec below
│   │   ├── data/
│   │   │   ├── repositories/
│   │   │   │   └── MarketRepository.ts    # Zustand store (useMarketStore) + the IMarketRepository facade
│   │   │   ├── sources/
│   │   │   │   ├── WebSocketSource.ts     # connection state machine — ADR-M6
│   │   │   │   └── RestSource.ts          # /pairs/meta fetch, parsed against the contract schema
│   │   │   └── mappers/
│   │   │       └── MarketDataMapper.ts    # wire payload -> domain model
│   │   ├── components/                    # Shared, presentation-only
│   │   │   ├── PriceText.tsx, ChangeBadge.tsx, LastUpdatedLabel.tsx   # used by watchlist and market-details
│   │   │   ├── ConnectionIndicator.tsx, UntrackedFavouriteBadge.tsx
│   │   │   └── TopAppBar.tsx, BottomNavBar.tsx, Icon.tsx, ErrorBoundary.tsx   # app-wide chrome
│   │   ├── hooks/
│   │   │   ├── useWebSocket.ts            # wires WebSocketSource to the store — ADR-M6
│   │   │   ├── useMarketData.ts           # useSyncExternalStore bridge, focus-gated — ADR-M11
│   │   │   ├── usePairsMeta.ts            # TanStack Query for /pairs/meta
│   │   │   └── useAppState.ts
│   │   ├── api/                           # config.ts (env + https/wss production guard), apiClient.ts (axios instance), errors.ts (AppError),
│   │   │                                  # retry.ts (REST retry policy), queryClient.ts — ADR-M12
│   │   ├── i18n/                          # i18n.ts + locales/en/{common,watchlist,market-details,favourites}.json — ADR-M9
│   │   ├── icons/                         # svgIcons.ts — vector paths exported from Figma
│   │   ├── assets/                        # images.ts — registry for raster assets
│   │   ├── storage/                       # mmkv.ts — MMKV instance, StateStorage adapter, throttled writes
│   │   ├── theme/                         # colors, spacing, typography, radius — from specs/design-tokens.md
│   │   └── utils/                         # formatPrice, formatPercent, formatCompactNumber, formatPairDisplayName,
│   │                                      # parseBaseAsset, intlFormatterCache — locale-aware via Intl (ADR-M9);
│   │                                      # backoff.ts — shared exponential-backoff arithmetic (ADR-M12)
│   ├── features/                          # Feature-owned by default
│   │   ├── watchlist/                     # the "Markets" screen
│   │   │   ├── presentation/              # WatchlistScreen, PairRow, SearchBar, useWatchlist
│   │   │   └── index.ts
│   │   ├── market-details/                # the "Terminal" screen and the account drawer
│   │   │   ├── presentation/              # MarketDetailScreen, OrderBookView, MarketDepthChart, TerminalSkeleton,
│   │   │   │                              # AccountDrawer, ComingSoonDialog
│   │   │   └── index.ts
│   │   ├── telemetry-settings/            # the "Telemetry & Settings" screen (ADR-M10)
│   │   │   ├── presentation/              # TelemetryScreen, PerformanceDashboardCard, DataThrottlingCard, MicroCard,
│   │   │   │                              # CircularGauge, MemorySparkline, Slider, Toggle, useJsFps
│   │   │   └── index.ts
│   │   └── favourites/                    # Genuinely feature-scoped — reached only through its barrel
│   │       ├── domain/IFavouritesRepository.ts
│   │       ├── data/FavouritesRepository.ts     # MMKV-backed, implements IFavouritesRepository
│   │       ├── presentation/useFavourites.ts
│   │       └── index.ts                          # exports useFavourites() — the ONLY cross-feature entry point
│   ├── store/
│   │   └── uiStore.ts                    # cross-feature UI state only: isDrawerOpen, selectedPair
│   ├── navigation/                       # AppNavigator.tsx (Bottom Tabs — ADR-M11), types.ts
│   └── app.tsx                           # providers (QueryClient, ErrorBoundary, i18n), font loading, drawer mount
├── index.ts                              # entry point (package.json "main")
├── tests/unit/                           # Jest — see §8
├── __mocks__/                            # react-native-mmkv mock
├── specs/, docs/adr/                     # spec-driven inputs; mirror of the project-level ADR
├── assets/, app.json, eas.json, babel.config.js, eslint.config.js, commitlint.config.cjs, .husky/
└── tsconfig.json, package.json, README.md
```

_(v9.1: the tree above replaces the original design tree with the structure that was actually built. Differences worth knowing: `telemetry-settings/` did not exist in the original tree (ADR-M10); `Slider` and `Toggle` live in it rather than in `core/`, per the two-or-more-features test; `useMarketData`, `usePairsMeta`, `RestSource` and the app-chrome components were added under `core/`; `uiStore` holds `isDrawerOpen` and `selectedPair` — the `isOnline`, `activeTab` and `activeLocale` fields the original design listed were never used and were removed.)_

**A deliberate, narrow exception to "presentation depends on the interface, not the store" (v9.1 disclosure).** Per-pair live data always reaches components through `IMarketRepository` (via `useMarketData`). Three things do not: `useWatchlist` reads the store's pair _keys_ directly, because `IMarketRepository` has no reactive "list of keys" method and the watchlist must stay populated from live/cached data when `/pairs/meta` is down; and `TelemetryScreen`, `PerformanceDashboardCard` and `MarketDetailScreen` read `connectionStatus`/`wsMessageRate`/cached pairs from `useMarketStore` directly. These import `useMarketStore` from `core/data/repositories/` — presentation reaching into `core/data`, which ADR-M8's letter discourages. It is accepted because widening the interface for three read-only, non-pair-scoped values would add ceremony without protecting anything, and it stays inside `core/` (never another feature's internals).

**Repository interfaces, shaped to match real behavior:**

```typescript
// core/domain/repositories/IMarketRepository.ts
// Market data is a continuous push stream from the backend WebSocket, not a fetchable
// resource — the interface is subscription-based to match that, rather than a promise-
// returning getter later retrofitted into an observer pattern. It lives in core/, not
// inside a single feature, specifically because both `watchlist` and `market-details`
// depend on it — placing it under either feature would force the other to reach into
// a sibling feature's internals.
export interface IMarketRepository {
  subscribe(pair: TradingPairSymbol, onUpdate: (data: MarketData) => void): Unsubscribe;
  getSnapshot(pair: TradingPairSymbol): MarketData | null; // last-known value, synchronous, for first render
  getTrackedPairs(): TradingPairSymbol[]; // whatever the backend is currently broadcasting
}
export type Unsubscribe = () => void;

// features/favourites/domain/IFavouritesRepository.ts
// Favourites are simple local key-value state with no streaming behavior, and — unlike
// market data — are genuinely needed by only one feature's own logic. A conventional
// promise/mutation-based interface is the correct fit, and it stays inside `favourites/`
// rather than moving to core/: nothing else needs to read or write it directly.
export interface IFavouritesRepository {
  getAll(): Promise<TradingPairSymbol[]>;
  toggle(pair: TradingPairSymbol): Promise<void>;
}
```

**Untracked-favourite behavior, stated explicitly and consistent with the barrel-export discipline above.** `WatchlistScreen` (in `features/watchlist/presentation`) merges two sources to decide what to render: the live tracked-pairs list obtained from `core/data`'s `MarketRepository.getTrackedPairs()`, and the user's favourited symbols obtained through `features/favourites`'s public `useFavourites()` hook — exported from that feature's `index.ts`, never by importing `features/favourites/data` directly. A favourited pair that is not currently in the tracked set still renders, via `core/components/UntrackedFavouriteBadge` (placed in `core/` rather than inside `watchlist/`, since it's a generic "this pair currently has no live data" indicator that could plausibly be reused elsewhere), showing a localized "Not currently tracked" string (ADR-M9) — it is never hidden, and its absence from the live feed never causes an error or a crash in the list.

**Rationale.**

1. **Scalability:** adding a new feature — a "Portfolio" screen, for instance — means creating one new folder under `features/`, without needing to hunt through a shared `domain/`, `data/`, or `presentation/` directory that every other feature also touches.
2. **Reduced merge-conflict surface:** multiple developers working on `watchlist` and `market-details` simultaneously touch almost entirely disjoint sets of files.
3. **Clean Architecture preserved, at the right granularity:** the domain/data/presentation dependency direction is still enforced, but locally within each feature (and within `core/`), which is easier to audit than a codebase-wide version of the same rule — a reviewer checking `favourites/` only needs to look inside `favourites/`.
4. **The shared layer is scoped by an explicit test, not by convenience:** something belongs in `core/` only if two or more features genuinely depend on it (`MarketData`, `IMarketRepository`, `PriceText`, the i18n setup) — `favourites` stays feature-owned precisely because nothing else needs to reach into it, and the barrel-export (`index.ts`) convention makes that boundary enforceable rather than aspirational.
5. **Consistent with common practice for this pattern at scale** — feature-first-with-internal-layering, using a small shared kernel, is a widely recommended structure for growing React Native codebases for the reasons above, not a bespoke invention for this project.

**Trade-offs accepted.**

- Slightly deeper folder nesting (for example, `src/features/watchlist/presentation/PairRow.tsx`) — a minor cost, well handled by standard IDE path autocomplete.
- A shared `core/` layer reintroduces, in miniature, the same "spread across folders" property that layer-first architecture has at full scale — accepted deliberately, and kept small by the explicit two-or-more-features test above, rather than left to grow unchecked.

---

### ADR-M9: Internationalization (i18n) Strategy

**Context.** User-facing text (screen titles, labels, connection status, empty states, the "Not currently tracked" badge, and every other string a user reads) needs to be localizable. This is worth deciding at the start of the project rather than after screens are built, because retrofitting localization onto a codebase where strings are hardcoded directly into JSX across many components is one of the more tedious and error-prone categories of technical debt to pay down — every component has to be individually audited and edited. Establishing the pattern now costs one library and a small amount of setup ceremony; establishing it later costs a project-wide sweep.

**Options considered:**

| Option                                                                          | Pros                                                                                                                                                                                                                                    | Cons                                                                                                                              |
| ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Hardcoded English strings, localize later if ever needed                        | Zero setup cost right now                                                                                                                                                                                                               | Every user-facing string becomes a future retrofit; historically expensive technical debt, not a neutral deferral                 |
| **i18next + react-i18next, with expo-localization for device locale detection** | Industry-standard for React/React Native, mature ecosystem, supports interpolation/pluralization/namespaced lazy loading;`expo-localization` is maintained by the Expo team itself and stays version-aligned with the SDK automatically | Extra dependency, one-time setup cost                                                                                             |
| lingui (macro-based)                                                            | More type-safe string extraction, compile-time key checking                                                                                                                                                                             | Heavier build-tooling setup (babel/SWC macros) for a project this size; steeper learning curve without a corresponding payoff yet |
| Meta's FBT                                                                      | Battle-tested internally at Meta                                                                                                                                                                                                        | Thin React Native ecosystem support and documentation relative to i18next outside Meta's own infrastructure — a poor fit here     |

**Decision.** `i18next` + `react-i18next` for translation strings and formatting logic; `expo-localization` for device-locale detection. Structure and wire the pattern fully now; ship with a complete English (`en`) translation as the only shipped locale, proving the mechanism end-to-end without committing to translating and maintaining additional languages for this exercise.

**Implementation.**

- `core/i18n/i18n.ts` initializes `i18next`, detects the device's locale via `expo-localization` at launch, and falls back to English if the device locale has no corresponding translation namespace.
- Translation files are namespaced per feature (`common.json`, `watchlist.json`, `market-details.json`, `favourites.json`), mirroring the codebase's own feature-first structure (ADR-M8) — a contributor or translator finds a screen's strings exactly where the screen's code lives conceptually, rather than in one large undifferentiated file.
- A manual language override is read from MMKV at startup (`language-override` key, `core/i18n/i18n.ts`) ahead of the device locale. **Only the read side exists (v9.1 correction):** there is no in-app language picker and nothing writes that key today, so the override is wiring for a future second language rather than a user-facing feature. It reuses the MMKV mechanism from ADR-M5 rather than adding a second persistence approach.
- **Number and date formatting is locale-aware by construction, not just the label text around it.** `core/utils/formatPrice.ts` and `formatPercent.ts` (already part of the structure per ADR-M8) use `Intl.NumberFormat` with the active locale, since thousands separators and decimal points are not universal (`1,234.56` vs. `1.234,56`); `LastUpdatedLabel`'s timestamp rendering uses `Intl.DateTimeFormat` for the same reason. Localizing only the static labels while leaving number formatting hardcoded to one convention would be an incomplete implementation of the same idea.

**Rationale.**

1. Establishing this boundary now is cheap; retrofitting it after strings are scattered through many components is expensive — the same reasoning already applied to TanStack Query's client/server-state split (ADR-M2) and the shared `core/` layer (ADR-M8), applied consistently here rather than as an isolated, one-off addition.
2. `expo-localization`'s alignment with the Expo SDK release cycle removes one class of version-compatibility risk that a less-integrated device-locale library could introduce.
3. `i18next`/`react-i18next` is the de facto standard for this problem in the React ecosystem, well past the risk of being an obscure or under-maintained choice — the opposite concern from the one raised about FlashList in ADR-M3.
4. Namespacing by feature rather than by one flat file is a small decision with a real payoff as the string count grows — it mirrors a structural choice (ADR-M8) already made for the same reason.

**Trade-offs accepted.**

- One additional dependency and a small amount of upfront setup (provider wiring, the `core/i18n/` module) for an app that, strictly by the assignment's own requirements, only needs to render in one language.
- The verification described in the original delivery plan — rendering key screens under a non-English locale in component tests, to catch hardcoded strings — has **not** been done: the mobile suite is Jest unit tests only (see §8's status note). Every screen does route its text through `t()`; that is verified by inspection, not by test.
- Shipping only English initially means the localization story right now is about correct infrastructure — the mechanism, the formatting discipline, the namespace structure — rather than about actual translated content in multiple languages, and the README should state that distinction plainly rather than imply broader language coverage than exists.

---

### ADR-M10: Mobile Design System & Screen Scope — Sourced from Figma via API

**Context.** This document's earlier versions treated the Figma mockup as the visual
source of truth for all four of the assignment's mobile screens (§"Reference Materials"),
on the assumption that its content would map cleanly onto those four screens. That
assumption was never actually verified against live Figma data until this revision — no
Figma MCP connector or Dev Mode session was available earlier, and a plain URL fetch only
ever returns Figma's client-rendered shell (confirmed twice, v8.1). It became verifiable
once the developer generated a personal access token and granted API access, at which
point pulling the file's real content (`GET /v1/files/:key`, `/nodes`, node-by-node) surfaced
a genuine mismatch worth recording as a decision, not silently absorbing.

**What the Figma file actually contains.** One page, two designed screens:

- `PulseCrypto | Trading Terminal` — a single-pair detail view: price ticker (price, 24h
  high/low, **market cap**), a Bids/Asks order book table, a "Market Depth Visualization"
  panel with a qualitative pressure/liquidity-gap legend, and a hidden-by-default account
  side-drawer (profile tier/ID, API Keys, Security, Trade History, Support, Sign Out).
- `PulseCrypto | Telemetry & Settings` — a bento-grid **developer performance dashboard**:
  a data-throttling configurator (update-frequency slider, protocol/polling toggles), a
  live telemetry card (JS-thread FPS gauge, WS message-rate counter, memory graph), and
  three stat micro-cards (GPU acceleration, API latency, storage cache).

Both screens share a bottom nav bar with **four tabs — Terminal, Markets, Telemetry,
Settings** — but only two of the four have a designed screen behind them. There is no
`Markets` screen: the assignment's actual required watchlist (five-pair list, search,
favourite toggle) isn't mocked anywhere in the file. Conversely, a large fraction of what
_is_ mocked — the account drawer, the entire telemetry/settings dashboard — sits outside
the assignment's Part 2 functional requirements entirely.

**Decision.** Presented to the developer as an explicit choice (not resolved unilaterally),
who chose: **build everything the Figma file provides at full, literal fidelity — including
the parts outside the assignment's stated scope — and design the one required screen Figma
doesn't cover (Markets/Watchlist, with Search and Favourites) fresh, in the same
Figma-verified visual language, rather than reinterpreting or trimming what Figma
specifies.** Concretely:

- `Terminal` = the assignment's "Market Details" screen, parameterized per selected pair
  (Figma shows a fixed "BTC/USDT"; the real app renders whichever pair is active). The
  assignment's required numeric fields Figma doesn't show — Buy Pressure %, Sell Pressure
  %, Spread, Last Updated Timestamp — are added onto this screen using the same
  typography/spacing system, since the assignment's requirement doesn't bend to the
  mockup's omission of it. The "Market Cap" ticker cell is **kept as designed** (corrected in
  v9.1 — an earlier draft of this ADR replaced it with "24H Volume"). It is fed by a static
  placeholder: Binance's `ticker/24hr` has no market-cap field, so the backend returns a fixed
  `MARKET_CAP_PLACEHOLDER` in `PairMeta.marketCap`, the same display-only category as the
  Telemetry values below. `volume24h` and `tradingStatus` remain in `/pairs/meta` but are not
  shown on Terminal — the assignment doesn't ask for them on any screen.
- `Markets` = the assignment's "Market Watchlist" screen (+ Search, + Favourites), designed
  fresh using the extracted color/type/spacing tokens (ADR-M10, `design-tokens.md`) since
  no Figma frame exists to build it against.
- `Telemetry & Settings` and the account drawer are built exactly as designed, **at the UI
  layer**, despite having no corresponding functional requirement or backend support:
  - Controls with no backing system (the throttling configurator's slider/toggles, API
    Keys/Security/Trade History/Sign Out in the account drawer) are implemented as local UI
    state only — visually functional, not wired to anything real. This is stated plainly in
    the README as intentional, not left for a reviewer to discover.
  - Metrics that _are_ genuinely obtainable client-side — the WS message-ingestion rate
    (trivial: `useWebSocket` already receives every message) and JS-thread FPS (obtainable
    via a frame-time sampler or Reanimated's frame callback, which is already a dependency —
    ADR-M4) — are wired to real values rather than faked, since the honest version costs
    little more than a fake one. Memory footprint, which is genuinely hard to obtain
    accurately in an Expo-managed app without a native module, is approximated or
    explicitly labeled as illustrative rather than presented as precise.

**Design tokens.** Colors, typography, spacing, and corner radii were extracted directly
from the file's REST API response (fills, text styles, and auto-layout padding/spacing
properties on real nodes), not estimated from a screenshot or a description. Full token
set: `pulsecrypto-mobile/specs/design-tokens.md`. Background base color, text colors,
buy/sell signal colors (green `#3FE092`/red `#EA295B`, confirming the standard convention
ADR-M4 assumed), the JetBrains-Mono-for-numerics / Inter-for-labels / Hanken-Grotesk-for-
headings type system, and a 4/8px-based spacing scale are all verified, traced values.

**Rationale.**

1. **This is the same principle the "Reference Materials" section already stated in
   advance** — "where the mockup and this document could plausibly conflict... flag the gap
   and resolve it explicitly rather than silently picking one source over the other." This
   ADR is that principle actually exercised against a real, found conflict, not a
   hypothetical one.
2. **Building the out-of-scope Figma content is a deliberate scope expansion, made at the
   developer's explicit direction, not a default this document would have chosen
   unprompted.** Left to this document's own judgment, the more conservative call — skip
   the account drawer and telemetry dashboard as decorative scope creep with no functional
   backing, matching this document's stated discipline of not adding complexity that isn't
   earning its place (Executive Summary, §1) — was the recommendation actually made. The
   developer's reasoning for overriding that recommendation is presentation fidelity: the
   assignment is evaluated in part on the finished application, and a submission that
   visibly matches its own referenced mockup, in full, is worth more than a strictly
   scope-minimal one for that specific evaluation criterion. Both are legitimate
   engineering judgments about what a reviewer will actually weigh; this document records
   which one was chosen and why, rather than picking one silently.
3. **Real-vs-mock data treatment per control is decided by whether a real, cheap source
   exists, not by whether a control looks impressive.** This is the same standard applied
   throughout this document (e.g. ADR-B6's metadata fallback, ADR-M5's synchronous-read
   choice) — honesty about what's real costs nothing extra here and is worth stating
   explicitly per control rather than leaving a reviewer to guess which numbers on the
   Telemetry screen are live.

**Trade-offs accepted.** The mobile app now has five screens instead of the assignment's
four, two of which (Telemetry & Settings, the account drawer) exist purely for design
fidelity and contain no functional requirement or backend support — real implementation
effort spent on scope the assignment doesn't ask for and doesn't test, accepted
deliberately for the presentation-fidelity reason above. The Markets/Watchlist screen,
being freshly designed rather than mockup-sourced, carries a small risk of looking visually
inconsistent with the Figma-sourced screens if the token system isn't followed carefully —
mitigated by `design-tokens.md` being the single source every screen (mocked or not) draws
from.

**Placeholder interactions use a themed in-app dialog, not the native `Alert` (v9.0).** The
account drawer's no-backend links (API Keys, Security, Trade History, Support) originally
surfaced their "not implemented" message via React Native's built-in `Alert.alert()`. On
real-device review this was flagged as visibly wrong: `Alert.alert()` renders a genuine
native OS dialog, always in the platform's own light theme, which broke the dark, custom-
themed presentation the rest of this document has verified against Figma. Replaced with
`ComingSoonDialog` (`src/features/market-details/presentation/`), a plain
reanimated-driven overlay matching the app's own theme, using the same render-phase mount
pattern adopted for the account drawer itself (see ADR-M11) so it opens with no perceptible
delay. Scoped to `market-details/presentation/`, not `core/`, per ADR-M8's two-or-more-
features test — only the account drawer uses it today. Generalizes as a rule: any future
placeholder/confirmation interaction in this app should reach for a themed in-app dialog
like this one, not `Alert.alert`, to stay visually consistent with the verified design
system rather than falling back to whatever the OS provides by default.

---

### ADR-M11: Tab Navigation Architecture — Bottom Tabs, Paired With Focus-Gated Live Data (v9.0)

**Context.** The four bottom-nav destinations (Terminal, Markets, Telemetry, Settings) were
originally built on `createNativeStackNavigator` (§5's tech-stack table listed "React
Navigation (Native Stack)" as a plain version pin, not a reasoned decision — this ADR is
that decision made explicit, after the fact, once real-device testing showed it was wrong).
`BottomNavBar`'s own tab-press handler called `navigation.navigate(route)`
per tab, with `screenOptions: { animation: 'none' }` intended to make switching feel
instant.

**Problem found (real-device testing, not a design-time concern).** The developer reported
switching tabs felt "laggy," with "flickering" and dropped frames — on a physical device,
not the simulator. Root cause: a Stack navigator's `navigate()` to a route not currently on
top of the stack pushes a **new screen instance**, which fully remounts that screen — every
hook re-runs, the WS-backed `marketStore` subscription re-establishes, layout recomputes
from scratch — regardless of `animation: 'none'`, which only suppresses the slide
_transition_, not the remount cost underneath it. Every single tab switch paid this cost,
every time, in both directions.

**Options considered:**

| Option                                                        | Pros                                                                                                                                          | Cons                                                                                                                           |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Native Stack + `animation: 'none'` (original)                 | Matches the original scaffold choice; no new dependency                                                                                       | Still remounts every switch — the actual lag was never in the transition animation, so suppressing it fixed nothing            |
| **`@react-navigation/bottom-tabs`**                           | Keeps a visited screen mounted after first visit — a later switch is a pure visibility toggle, no remount, no re-subscribe, no dropped frames | Requires every screen with a live subscription to become focus-aware, or an invisible screen keeps doing real work (see below) |
| Hand-rolled tab state (conditional rendering, no nav library) | Full control                                                                                                                                  | Reinvents back-button handling, deep-linking, and navigation state restoration that React Navigation already provides for free |

**Decision.** `@react-navigation/bottom-tabs` (`createBottomTabNavigator`). The existing
`BottomNavBar` component is hoisted to the Navigator's own `tabBar` render prop
(`<Tab.Navigator tabBar={() => <BottomNavBar />}>`) so it renders once at the Navigator
level instead of being duplicated inside every screen — `BottomNavBar` itself needed no
internal changes, since it already read navigation state via the generic
`useNavigation()`/`useNavigationState()` hooks rather than the tab-bar render-prop's own
`state`/`descriptors` arguments.

**A second problem, found immediately after fixing the first — not a separate incident, the
other half of the same decision.** Bottom Tabs' mount-and-keep behavior is exactly what
fixes the remount lag, but it has a direct consequence the initial fix didn't account for:
**every visited screen stays mounted and subscribed even while a different tab is
focused.** Terminal's `useMarketData` subscription (and Watchlist's per-row equivalent in
`PairRow`) kept firing on every ~100ms WS broadcast tick and re-rendering their full
component trees — Terminal's re-render alone includes `OrderBookView`'s 20 rows and a real
`BlurView` native blur redraw — regardless of whether that screen was the one actually on
screen. This was confirmed, not assumed: reproduced live by watching the Telemetry screen's
own JS-thread FPS gauge (ADR-M10) crater to 15–19 FPS while Terminal sat invisible in the
background, mounted, still fully re-rendering. Left unaddressed, this trade Native Stack's
remount cost for a worse, continuous cost — paid on every tab, all the time, rather than
once per switch.

**Mitigation, same decision, not a follow-up ADR.** `useMarketData`
(`src/core/hooks/useMarketData.ts`) — the shared `useSyncExternalStore`-based hook both
`MarketDetailScreen` and `WatchlistScreen`'s `PairRow` use to subscribe to a given pair's
live data — takes an `enabled` option (default `true`). When `false`, the `subscribe`
callback passed to `useSyncExternalStore` is a no-op: it never registers with the store, so
the store's change notifications never reach it and no re-render is ever triggered, while
`getSnapshot` keeps reading live state directly (not a cached/frozen value), so the screen
reflects fully current data the instant it's re-enabled — no separate resync logic needed.
Both `MarketDetailScreen` and `PairRow` gate this on React Navigation's own
`useIsFocused()`, so a screen's live subscription is only ever active while a user can
actually see it.

**Rationale.**

1. **Fixes the reported, reproduced defect** (Stack-navigator remount lag) without
   discarding React Navigation's built-in back-button/deep-linking/state-restoration
   handling for a hand-rolled alternative.
2. **The two halves are one decision, not two.** Adopting Bottom Tabs alone would have
   traded a per-switch remount cost for a worse, continuous background-rendering cost —
   arguably harder to notice in casual testing (it doesn't visibly stutter the _active_
   screen, it silently taxes the _whole app's_ frame budget from off-screen). Recording
   only the navigator swap without the focus-gating fix would misstate what actually made
   the app fast, and would leave the same regression waiting to be reintroduced by any
   future screen that subscribes to WS-driven data without copying this pattern.
3. **`useSyncExternalStore`'s subscribe/getSnapshot split made the fix cheap and
   non-invasive** — the `enabled` flag only changes which `subscribe` function is used, not
   the read path, so there's no separate "resume" logic to keep in sync with the "pause"
   logic.

**Trade-offs accepted.** All four screens' component trees stay resident in memory once
visited, rather than being torn down on tab switch — acceptable at this app's scale (four
to five screens, no large per-screen state) and clearly the smaller cost next to the
remount lag it replaces. **Standing obligation, stated explicitly so it isn't rediscovered
the hard way again:** any future screen added to this navigator that subscribes to
WS-driven or otherwise continuously-updating data must gate that subscription on
`useIsFocused()` the same way, or it will silently reintroduce this exact class of bug.

---

### ADR-M12: HTTP Client, Common Error Model and Retry Policy — axios (v9.2)

**Context.** Through v9.1 the app's only REST call (`GET /pairs/meta`) went through a hand-written `fetch` wrapper that threw a plain `Error`. A review of the mobile error handling against the assignment's "appropriate error handling" and "robust connection handling" requirements found five gaps:

1. **No timeout.** `fetch` has none, so a stalled connection left the request pending indefinitely and the retry logic never got a failure to act on.
2. **Untyped errors.** Callers could not tell a dropped connection from a 404 from a payload that failed the contract schema.
3. **Indiscriminate retry.** TanStack Query's default (three retries) retried _everything_ — including a 404 or a schema-validation failure, which fail identically every time.
4. **Two private backoff implementations.** The WebSocket client had its own backoff arithmetic; REST had TanStack's default curve.
5. **Invisible failures.** A failed `/pairs/meta` refresh showed nothing to the user except, on Terminal's cold-start waiting state, a bare Retry button.

**Options considered:**

| Option                                   | Pros                                                                                                                                          | Cons                                                                                                        |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Keep `fetch`, extend the wrapper by hand | No new dependency                                                                                                                             | Timeout via `AbortController`, error normalization and interceptors all reimplemented and re-tested by hand |
| **axios**                                | Built-in timeout, interceptors, `AbortSignal` cancellation, a reliable `isAxiosError` / error `code` taxonomy; ubiquitous and well understood | One more dependency; about +0.2 MB in the Android bundle (4.7 → 4.9 MB, measured)                           |
| ky (fetch-based)                         | Small, retry built in                                                                                                                         | Less proven on React Native; its own retry would sit on top of TanStack Query's and multiply attempts       |
| TanStack Query options only              | Nothing to add                                                                                                                                | Solves neither the missing timeout nor error normalization                                                  |

**Decision.** axios as the only HTTP mechanism in the mobile app, configured once in `core/api/apiClient.ts` and used through the data layer, with one error model and one retry policy. _(v9.3: the first cut wrapped axios in a hand-written `HttpClient` interface with `createHttpClient` / `httpGet`. That was a second layer and a second vocabulary for one thing — the file was called `httpClient` while the library was axios — so it was removed. The module is now named for its role, not the library, and exports the configured axios instance itself.)_

- **API client** (`core/api/apiClient.ts`): `createApiClient({ baseURL, timeoutMs = 10 000, adapter? })` returns a configured `AxiosInstance`, and `apiClient` is the app's single instance. A response interceptor converts _every_ failure into an `AppError` before it leaves the client, so callers never inspect axios errors. The `adapter` option exists so tests can run the real client without a network.
- **Layer rule, enforced by ESLint** (`no-restricted-imports` in `eslint.config.js`): `axios` may be imported only under `src/core/api/`, and `apiClient` only by the data layer (`src/core/data/`). Features, presentation, hooks, the store and navigation cannot reach HTTP directly — they go through a data source (`RestSource`) exactly as they go through `MarketRepository` for the WebSocket. Verified by adding throwaway files that import `axios` from a feature and from `core/data`, and `apiClient` from a feature: all three were reported as errors, while `core/data` importing `apiClient` was not.
- **Common error interface** (`core/api/errors.ts`): `AppErrorInfo { kind, message, status?, retryable, i18nKey }`, implemented by `AppError extends Error` (original error kept as `cause`). `toAppError(unknown)` is the only place that inspects axios or Zod errors:

  | Cause                                             | `kind`       | `retryable` | User message key                      |
  | ------------------------------------------------- | ------------ | ----------- | ------------------------------------- |
  | No response (connection refused, DNS, offline)    | `network`    | yes         | `errors.network`                      |
  | `ECONNABORTED` / `ETIMEDOUT`                      | `timeout`    | yes         | `errors.timeout`                      |
  | HTTP 408, 425, 429, 500, 502, 503, 504            | `http`       | yes         | `errors.server` (5xx) / `errors.http` |
  | Any other HTTP status (400, 401, 403, 404, 422 …) | `http`       | no          | `errors.http`                         |
  | Response failed the contract schema (`ZodError`)  | `validation` | no          | `errors.validation`                   |
  | Aborted request                                   | `cancelled`  | no          | `errors.cancelled`                    |
  | Anything else                                     | `unknown`    | no          | `errors.unknown`                      |

- **Retry policy** (`core/api/retry.ts`, wired into `core/api/queryClient.ts`): retry only when `AppError.retryable`, at most `MAX_RETRIES = 3` times (so 1 + 3 attempts), with exponential backoff 500 ms → 1 s → 2 s (cap 8 s), ±20% jitter. The arithmetic is the shared `computeBackoffMs` (`core/utils/backoff.ts`), which `WebSocketSource` now also uses with its own 1 s → 30 s parameters — one implementation, two parameter sets, no behavior change on the WebSocket side. Retry lives in exactly **one** layer (the query), deliberately not also in axios: stacking an axios retry under TanStack's would multiply attempts (`3 × 3`) and make timing unpredictable.
- **Validation and cancellation:** `RestSource` parses the body with `safeParse` and throws a `validation` `AppError`; `usePairsMeta` passes TanStack's `AbortSignal` through to axios so an unmounted or superseded query cancels its request.
- **User-facing surface:** the `common:errors.*` strings (localized per ADR-M9) appear in red once retries are exhausted — under the search field on Markets, and in Terminal's waiting state. While retries are in flight with no earlier data, TanStack Query keeps `error` empty, so nothing flashes.

The WebSocket path is unchanged in kind — its "error handling" is the reconnect state machine and the Zod drop-and-log of malformed messages (ADR-M6); only the backoff arithmetic is shared.

**Verification (v9.2).**

- Four new Jest suites (33 tests): `backoff`; `errors` (every row of the table above); `apiClient` driven through an injected adapter (URL/method/timeout, 503, network, timeout); and `retry`, including through a real `QueryClient` — a transient failure recovers after two retries, a persistent one stops after exactly four attempts, a 404 is attempted once. The suite was mutation-checked: making every error retryable and 404 retryable made three tests fail.
- On the Android Emulator against a fake backend that logged every request: `503, 503, 503, 200` → four requests and the data appears; persistent `503` → four requests, then it stops; persistent `404` → one request and the message "The request couldn't be completed." under the search field. On a warm app a pull-to-refresh produced retry gaps of 0.79 s, 1.22 s and 2.22 s — the 0.5/1/2 s backoff plus about 0.25 s of emulator request overhead. On a cold start the first gap was ≈1.2–1.6 s because the JS thread is busy starting up; the later gaps matched.
- `expo export --platform android` bundles cleanly; `pnpm audit --prod` is unchanged by adding axios (the one moderate `uuid` advisory is the pre-existing Expo build-time transitive).

**Trade-offs accepted.**

- One more dependency (axios `^1.20.0`, lockfile-pinned) and about 0.2 MB of bundle for behavior the platform `fetch` doesn't provide.
- The policy is the default for _every_ query, which is correct while `/pairs/meta` is the only one; a future query that must not retry sets `retry: false` explicitly.
- A screen mounting after a failure triggers a fresh attempt series (TanStack's `retryOnMount`) — accepted as sensible: opening a screen is a reasonable moment to try again.
- The backend uses Node's built-in `fetch` for its own Binance calls (ADR-B3, ADR-B6). That is a separate runtime and codebase with its own ports (ADR-B7), not a second HTTP mechanism inside the mobile app; mobile uses axios for REST and the platform WebSocket for streaming, and nothing else.
- The backend was not changed: Fastify already returns JSON errors, and a shared REST error envelope on the server side was not added. If more REST endpoints appear, defining one would make `AppError.i18nKey` mapping more precise than "status class".

---
