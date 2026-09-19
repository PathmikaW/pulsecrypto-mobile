# PulseCrypto — Mobile

A React Native (Expo Dev Client) app that consumes the [`pulsecrypto-backend`](../pulsecrypto-backend)
WebSocket broadcast and REST metadata endpoint, and visualizes live cryptocurrency market data
under sustained real-time updates.

Built for the Staff Engineer / Architect (Mobile Apps) practical assignment at Amused Group.
UI built to full fidelity against the [Figma reference](https://www.figma.com/design/JYfr5h2vC9IFKtX3vasmZk/Pulse-Crypto-Mockup).

---

## Setup

**Prerequisites**

- Node.js 24.x, pnpm (`corepack enable`)
- Android Studio + an Android Emulator (**required** target platform for this assignment)
- Xcode + iOS Simulator (optional — not required)
- The backend running locally (see [`pulsecrypto-backend`](../pulsecrypto-backend))

**Install**

```bash
pnpm install
```

**Environment**

```bash
cp .env.example .env
```

Set `EXPO_PUBLIC_API_BASE_URL` / `EXPO_PUBLIC_WS_BASE_URL` to wherever the backend is
reachable — for the Android Emulator connecting to a backend on your host machine, that's
`http://10.0.2.2:3000` / `ws://10.0.2.2:3000`, not `localhost`.

**Native projects**

This app uses Expo's Dev Client + Continuous Native Generation, not Expo Go — several
dependencies (`react-native-mmkv`, `react-native-reanimated`, custom fonts) require native
code Expo Go doesn't include.

```bash
pnpm expo prebuild --clean
```

`android/` and `ios/` are generated, not committed — re-run this after any native
dependency changes (a new `expo install` package, a new config plugin), not on every build.

---

## Build and run

**Android Emulator** (the assignment's required target — this submission was built and exercised on a Pixel 8, API 35, emulator):

```bash
pnpm expo run:android
```

**Physical Android device**: enable USB debugging, connect via USB (or same Wi-Fi for
wireless ADB), confirm it's detected with `adb devices`, then run the same command above —
Expo CLI prompts you to pick a target if both an emulator and a device are available, or use
`pnpm expo run:android --device` to pick explicitly.

**Faster iteration after the first install** (no native changes): once the dev-client APK is
installed on your target, `pnpm expo start --dev-client` reconnects to it without a full
rebuild.

**Checks**

```bash
pnpm run typecheck
pnpm run lint
pnpm test              # Jest — 14 suites, 71 tests (unit; see Known limitations)
pnpm run check:contracts   # diffs src/contracts/schemas.ts against the backend's copy on GitHub
```

---

## What it does

- **Watchlist** (`Markets` tab) — every pair the backend is currently tracking (not a
  hardcoded count), each row showing trading pair, live price, 24h change, a connection
  indicator, and a favourite toggle. Search/filter is client-side, no debounce needed at this
  scale.
- **Favourites** — persisted in MMKV, restored synchronously on launch (no flash of empty
  state). A favourited pair the backend isn't currently tracking still renders, via
  `UntrackedFavouriteBadge`, rather than being silently hidden.
- **Terminal** (Market Details) — price, 24h high/low, buy/sell pressure, spread, a live order
  book (bids and asks), a market-depth panel, and a last-updated timestamp (at the bottom of the
  scrolling screen) sourced directly from the backend's own conflation tick, not recomputed
  client-side. The "Market Cap" cell from the Figma design is a **static placeholder** (Binance
  provides no such field).
- **Live updates** — price changes flash green/red on the UI thread via
  `react-native-reanimated`; order-book bar widths animate smoothly on the same thread, so
  neither is blocked by JS-thread work processing the next incoming tick.
- **Offline behavior** — stale data stays visible when disconnected, connection status is
  always shown, and reconnection is automatic with exponential backoff + jitter. No
  ping/pong heartbeat — the backend's own broadcast cadence is the liveness signal; if no
  message arrives within a timeout derived from that cadence, the connection is treated as
  dead.
- **Pull-to-refresh** on the watchlist reloads `/pairs/meta` via TanStack Query, entirely
  independent of the WebSocket connection — it never touches it.
- **REST error handling and retry** — the `/pairs/meta` call goes through an axios client with a
  10 s timeout. Every failure becomes one `AppError` (network, timeout, HTTP, validation,
  cancelled, unknown) with a `retryable` flag; only transient failures (no response, timeout,
  HTTP 408/425/429/5xx) are retried — up to 3 times with 0.5 s → 1 s → 2 s exponential backoff
  and jitter — while a 404 or a malformed payload fails immediately. When retries run out, a
  localized message appears under the search field (or in Terminal's waiting state).
- **Telemetry & Settings** + the account drawer — present in the Figma file but outside the
  assignment's functional requirements; built at full visual fidelity anyway (see
  [Trade-offs](#trade-offs-considered)). WS message rate and JS-thread FPS are real, live
  measurements (the FPS gauge read 55 on the emulator with eight pairs streaming); everything else on that screen (throttling slider/toggles, drawer account
  links, memory footprint) is explicitly local UI state or a labeled placeholder, not wired
  to anything real.

---

## Architectural decisions

Full rationale, including options considered and rejected, lives in
[`docs/adr/`](./docs/adr) (mirrored from the project-level ADR — start at
[`docs/adr/00-overview.md`](./docs/adr/00-overview.md)). Summary:

| Decision                 | Choice                                                                                                                    | Why (short form)                                                                                                                                                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HTTP client & errors     | **axios** (one `apiClient`, used only by the data layer — ESLint-enforced), one `AppError` model, one shared retry policy | `fetch` has no timeout and TanStack Query's default retry re-attempts permanent failures (404, bad payload); a typed, retryable-aware error model fixes both, and the backoff arithmetic is shared with the WebSocket reconnect (ADR-M12) |
| Navigation               | **React Navigation Bottom Tabs**, subscriptions gated on `useIsFocused()`                                                 | The original Native Stack remounted a screen on every tab switch; Bottom Tabs keeps visited screens mounted, which makes off-screen live subscriptions the new hazard — so they pause while a screen isn't focused (ADR-M11)              |
| Framework                | **Expo, Dev Client + Continuous Native Generation**                                                                       | Full native access (real, editable `android/`/`ios/` projects) without hand-maintaining native project files across every RN version bump                                                                                                 |
| State — real-time        | **Zustand**                                                                                                               | Selector-based re-renders scoped to only what changed, important at a 100ms update cadence                                                                                                                                                |
| State — REST             | **TanStack Query**                                                                                                        | Caching, background refetch, loading/error states — an architectural boundary (client vs. server state) worth establishing even with one endpoint today                                                                                   |
| List rendering           | **FlashList**                                                                                                             | Cell recycling instead of destroy/recreate, the property that matters under sustained update bursts                                                                                                                                       |
| Animation                | **react-native-reanimated**, UI-thread worklets                                                                           | The single highest-leverage decision for staying smooth under load — a JS-thread animation approach would be the first thing to visibly degrade                                                                                           |
| Persistence              | **MMKV** via Zustand's `persist` middleware                                                                               | Synchronous reads mean favourites (and cached last-known market state) render correctly on the very first frame, no flash of empty state                                                                                                  |
| WebSocket client         | **Custom hook**, broadcast-silence liveness, no heartbeat                                                                 | The backend already broadcasts on a fixed cadence when healthy — a separate ping/pong protocol would answer a question the data already answers                                                                                           |
| Project structure        | **Feature-first with a small shared `core/`**                                                                             | Localized feature development, low merge-conflict surface, while still enforcing Clean Architecture boundaries within each feature and `core/`                                                                                            |
| Internationalization     | **i18next + react-i18next + expo-localization**, English shipped                                                          | Retrofitting i18n onto hardcoded strings later is expensive; establishing the pattern now (including locale-aware `Intl` number/date formatting) is cheap                                                                                 |
| Toggle / Slider controls | **Custom-built components**, not RN's `Switch` / a native slider library                                                  | Neither could be styled to match Figma's exact dimensions (track thickness, thumb size); built from scratch with reanimated (Toggle) and `PanResponder` + reanimated (Slider), no extra native dependency for the latter                  |
| Styling                  | **`StyleSheet.create()`**, not NativeWind/Tailwind                                                                        | Performance-first choice — StyleSheet avoids the runtime style-resolution overhead a Tailwind-in-RN approach adds, which matters at this update cadence                                                                                   |

**Performance work** (the assignment's explicit "responsive UI under sustained updates"
requirement):

- **Cached `Intl.NumberFormat`/`Intl.DateTimeFormat` instances** instead of constructing one
  per call — `formatPrice`, `formatPercent`, and the order book's number formatter were each
  building a fresh instance on every invocation, up to ~60×/tick across a visible order book.
- **Batched WS-to-store updates** — the backend's conflation tick broadcasts several
  near-simultaneous per-pair messages; these are now buffered and flushed to the store once
  per animation frame, so a full broadcast tick produces at most one React commit instead of
  one per message.
- **Memoized static content** (the Market Depth chart, order book rows via a value-based
  `React.memo` comparator) so components that don't actually change don't re-render just
  because a sibling's data ticked.
- **Throttled MMKV writes** on the high-frequency market store, so persistence doesn't
  perform a disk write on every ~100ms tick.
- **Focus-gated live subscriptions** — with Bottom Tabs every visited screen stays mounted, so
  `useMarketData` takes an `enabled` flag driven by `useIsFocused()`; a hidden screen no longer
  re-renders on every WS tick (this was found by watching the JS-thread FPS gauge collapse to
  15–19 FPS with Terminal sitting in the background — ADR-M11).
- **Price flash without React state** — the up/down flash direction is a Reanimated shared
  value read inside the worklet, so a price tick causes no JS-thread re-render (ADR-M4).

**Security:** outside `__DEV__` the app refuses to start unless the API and WebSocket URLs are
`https://`/`wss://`, so a release build can't silently ship the plaintext development URLs.
Incoming WebSocket messages and `/pairs/meta` responses are validated with Zod against the
mirrored contract; a malformed message is dropped, never applied to the store.

---

## Assumptions made

- The backend is reachable from the device/emulator during local development (see the
  Android Emulator networking note under [Setup](#setup)).
- Five required pairs satisfy the assignment's mandatory scope; the backend's dynamically
  resolved additional pairs are a bonus the UI handles gracefully (no hardcoded pair count
  anywhere in the mobile codebase).
- English is the only shipped translation; the localization infrastructure (namespaced
  strings, `Intl`-based formatting, an MMKV language-override lookup at startup) is wired so adding a
  second language is mostly a translation-file addition — but there is no in-app language picker yet.
- The Android Emulator is the required verification target per the assignment; iOS Simulator
  support exists but wasn't the primary target during development.

---

## Trade-offs considered

- **Expo (Dev Client) over bare React Native CLI** — faster iteration and no hand-maintained
  native project files across RN upgrades, at the cost of being tied to Expo's release
  cadence (mitigated: EAS is never required, `expo prebuild` + local Gradle/Xcode is
  sufficient end to end).
- **Zustand + TanStack Query over one state library for everything** — two libraries instead
  of one, in exchange for a client-state/server-state boundary that's far cheaper to
  establish now than to retrofit after ad hoc `fetch` calls spread across screens.
- **FlashList over FlatList** — cell recycling under sustained updates (argued from FlashList's
  documented behavior; no FlatList benchmark was run), with a disclosed
  maintenance-continuity note: FlashList's primary maintainer has announced reduced
  sponsorship of the project as part of an unrelated broader strategy shift, worth
  monitoring but not a reason to avoid the technically stronger choice today.
- **Broadcast-silence liveness over a dedicated heartbeat** — no new protocol surface, at the
  cost of depending on the backend's broadcast cadence staying predictable whenever healthy
  (which the backend's own design already guarantees).
- **Feature-first architecture with a small shared `core/`** — chosen over both pure
  layer-first (poor scalability, high merge-conflict risk) and flat feature-first (tends
  toward files mixing domain/data/UI with no internal structure); the trade is a small
  amount of deeper nesting, well handled by IDE tooling.
- **Building the full localization mechanism while shipping only one language** — one
  dependency and upfront setup cost for infrastructure that, strictly by the assignment's own
  requirements, isn't tested — accepted because retrofitting it later onto hardcoded strings
  is the more expensive path.
- **Custom Toggle and Slider components instead of native controls** — more code to write and
  maintain than `Switch`/`@react-native-community/slider`, in exchange for pixel-accurate
  control over dimensions neither native control exposed as a style prop.
- **Building the out-of-scope Telemetry/Settings screen and account drawer at full fidelity**
  — real implementation effort on UI the assignment doesn't ask for and doesn't functionally
  test, because the Figma reference includes them and a submission that visibly matches its
  own referenced mockup was judged worth more for this specific evaluation than a strictly
  scope-minimal one. Every control with no real backing system is explicitly documented as
  local UI state only, not left for a reviewer to discover unexplained.
- **StyleSheet.create() over NativeWind/Tailwind** — after evaluating NativeWind directly, its
  runtime style-resolution overhead was judged a poorer fit for a performance-first app
  updating at a 100ms cadence than React Native's own StyleSheet, which resolves ahead of
  time.

---

## Known limitations

Stated plainly rather than left for a reviewer to find:

- **Tests are unit tests only** (Jest: WebSocket state machine, stores, repositories, formatting,
  the watchlist merge/search logic). `@testing-library/react-native` is installed but there are
  no component tests, and no test renders the UI under a non-English locale. UI behaviour was
  verified by running the app on the Android Emulator instead.
- **No CI.** The Husky hooks (lint-staged, commitlint, and typecheck + tests on push) are the only
  automated gate. The contract mirror is checked on demand with `pnpm run check:contracts`.
- **English only, no language picker** — see Assumptions.
- **`pnpm audit --prod` reports one moderate advisory** (`uuid`, transitive through Expo's
  build-time config plugins — not part of the runtime bundle).
- Telemetry/Settings controls, the account drawer's links, the memory-footprint figure and
  Terminal's "Market Cap" are display-only (see above).

---

## How AI-assisted development tools were used

This project was built with **Claude Code** end-to-end, using a **spec-driven development**
workflow: every screen and feature was implemented against a written spec in `specs/`
(`mobile-screens.md`, `design-tokens.md`, `api-contract.md`, etc.), with the underlying
architecture decisions recorded in a full ADR (`docs/adr/`) before implementation began.

Concretely:

- **Architecture and design decisions** — state-management split, project structure, the
  WebSocket client's reconnection/liveness strategy, the choice between Expo and bare CLI —
  were proposed with explicit alternatives and trade-offs, and recorded in the ADR rather than
  implemented silently. Where a proposed pattern was later reconsidered (for example, a
  second WebSocket heartbeat mechanism was drafted, then rejected as redundant against the
  backend's own broadcast-silence signal), the reasoning for the reversal is kept in the
  document.
- **Figma fidelity was verified against real data, not guessed.** Colors, typography,
  spacing, and icon paths were extracted directly from Figma's REST API (`design-tokens.md`,
  `svgIcons.ts`) rather than estimated from a screenshot. Over the course of development, this
  included several rounds of direct comparison against exported reference images, where the
  developer's own closer inspection corrected earlier AI misreadings — for example, a drawer
  link's permanently-applied highlight color turned out to be Figma's _pressed_-state variant,
  not its default appearance, and was corrected once flagged; a Market Depth panel's floating
  stat card was briefly changed to sit flush against the card's corner, then reverted once a
  higher-resolution reference showed it was meant to float with inset margin all along. Both
  corrections are recorded in the git history, not silently overwritten.
- **A real functional bug was found and fixed against the assignment's own stated
  requirement**: on a fresh install with the backend unreachable, the Terminal screen got
  stuck on a bare loading spinner with no navigation chrome at all — traced directly to the
  assignment's explicit offline-behavior requirement, not treated as a cosmetic issue.
- **Performance work was driven by a reported symptom** (observed FPS drops under live
  backend traffic, sometimes to zero), diagnosed to two concrete root causes — uncached
  `Intl` formatter construction and one React commit per WebSocket message rather than per
  broadcast tick — and fixed at the architecture level rather than tuned superficially.
- **Implementation** was verified directly before being considered complete —
  `pnpm run typecheck && pnpm run lint && pnpm test`, plus an `expo export` bundle check, run
  before every commit — not just asserted as done.
- **Git workflow**: Gitflow branching, Conventional Commits, atomic commits per logical
  change, all reviewed and committed by the developer. Claude Code pushed to a remote or merged
  a branch only when explicitly told to for that change.
- **Human review and correction**: the developer directed every scope decision recorded in
  this document (including whether to build the assignment-out-of-scope Telemetry/Settings
  screen and drawer at all), caught and corrected visual/behavioral misreadings across many
  iterations as described above, and made the final call on every trade-off in this README
  and the ADR.
