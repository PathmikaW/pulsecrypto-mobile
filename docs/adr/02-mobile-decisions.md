## 3. Mobile Architecture Decisions

### ADR-M1: React Native Framework — Expo (Dev Client / Prebuild)

**Context.** A choice is needed between Expo and bare React Native CLI.

**Options considered:**

| Option                                 | Pros                                            | Cons                                                                                                                                             |
| -------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Expo (Managed / Expo Go)               | Fastest possible setup                          | No custom native modules — ruled out immediately, since Reanimated, MMKV, and the live WebSocket client all require native code                 |
| **Expo (Dev Client / Prebuild)** | Full native access, strong developer experience | Tied to Expo's release cadence (mitigated — frequent releases, no forced cloud dependency)                                                      |
| Bare React Native CLI                  | Full native control                             | Equivalent native capability to Dev Client today, at the cost of hand-maintaining native project files across every React Native version upgrade |

**Decision.** Expo, using Dev Client and Continuous Native Generation (`npx expo prebuild`) — not Expo Go, and not bare CLI. See §5 for the specific SDK version and a note on an SDK 56 regression that directly affects this project's animation library.

**Rationale.**

1. **Native Access When Needed:**

   - `npx expo prebuild` generates real `android/` and `ios/` directories — standard Gradle and Xcode projects, not a sandbox.
   - These can be opened in Xcode or Android Studio and edited directly, exactly as a bare CLI project's native folders would be.
   - The Expo Modules API provides a clean interface for writing custom native modules when required.
   - This matches the role's description of production-grade mobile work occasionally requiring direct native-project work when required — the native projects exist and are fully editable; they're simply not hand-carried across every framework upgrade by default.
2. **Capability for a Platform With Future Native Needs:**

   - Config plugins exist for common categories of native SDK a wagering platform would plausibly integrate over time — geolocation/geofencing compliance, KYC, biometrics — and where a config plugin doesn't yet exist for a specific SDK, the underlying native code still installs the same way it would in a bare project, since a Dev Client build *is* a real native project.
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
| Market data (price, order book) | WebSocket     | **Zustand**            | High-frequency updates (100ms cadence), selector-based re-renders, direct mutation |
| Metadata (pair info, 24h stats) | REST          | **TanStack Query**     | Built-in caching, background refetch, loading/error states, request deduplication  |
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

| Option              | Pros                                                          | Cons                                                                   |
| ------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------- |
| FlatList            | Built-in, familiar                                            | Recreates cells on frequent updates — a real cost at this update rate |
| **FlashList** | Recycles list cells instead of destroying and recreating them | Extra dependency; maintenance-continuity note below                    |
| SectionList         | Grouped sections                                              | Unnecessary structure for a flat watchlist                             |

**Decision.** FlashList (v2 line, built for React Native's New Architecture — see §5 for the specific version), which the project is already on via Expo.

**Rationale.**

1. Cell recycling is the property that matters under sustained update bursts, and it scales the same whether the list has five rows or eight.
2. Combined with `React.memo` on row components and Zustand's selector pattern (ADR-M2), only the row whose underlying data actually changed re-renders — the recycling and the selector-scoping work together, not independently.
3. Rather than cite an unverified performance multiplier, the actual measured difference will be profiled during the performance-hardening phase (Phase 5) and reported in the README with real numbers from this specific app, not a generic claim.

**Maintenance continuity, noted transparently.** FlashList was built and has primarily been maintained by Shopify. As part of its 2026 move away from React Native (see ADR-M1), Shopify has announced it is winding down its sponsorship of related open-source projects, including FlashList, by the end of the year. This does not change the technical recommendation — FlashList remains the strongest available option for this use case, and the library continues to function — but it is a maintenance-continuity risk worth monitoring, and it's stated here, consistently with ADR-M1, rather than left unmentioned in one place and disclosed in another.

**Trade-offs accepted.** An additional dependency with a slightly different API surface than FlatList, and the governance consideration noted above.

---

### ADR-M4: Animations — react-native-reanimated

**Context.** Price changes need to briefly flash green/red, and order book volume changes need to animate smoothly, without degrading under a 100ms update cadence.

**Options considered:**

| Option                            | Pros                                                                  | Cons                                             |
| --------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------ |
| Animated API (built-in)           | No extra dependency                                                   | Runs on the JS thread — can stutter under load  |
| **react-native-reanimated** | Runs on the UI thread, 60fps achievable independent of JS thread load | Extra native dependency                          |
| Lottie                            | Suited to complex, designed animations                                | Overkill for a color flash or a bar-width change |

**Decision.** `react-native-reanimated` (current major — see §5, including a specific version-pinning note relevant to this exact library).

**Rationale.**

1. Reanimated runs animations on the UI thread via worklets, so price-flash and order-book bar-width transitions are never blocked by JS-thread work processing the next incoming tick.
2. This is the single highest-leverage decision for the requirement that the interface remain smooth and responsive during sustained update bursts — an animation approach tied to the JS thread would be the first thing to visibly degrade under load, precisely when the assignment is testing for that degradation.
3. It's the de facto standard for this category of app (trading, real-time dashboards) for the same reason.

**Trade-offs accepted.** An additional native dependency, handled transparently by the Expo Dev Client setup (ADR-M1); a somewhat more involved animation API than the built-in `Animated`, in exchange for guaranteed UI-thread execution. See §5 for a known Expo SDK 56 regression affecting this exact library, and why that makes the specific SDK version choice non-cosmetic.

---

### ADR-M5: Local Persistence — MMKV

**Context.** Favourites, the last known market state, and (per ADR-M9) a manually-chosen language override all need to persist across app restarts.

**Options considered:**

| Option         | Pros                            | Cons                                                       |
| -------------- | ------------------------------- | ---------------------------------------------------------- |
| AsyncStorage   | Simple, built-in                | Asynchronous only, slower, string-based                    |
| **MMKV** | Synchronous, ~30x faster, typed | Native module (already available via the Dev Client setup) |
| SQLite         | Relational, powerful            | Overkill for simple key-value data                         |

**Decision.** MMKV, integrated via Zustand's `persist` middleware.

**Rationale.**

1. **Synchronous reads matter specifically on app launch:** a synchronous read means favourites — and, per ADR-M9, the user's language preference — render correctly on the very first frame, with no flash of an incorrect state while an asynchronous read resolves.
2. **No additional native-integration cost:** MMKV requires the native module already present via the Dev Client setup (ADR-M1), so adopting it doesn't introduce a new category of setup work.
3. **Performance headroom:** the roughly 30x read/write speed advantage over AsyncStorage is not strictly necessary for a small favourites array, but it is the correct default for any state that will be read synchronously on every app launch, and it costs nothing extra to choose it here.

```typescript
// favouritesStore.ts
export const useFavouritesStore = create<FavouritesState>()(
  persist(
    (set) => ({
      favourites: [],
      toggleFavourite: (pair) => set(...),
    }),
    { name: 'favourites-storage', storage: createJSONStorage(() => mmkvStorage) }
  )
);

// marketStore.ts — caches last known state so the app never shows an empty screen on launch
export const useMarketStore = create<MarketState>()(
  persist(
    (set) => ({
      pairs: { ... },
      updatePair: (pair, data) => set(...),
    }),
    {
      name: 'market-data-storage',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({ pairs: state.pairs }),
    }
  )
);
```

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
| **Custom hook**              | Full control, tailored to React Native's runtime behavior | More code to write and maintain                                                                    |

**Decision.** A custom `useWebSocket` hook.

**Options considered — connection liveness detection specifically:**

| Option                                 | Description                                                                                                          | Verdict                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dedicated ping/pong heartbeat protocol | Client and server exchange keepalive messages on a timer, independent of data traffic                                | **Rejected.** This backend broadcasts on a fixed cadence (`BROADCAST_INTERVAL_MS`, 100ms) whenever it's healthy, which is already a liveness signal — a connection that's actually alive is, by definition, delivering broadcasts. A separate heartbeat protocol would answer a question the data stream already answers, at the cost of an extra message type and server-side handling for it. |
| **Broadcast-silence timeout**    | Track time since the last message of any kind was received; treat the connection as dead if that exceeds a threshold | **Selected** — no new protocol surface, no server-side changes, and the threshold is defined as a multiple of the backend's own known broadcast interval rather than an arbitrary separate number                                                                                                                                                                                                 |

**Features.**

- Exponential backoff with jitter (1s → 2s → 4s → 8s, capped at 30s) for reconnection attempts.
- Liveness via broadcast silence, not a separate heartbeat: `STALE_CONNECTION_TIMEOUT_MS` (default ~1000ms, deliberately documented as roughly `MAX_CONSECUTIVE_SKIPS × BROADCAST_INTERVAL_MS` — the same multiple of the broadcast interval the backend itself uses in ADR-B4 to decide a client has fallen behind) — if no message arrives within that window, the connection is treated as dead and reconnection begins.
- App-state awareness — the connection is paused when the app is backgrounded and re-established on foreground, rather than reconnecting uselessly while the app isn't visible.
- An explicit connection-status enum: `CONNECTING | CONNECTED | DISCONNECTED | RECONNECTING`.

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

**Rationale.** This satisfies the assignment's stated requirement directly, and the MMKV-cached last-known-state addition is a small amount of extra value (no empty screen on cold launch) for very little additional complexity, since the persistence mechanism already exists for favourites (ADR-M5).

**Trade-offs accepted.** Displayed data can be stale during a disconnection — mitigated by the always-visible connection-status indicator, which is the assignment's own stated mechanism for surfacing this to the user.

---

### ADR-M8: Mobile Project Structure — Feature-First Architecture with Internal Layering

**Context.** A maintainable, testable mobile structure is needed — one that scales gracefully as the application grows beyond its initial two to three screens, and whose repository interfaces reflect how each kind of data actually behaves rather than forcing every data source through the same shape.

**Options considered:**

| Option                                                                        | Pros                                                                                                                                                                 | Cons                                                                                                                                                         |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Layer-first (`src/domain`, `src/data`, `src/presentation`)              | Architectural boundaries visible at a glance for a very small app                                                                                                    | Poor scalability — adding one feature requires touching three or more disparate top-level folders; higher merge-conflict risk as the codebase and team grow |
| Feature-first, flat (`src/features/Watchlist.tsx`)                          | Good navigability, changes stay localized                                                                                                                            | Tends toward "God files" mixing domain logic, data access, and UI in one place without internal structure                                                    |
| **Feature-first with internal layering, plus a shared `core/` layer** | Localized feature development*and* enforced Clean Architecture boundaries within each feature; a small, deliberate shared layer for what's genuinely cross-feature | Slightly deeper nesting — mitigated by standard IDE path tooling                                                                                            |

**Decision.** Feature-first architecture with internal layering per feature, plus a small, explicitly-scoped `core/` layer for models, ports, and components genuinely needed by more than one feature.

A shared layer inside an otherwise feature-first structure is not a contradiction of the pattern — it's the standard, deliberate exception most feature-first conventions (including Feature-Sliced Design's own "shared" layer) make for exactly this situation. The discipline is in keeping `core/` as small as it can genuinely be and defaulting new code to feature ownership, not in avoiding a shared layer altogether — a shared layer used as a dumping ground defeats the purpose just as much as not having one does.

**Structure:**

```text
pulsecrypto-mobile/
├── android/                       # Generated by expo prebuild — not committed (ADR-M1)
├── ios/                           # Generated by expo prebuild — not committed
├── src/
│   ├── contracts/                 # Mirrored copy of the backend repo's contracts/ — see ADR-X1.
│   │   └── schemas.ts               # CI diff-checks this against the backend's raw GitHub URL on every build.
│   ├── core/                      # Deliberately small — only what 2+ features genuinely need
│   │   ├── domain/
│   │   │   ├── models/
│   │   │   │   ├── MarketData.ts          # includes lastUpdatedAt — ADR-B4, ADR-M2, §12
│   │   │   │   ├── OrderBook.ts
│   │   │   │   └── TradingPair.ts
│   │   │   └── repositories/
│   │   │       └── IMarketRepository.ts   # subscription-based — see interface spec below.
│   │   │                                   # Lives in core/, not in one feature, because both
│   │   │                                   # `watchlist` and `market-details` depend on it.
│   │   ├── data/
│   │   │   ├── repositories/
│   │   │   │   └── MarketRepository.ts     # implements IMarketRepository — the shared, WS-backed
│   │   │   │                                # live data source
│   │   │   ├── sources/
│   │   │   │   ├── WebSocketSource.ts
│   │   │   │   └── RestSource.ts
│   │   │   └── mappers/
│   │   │       └── MarketDataMapper.ts     # DTO → domain model
│   │   ├── components/                     # Shared, presentation-only components — no feature-specific logic
│   │   │   ├── PriceText.tsx                # animated price, used on both watchlist rows and detail screen
│   │   │   ├── ChangeBadge.tsx               # 24h change pill, same reuse
│   │   │   ├── ConnectionIndicator.tsx
│   │   │   ├── LastUpdatedLabel.tsx          # renders MarketData.lastUpdatedAt — required field, §12
│   │   │   └── UntrackedFavouriteBadge.tsx   # see behavior spec below
│   │   ├── i18n/                             # Localization — see ADR-M9
│   │   │   ├── i18n.ts                        # i18next init, device-locale detection, MMKV override lookup
│   │   │   └── locales/
│   │   │       └── en/
│   │   │           ├── common.json             # shared strings: connection states, generic labels
│   │   │           ├── watchlist.json
│   │   │           ├── market-details.json
│   │   │           └── favourites.json
│   │   ├── theme/                            # Design tokens, colors, typography
│   │   ├── utils/                            # formatPrice, formatPercent — locale-aware via Intl (ADR-M9)
│   │   ├── api/                               # Base HTTP client, WebSocket client construction
│   │   ├── hooks/                             # Generic, non-feature-specific hooks
│   │   │   ├── useWebSocket.ts                 # the raw connection hook — see ADR-M6
│   │   │   └── useAppState.ts
│   │   └── storage/                            # MMKV configuration and storage adapter
│   ├── features/                               # Domain-driven feature modules — feature-owned by default
│   │   ├── watchlist/
│   │   │   ├── presentation/
│   │   │   │   ├── WatchlistScreen.tsx          # composes core/data's MarketRepository +
│   │   │   │   │                                 # favourites/'s public useFavourites() — see behavior spec
│   │   │   │   ├── PairRow.tsx                   # composes core/components (PriceText, ChangeBadge, etc.)
│   │   │   │   ├── SearchBar.tsx
│   │   │   │   └── useWatchlist.ts
│   │   │   └── index.ts                          # barrel export — this feature's public surface (currently none
│   │   │                                          # needed by other features; kept for consistency)
│   │   ├── market-details/
│   │   │   ├── presentation/
│   │   │   │   ├── MarketDetailScreen.tsx
│   │   │   │   └── OrderBookView.tsx
│   │   │   └── index.ts
│   │   └── favourites/                            # Genuinely feature-scoped — no other feature reads or
│   │       │                                        # writes favourites data directly
│   │       ├── domain/
│   │       │   └── IFavouritesRepository.ts         # see interface spec below
│   │       ├── data/
│   │       │   └── FavouritesRepository.ts           # MMKV-backed, implements IFavouritesRepository
│   │       ├── presentation/
│   │       │   └── useFavourites.ts                   # toggle logic, exposed via the barrel below
│   │       └── index.ts                                # exports useFavourites() — the ONLY way another
│   │                                                    # feature is permitted to touch favourites state
│   ├── store/
│   │   └── uiStore.ts                                  # cross-feature global UI state only: isOnline,
│   │                                                     # activeTab, activeLocale — deliberately minimal,
│   │                                                     # same discipline as core/
│   ├── navigation/
│   │   ├── AppNavigator.tsx
│   │   └── types.ts
│   └── app.tsx                                           # Entry point, providers (QueryClientProvider,
│                                                            # I18nextProvider, etc.)
├── assets/
├── app.json
├── tsconfig.json
├── package.json
└── README.md
```

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

| Option                                                                                | Pros                                                                                                                                                                                                                                      | Cons                                                                                                                              |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Hardcoded English strings, localize later if ever needed                              | Zero setup cost right now                                                                                                                                                                                                                 | Every user-facing string becomes a future retrofit; historically expensive technical debt, not a neutral deferral                 |
| **i18next + react-i18next, with expo-localization for device locale detection** | Industry-standard for React/React Native, mature ecosystem, supports interpolation/pluralization/namespaced lazy loading;`expo-localization` is maintained by the Expo team itself and stays version-aligned with the SDK automatically | Extra dependency, one-time setup cost                                                                                             |
| lingui (macro-based)                                                                  | More type-safe string extraction, compile-time key checking                                                                                                                                                                               | Heavier build-tooling setup (babel/SWC macros) for a project this size; steeper learning curve without a corresponding payoff yet |
| Meta's FBT                                                                            | Battle-tested internally at Meta                                                                                                                                                                                                          | Thin React Native ecosystem support and documentation relative to i18next outside Meta's own infrastructure — a poor fit here    |

**Decision.** `i18next` + `react-i18next` for translation strings and formatting logic; `expo-localization` for device-locale detection. Structure and wire the pattern fully now; ship with a complete English (`en`) translation as the only shipped locale, proving the mechanism end-to-end without committing to translating and maintaining additional languages for this exercise.

**Implementation.**

- `core/i18n/i18n.ts` initializes `i18next`, detects the device's locale via `expo-localization` at launch, and falls back to English if the device locale has no corresponding translation namespace.
- Translation files are namespaced per feature (`common.json`, `watchlist.json`, `market-details.json`, `favourites.json`), mirroring the codebase's own feature-first structure (ADR-M8) — a contributor or translator finds a screen's strings exactly where the screen's code lives conceptually, rather than in one large undifferentiated file.
- A manual language override, when the user explicitly picks a language rather than relying on device locale, is persisted in MMKV via the same mechanism already used for favourites (ADR-M5) — reusing an existing, proven pattern rather than introducing a second persistence approach for a single settings value.
- **Number and date formatting is locale-aware by construction, not just the label text around it.** `core/utils/formatPrice.ts` and `formatPercent.ts` (already part of the structure per ADR-M8) use `Intl.NumberFormat` with the active locale, since thousands separators and decimal points are not universal (`1,234.56` vs. `1.234,56`); `LastUpdatedLabel`'s timestamp rendering uses `Intl.DateTimeFormat` for the same reason. Localizing only the static labels while leaving number formatting hardcoded to one convention would be an incomplete implementation of the same idea.

**Rationale.**

1. Establishing this boundary now is cheap; retrofitting it after strings are scattered through many components is expensive — the same reasoning already applied to TanStack Query's client/server-state split (ADR-M2) and the shared `core/` layer (ADR-M8), applied consistently here rather than as an isolated, one-off addition.
2. `expo-localization`'s alignment with the Expo SDK release cycle removes one class of version-compatibility risk that a less-integrated device-locale library could introduce.
3. `i18next`/`react-i18next` is the de facto standard for this problem in the React ecosystem, well past the risk of being an obscure or under-maintained choice — the opposite concern from the one raised about FlashList in ADR-M3.
4. Namespacing by feature rather than by one flat file is a small decision with a real payoff as the string count grows — it mirrors a structural choice (ADR-M8) already made for the same reason.

**Trade-offs accepted.**

- One additional dependency and a small amount of upfront setup (provider wiring, the `core/i18n/` module) for an app that, strictly by the assignment's own requirements, only needs to render in one language.
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
*is* mocked — the account drawer, the entire telemetry/settings dashboard — sits outside
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
  mockup's omission of it. The "Market Cap" ticker cell is replaced with "24H Volume" (the
  field the backend's `/pairs/meta` actually provides — ADR-B6); the assignment doesn't
  ask for market cap, and no data source in this system provides it.
- `Markets` = the assignment's "Market Watchlist" screen (+ Search, + Favourites), designed
  fresh using the extracted color/type/spacing tokens (ADR-M10, `design-tokens.md`) since
  no Figma frame exists to build it against.
- `Telemetry & Settings` and the account drawer are built exactly as designed, **at the UI
  layer**, despite having no corresponding functional requirement or backend support:
  - Controls with no backing system (the throttling configurator's slider/toggles, API
    Keys/Security/Trade History/Sign Out in the account drawer) are implemented as local UI
    state only — visually functional, not wired to anything real. This is stated plainly in
    the README as intentional, not left for a reviewer to discover.
  - Metrics that *are* genuinely obtainable client-side — the WS message-ingestion rate
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

---

