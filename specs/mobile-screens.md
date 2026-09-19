# Mobile Screens — Behavior Spec

Source: assignment brief (Part 2), ADR-M2/M3/M4/M8/M9/M10. Visual detail (colors,
typography, spacing, radii) is specified precisely in `specs/design-tokens.md`, pulled from
the [Figma mockup](https://www.figma.com/design/JYfr5h2vC9IFKtX3vasmZk/Pulse-Crypto-Mockup?t=1Is1HymqvhvoKHab-1)'s
own API — this spec covers screen-level data and behavior, and defers to `design-tokens.md`
for exact visual values rather than restating them here.

## Design source — verified via Figma's API, and a real scope finding

Unlike the earlier version of this spec, design tokens are no longer "TBD at build time" —
they were pulled directly from the Figma file via its REST API (personal access token,
`file_content:read` scope) and are fully specified in **`specs/design-tokens.md`**. Every
color, font, spacing, and radius value used below is real, traced to its source node — not
approximated. Implement against `design-tokens.md`, not a fresh Figma inspection, unless a
specific micro-detail is flagged there as unresolved.

**The Figma file's actual screen inventory does not match the assignment's screen list
one-to-one — this was surfaced, discussed, and resolved explicitly (not silently) before
this spec was written.** The file contains exactly two designed screens:

- **`PulseCrypto | Trading Terminal`** — a single-pair detail view: price ticker (current
  price, 24h high/low, market cap), a Bids/Asks order book table, a "Market Depth
  Visualization" panel, and a hidden-by-default account side-drawer (profile tier, API
  Keys, Security, Trade History, Support, Sign Out).
- **`PulseCrypto | Telemetry & Settings`** — a bento-grid dashboard: a "Data Throttling
  Configurator" card (update-frequency slider, protocol/polling toggles), a "Live
  Performance Telemetry" card (JS thread FPS gauge, WS message-rate counter, memory
  footprint graph), and three small stat cards (GPU acceleration, API latency, storage
  cache).

Both screens' bottom nav bar shows **four tabs — Terminal, Markets, Telemetry,
Settings** — but only two of those four have an actual designed screen in the file.
There is no `Markets` screen (the assignment's watchlist) anywhere in the file.

**Resolution (explicit user decision, not an assumption):** build everything the Figma
file _does_ contain exactly as designed, at full fidelity — including the account drawer
and the telemetry/settings dashboard, even though large parts of both sit outside the
assignment's literal functional requirements. For the one thing the assignment requires
that Figma doesn't cover — the watchlist/`Markets` screen, plus its search and favourites
behavior — design it fresh, in the same verified visual language (`design-tokens.md`),
since no mockup exists to match against. This expands the mobile app's screen count beyond
the assignment's Part 2 list; see ADR-M10 for the full decision and rationale, including
which parts of the Figma-sourced screens get real data vs. static/display-only treatment
given there's no backend spec behind account management or client-side throttling controls.

## Screen inventory (revised — five screens, not four)

| Screen               | Maps to                                                                  | Source                                                                                                         |
| -------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Markets              | Assignment's "Market Watchlist" (+ Search, + Favourites)                 | Not in Figma — designed fresh, per `design-tokens.md`                                                          |
| Terminal             | Assignment's "Market Details," parameterized per selected pair           | Figma "Trading Terminal," built at full fidelity                                                               |
| Telemetry & Settings | Not an assignment requirement — built because Figma specifies it in full | Figma "Telemetry & Settings," built at full fidelity (see ADR-M10 for real-vs-mock data treatment per control) |
| Account drawer       | Not an assignment requirement — built because Figma specifies it in full | Figma "Aside — Side Navigation Drawer," reachable from Terminal's app bar hamburger button                     |

## Screen: Markets / Watchlist (`features/watchlist/presentation/WatchlistScreen.tsx`)

**Not present in the Figma file — design this screen using `design-tokens.md`'s verified
palette/type/spacing so it reads as part of the same system** (dark `background.screen*`
base, `type.tableValue`/JetBrains Mono for prices, `type.labelCaps`/Inter for column
labels, `signal.positive`/`signal.negative` for 24h-change color, same card/row radii as
the order book table) — not a mismatched visual style bolted onto an otherwise
Figma-accurate app. It's reached via the bottom nav's "Markets" tab (present in Figma's nav
bar on every screen, just without its own designed destination).

**Data sources:** `core/data`'s `MarketRepository` (via `IMarketRepository.getTrackedPairs()`

- `subscribe()` per pair) for live rows; `features/favourites`'s `useFavourites()` for the
  favourited set; TanStack Query's `/pairs/meta` for display name / trading status (used for
  rows that need metadata not carried on the WS payload).

**Row contents** (`PairRow.tsx`, composes `core/components`):

- Trading pair (`displayName`, e.g. "BTC / USDT")
- Current price (`PriceText` — flashes green on increase, red on decrease, per ADR-M4)
- 24h change (`ChangeBadge` — colored by sign, from the `@ticker` stream via WS, not
  refetched from REST on every render)
- Live connection indicator (shared `ConnectionIndicator`, reflects the single global
  connection state, not a per-row state)
- Favourite toggle (tappable icon, calls `useFavourites().toggle(pair)`)

**Row set = union of tracked pairs and favourited pairs.** A favourited pair currently
outside the tracked set (see `offline-behavior.md` note on dynamic pair resolution)
still renders via `UntrackedFavouriteBadge` instead of a price — see ADR-M8's
untracked-favourite behavior spec for the exact merge logic.

**List rendering:** FlashList (ADR-M3), `React.memo` on `PairRow`, Zustand selectors scoped
per-pair so an update to BTC's price doesn't re-render ETH's row.

**Search** (`SearchBar.tsx`): filters the rendered row set by symbol or display name,
client-side, case-insensitive, no debounce needed at this data volume (five to ~eight
rows) — don't over-engineer this with a search index.

**Pull-to-refresh:** `RefreshControl` wrapping the FlashList, triggers TanStack Query's
`refetch()` for `/pairs/meta` only. Does not touch the WebSocket connection — see
`offline-behavior.md`.

## Screen: Terminal / Market Details (`features/market-details/presentation/MarketDetailScreen.tsx`)

Maps to Figma's "Trading Terminal" screen (node `1:5`), built at full fidelity, and
maps to the assignment's "Market Details" requirement, **parameterized per selected pair**
(Figma's mock shows a fixed "BTC/USDT," but this is a live app — the screen renders
whichever pair was tapped from Markets, or the currently-active pair when reached via the
bottom nav's "Terminal" tab directly, defaulting to the first required pair or the last
pair viewed if none is selected yet). Subscribes via `IMarketRepository.subscribe(pair, ...)`.

**Contents, as designed in Figma, with the assignment's required numeric fields layered on
top where Figma only shows a qualitative equivalent:**

- **Header:** pair symbol as the title (`Heading 1`, e.g. "BTC/USDT"), hamburger button
  opening the account drawer (see below), a "CONNECTED"/disconnected status pill —
  this is `ConnectionIndicator`, styled per Figma's badge (`signal.positive` fill when
  connected), not a separate ad hoc component.
- **Price Ticker Section:** current price (`PriceText`, `type.priceDisplay`, flash green/red
  on change per ADR-M4), 24h % change, and three stat cells — Figma shows 24H High / 24H
  Low / Market Cap. **The assignment doesn't ask for Market Cap and Binance's `ticker/24hr`
  has no such field.** _(Revised in v9.1 — this spec originally said to replace the cell with
  24H Volume; that is not what was built.)_ All three cells are rendered as designed. Market
  Cap is fed by `PairMeta.marketCap`, a static placeholder (`MARKET_CAP_PLACEHOLDER`) the
  backend returns for every pair — display-only, in the same category as the Telemetry
  screen's static values (ADR-M10). `volume24h` stays in `/pairs/meta` but isn't shown here.
- **Spread, Buy Pressure, Sell Pressure:** not shown numerically anywhere in the Figma
  mock — the closest equivalent is the Market Depth panel's qualitative
  `Pressure: Sell Heavy` / `Liquidity Gap: Low (0.02%)` legend. Since the assignment
  explicitly requires these three as numeric values, **add them as a small stat row using
  `type.tableValue`/`type.labelCaps`** (consistent with the rest of the screen's typography),
  either alongside or replacing the qualitative legend — placed near the Market Depth
  section where Figma already reserves visual space for this category of information. Use
  the real computed values from `MarketData.spread`/`buyPressure`/`sellPressure` (ADR-B5),
  not the placeholder "Sell Heavy" text.
- **Live order book (`OrderBookView.tsx`):** Bids/Asks table, columns "PRICE (USDT)" /
  "AMOUNT (BTC — or the active pair's base asset)" / "TOTAL", styled per
  `design-tokens.md` (green bid-row overlay, red ask-row overlay via `signal.positive`/
  `signal.negative`), quantity bars animated smoothly on change via
  `react-native-reanimated` (ADR-M4) — not an instant re-layout. Amount column header must
  use the selected pair's actual base asset, not a hardcoded "BTC," since this screen is
  parameterized per pair.
- **Market Depth Visualization:** Figma's depth panel (Bids/Asks aggregate totals,
  liquidity-gap/pressure legend) — implement the visual treatment as designed; the
  underlying "Pressure: Sell Heavy"-style qualitative label can stay as flavor text derived
  from the real `buyPressure`/`sellPressure` split (e.g. "Buy Heavy" when
  `buyPressure > 60`, "Sell Heavy" when `sellPressure > 60`, "Balanced" otherwise) rather
  than a static string.
- **Last updated timestamp:** not present in the Figma mock at all — the assignment
  requires it. Add `LastUpdatedLabel` (renders `MarketData.lastUpdatedAt` via
  `Intl.DateTimeFormat`, per `localization.md`, never recomputed client-side — ADR-B4/§12.2)
  in a position consistent with the screen's existing label style (e.g. near the price
  ticker or order book header), styled with `type.bodySmall`/`text.label`.
- **BottomNavBar:** four tabs — Terminal, Markets, Telemetry, Settings — per Figma, styled
  per `design-tokens.md` (`background.navBar`, active-tab treatment TBD by inspecting the
  Figma node directly if a distinct active state exists — not confirmed in the API pull).

**Unmount behavior:** unsubscribe from the pair on screen unmount (`IMarketRepository`'s
returned `Unsubscribe` callback) — don't leak a subscription per visited pair over the
app's lifetime.

## Screen: Telemetry & Settings (`features/telemetry-settings/presentation/TelemetryScreen.tsx`)

Maps to Figma's "Telemetry & Settings" screen (node `1:314`) — **not an assignment
requirement**, built because the Figma file specifies it in full and the resolution
decision (above) was to build everything Figma provides at full fidelity. See ADR-M10 for
which of this screen's controls get real data vs. are display-only.

**Header:** page title "System Settings & Telemetry" with subtitle "Real-time performance
monitoring and data ingestion controls." (from the `Header Section` node). The TopAppBar
row above it shows the currently-selected trading pair (e.g. "BTC/USDT") — same as
Terminal's TopAppBar — not a screen-specific title. Confirmed directly against Figma
(2026-09-19), correcting an earlier reading of this as an unintentional leftover; it's
real, intentional shared-header content. Shows whichever pair was last viewed on Terminal
(defaulting the same way Terminal's own pair does, if none has been viewed yet this
session).

**Bento grid cards, in Figma's order:**

1. **Data Throttling Configurator** — "Update Frequency" slider (10ms/500ms/1000ms tick
   labels), "Binary Protocol Compression" toggle, "Adaptive Polling Strategy" toggle. No
   backend support exists for per-client-configurable broadcast intervals or protocol
   compression (`BROADCAST_INTERVAL_MS` is a fixed server-wide env var — ADR-B4). Build
   these controls as local UI state only (they visually work — the slider moves, toggles
   flip — but don't wire them to anything backend-side). Document this plainly as
   display-only in the README, not silently.
2. **Live Performance Telemetry Dashboard** — JS thread FPS gauge, WS message-ingestion
   rate counter, memory footprint line graph, RESET/HEALTHY buttons. **Wire the WS
   message-rate counter to the real value** — `useWebSocket` already receives every
   message and can expose a rolling messages/sec count cheaply. A JS-thread FPS gauge is
   also genuinely obtainable client-side (e.g. via a `requestAnimationFrame`-based
   frame-time sampler, or Reanimated's frame callback since Reanimated is already a
   dependency — ADR-M4) — wire it for real if the effort is low; if not, mark it as an
   approximate/illustrative value in a code comment rather than silently faking precision.
   Memory footprint is harder to get accurately in an Expo-managed app without a native
   module — approximate or omit rather than inventing a number; note the limitation.
3. **Three stat micro-cards** — GPU Acceleration, API Latency, Storage Cache. No real data
   source exists for any of these (no GPU render-pipeline introspection, no ping telemetry
   to a specific region, no IndexedDB in React Native). Build as static display content
   exactly as designed — this is decorative fidelity to the mockup, not a functional
   requirement, and inventing fake "live" values here would be actively misleading rather
   than honest static content.

## Screen: Account Drawer (`features/market-details/presentation/AccountDrawer.tsx`)

Maps to Figma's "Aside — Side Navigation Drawer" (node `1:271`, nested inside the
`Trading Terminal` frame, hidden by default). Reachable via the hamburger button in
Terminal's TopAppBar. **Lives inside the `market-details` (Terminal) feature, not
`telemetry-settings`** — it's structurally part of Terminal in Figma, not a child of the
Telemetry & Settings screen, even though its content (account/settings-adjacent links) is
conceptually closer to what "Settings" implies. Follow the source structure, not the
conceptual naming.

Contains: a profile section ("Pro Trader," "Tier 3 Verified • ID: 882941"), an "ACCOUNT"
group (API Keys, Security links) and a "TRADING" group (Trade History, Support links), and
a "Sign Out" button. **No account system, auth, or backend support exists anywhere in this
project for any of this** (no login, no user records, no API key management, no trade
history data). Build the drawer's visual structure and static content exactly as designed
— it opens, shows this content, and its links can be no-ops or navigate to an empty
placeholder screen. Do not build actual authentication, API key management, or a trade
history feature to back it — that would be substantial, unscoped work with no requirement
driving it. State this plainly in the README as intentionally static/decorative,
consistent with how the Telemetry screen's non-wireable controls are treated above.

## Screen: Favourites

Not a separate screen — favourites are a toggle-and-filter behavior on the Markets screen,
not a distinct route. Confirmed: the Figma file has no dedicated favourites screen either.

**Persistence:** `features/favourites/data/FavouritesRepository.ts`, MMKV-backed
(ADR-M5). Restored synchronously on app launch — no loading spinner needed for favourites
specifically, since MMKV reads are synchronous.

## Cross-screen: connection status

`ConnectionIndicator` reflects one single global WebSocket connection state (ADR-M6),
shown consistently wherever it appears (watchlist rows, market details) — it is not
per-screen or per-pair state.

## Loading, error, and empty states (industry-standard baseline — confirm against Figma)

The assignment and ADR are precise about the live-data path; these states aren't spelled
out explicitly, so the following is the standard, defensible default for a real-time
trading UI. If Figma shows specific empty/loading/error designs, those take precedence —
this section is the fallback for anything the mockup doesn't cover, not a competing spec.

- **Cold launch, no cached data yet, WS not connected:** watchlist shows a skeleton/loading
  placeholder per row (not a blank screen, not an infinite spinner over the whole screen) —
  consistent with ADR-M5's cached-last-known-state goal of never showing an empty screen.
- **Cold launch with MMKV-cached data available:** render the cached data immediately
  (ADR-M5/M7), with `ConnectionIndicator` showing `connecting`, no skeleton needed.
- **`/pairs/meta` fetch fails (TanStack Query error state) and no cached metadata exists:**
  watchlist still renders from live WS data alone (price, 24h change come from the stream,
  not from `/pairs/meta`) — metadata fields that depend on the REST call
  (`displayName`, `tradingStatus`) degrade to the raw symbol string rather than blocking
  the whole row. This keeps the watchlist's live-data promise intact even if the REST path
  is down. The failed request is retried per ADR-M12 (only retryable errors, at most 3 times,
  exponential backoff with jitter); once retries are exhausted a localized error line
  (`common:errors.*`) appears under the search field.
- **Market Details opened for a pair with no order book data yet** (just navigated, first
  snapshot hasn't arrived): `OrderBookView` shows a loading state, not an empty book
  rendered as if it were real (ties back to the "don't display the defensive `spread: 0`
  default as a real value" rule in `pressure-spread-formula.md`).
- **Search yields zero matches:** localized empty-state message (`watchlist.noResults`,
  already scaffolded in `localization.md`), not a blank list.

## Error boundary (ADR-M6, v8.1 addition)

`app.tsx` wraps the navigator in a single top-level error boundary:

```typescript
class AppErrorBoundary extends React.Component<PropsWithChildren, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (__DEV__) console.error(error, info);
  }
  render() {
    if (this.state.hasError) return <ErrorFallbackScreen onReload={() => this.setState({ hasError: false })} />;
    return this.props.children;
  }
}
```

One boundary at the root, not per-screen — a five-to-eight-screen app doesn't need
per-screen isolation, and a single fallback with a "reload" action is enough to satisfy
"appropriate error handling" without over-building. `ErrorFallbackScreen`'s text goes
through `react-i18next` like every other user-facing string (ADR-M9).

## Accessibility (baseline, industry-standard for a data-dense list UI)

- Every interactive element (favourite toggle, search input, pair row) has an
  `accessibilityLabel` sourced from the same i18n namespace as its visible text — not a
  separate hardcoded string that could drift out of sync with a translated label.
- `ConnectionIndicator` and the price-flash colors are not the _only_ signal for their
  respective states — color alone shouldn't carry meaning (a connection-status text label
  already satisfies this per the assignment's own requirement; price flash is a
  supplementary animation on top of the numeric value change, not a replacement for it).
- FlashList rows and buttons meet standard minimum touch-target sizing (44×44pt) regardless
  of how dense the Figma visual design is — adjust internal padding to hit this if the
  mockup's tap targets render smaller.

## Animation timing (defaults — confirm/override against Figma if it specifies timing)

No default is stated in the ADR beyond "runs on the UI thread" (ADR-M4). Absent a
Figma-specified duration, use:

- Price flash: fade to the up/down color over ~150ms, hold, fade back to neutral over
  ~400ms — brief enough not to feel laggy at a 100ms update cadence, long enough to
  actually register as a visible flash rather than a flicker.
- Order book bar-width changes: ~200ms ease-out on width transitions.

These are reasonable, testable defaults for the performance-hardening phase (ADR §6 Phase 5) to tune — not values pulled from the mockup, since timing isn't something a static
Figma frame encodes. State this distinction plainly in the README rather than implying the
numbers came from the design file.
