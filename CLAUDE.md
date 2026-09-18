# pulsecrypto-mobile — Instructions for Claude Code

@AGENTS.md

PulseCrypto's mobile app: a React Native (Expo Dev Client) app that consumes the backend's
WebSocket broadcast and REST metadata endpoint, and visualizes it under sustained
real-time updates.

**Expo's official Claude Code plugin is enabled for this project** (`.claude/settings.json`
— `expo@claude-plugins-official`). Use its Expo Skills/MCP tools when available to verify
Expo/React Native API usage and SDK-version specifics against current docs, rather than
relying on training data — the same "verify, don't assume" discipline this project already
applies everywhere else (see `docs/adr/00-overview.md`'s Executive Summary).

**This repo follows Spec-Driven Development.** Before implementing any unit of work, read
its spec in `specs/`. If no spec exists for what you're about to build, stop and write the
spec first (or ask) — do not implement directly from this file or from memory of the ADR.

## Session start protocol — run this before anything else (ADR-X6)

**Do this at the start of every session — a brand-new one, one resumed after context
compaction, or one picking this project back up after any gap.** Do not skip it because a
conversation summary already describes this project — a summary can be wrong, stale, or
have lost fidelity in ways that are invisible until they cause a mistake. This has already
happened once on this project (an initial Gitflow bootstrap produced a rootless commit
because a risk was noticed and not acted on) — this protocol exists specifically because of
that, not as generic caution.

1. **Read this entire `CLAUDE.md` file** — not just the section that looks relevant to the
   immediate task.
2. **Read the specific `specs/*.md` file(s) the task actually touches**, in full — for any
   screen work, that means `mobile-screens.md` and `design-tokens.md` together, not one
   without the other.
3. **Check real current repository state with direct commands before assuming anything:**
   `git status`, `git log --oneline --all --graph`, `git ls-remote origin` if remote state
   matters to the task, and `ls`/file reads for anything about to be modified. Never
   proceed on a conversation summary's account of what state things are in when a direct
   check is cheap and available.
4. **If real state doesn't match what `CLAUDE.md`/`specs`/the ADR describe** (scaffold
   missing, unexpected branch structure, a file that should exist doesn't) — stop and flag
   the discrepancy to the user. Don't silently "fix" it into whatever seems reasonable, and
   don't proceed as if the mismatch weren't there.
5. **Before declaring any structural task done — git topology, folder/dependency
   architecture, schema changes, anything that touches more than one file in a coordinated
   way — verify the actual resulting state directly** (`git log --graph`,
   `git merge-base --is-ancestor`, re-reading the changed files, whatever directly confirms
   the real outcome). Don't infer success from individual step outputs looking correct in
   sequence — that's exactly how the rootless-commit mistake happened: each `git checkout -b`
   reported success, and the aggregate result was still wrong.
6. **If a risk or edge case becomes apparent mid-task, resolve it before finishing, or say
   it out loud explicitly.** Noticing a problem and silently proceeding as if it were
   handled is a worse outcome than not noticing it — it creates the appearance of care
   without the substance of it. Full rationale: ADR-X6 in
   `docs/adr/03-cross-cutting-decisions.md` (grep for `ADR-X6`, don't read the whole file).

**Visual source of truth:** [Pulse Crypto Mockup — Figma](https://www.figma.com/design/JYfr5h2vC9IFKtX3vasmZk/Pulse-Crypto-Mockup?t=1Is1HymqvhvoKHab-1).
Design tokens (colors, typography, spacing, radii) are **already extracted and verified**
— pulled from Figma's REST API, not guessed. Implement `core/theme/` directly from
`specs/design-tokens.md`; don't re-derive tokens from a fresh screenshot/description.

**Screen scope is five screens, not four (ADR-M10) — read `specs/mobile-screens.md` before
building any screen.** The Figma file only designs two screens ("Trading Terminal" →
`Terminal`/Market Details, and "Telemetry & Settings," a developer dashboard + account
drawer that the assignment never asks for). There's no watchlist frame in Figma at all —
`Markets`/Watchlist is designed fresh from the same tokens. The explicit, developer-made
decision: build everything Figma provides at full fidelity (including the
out-of-assignment-scope Telemetry/Settings dashboard and account drawer), and build Markets
fresh to match. Controls with no backend behind them (throttling slider/toggles, API
Keys/Security/Trade History/Sign Out) are local UI state only, documented as display-only
in the README — don't silently wire them to nothing and also don't silently invent a
backend feature to make them real. Metrics that ARE cheaply real (WS message rate, JS
thread FPS) get wired to actual values, not static numbers.

## Framework scaffolding — never done by Claude Code (ADR-X5)

**The initial project is generated by the user, manually, in their own terminal, using
Expo's official setup command** (`pnpm create expo-app` — verified directly against
`docs.expo.dev`, which documents pnpm as a first-class option alongside npm/yarn/bun; the
user confirms the exact current invocation at scaffold time). **Package manager is pnpm**
(ADR-X5 — chosen explicitly over npm/Yarn, see `docs/adr/03-cross-cutting-decisions.md`).
**`npx expo prebuild`** (which generates the native `android/`/`ios/` directories) is
likewise run by the user manually, not by a Claude Code session, so they can verify the
generated native projects build correctly before any feature work starts. If this repo is
empty or missing its scaffold, stop and say so — don't generate
`package.json`/`app.json`/an app skeleton to "get started."

**What this does NOT cover:** once the verified scaffold exists, routine dependency
installs during feature implementation (`pnpm add`, or `npx expo install` for
native-code packages per the install rule below — Expo's CLI stays npx-invoked regardless
of package manager, since it's Expo's own version-resolution logic, not a plain package
fetch) are normal work and fine to run directly —
the boundary is specifically the *initial scaffold and prebuild*, not every subsequent
install. See ADR-X5 in the ADR for the full reasoning.

## Evaluation context — why "correct-enough" isn't the bar here

This is a Staff Engineer / Architect (Mobile Apps) practical assignment. The reviewer is
evaluating the architecture, the specific decisions made and their rationale, and code
quality — not only whether the app runs. Concretely, this means:

- Follow the stated architecture **literally**, not "in spirit." A feature reaching into
  another feature's internals instead of its barrel export, or a reintroduced-and-rejected
  pattern (e.g. a client-side heartbeat), is a worse outcome than slower progress.
- Use idiomatic, industry-standard patterns for whatever library is in play (idiomatic
  Zustand selector usage, idiomatic TanStack Query cache config, idiomatic React Native
  Testing Library queries) rather than code that merely works. If you're unsure what's
  idiomatic for a given library, say so rather than guessing.
- Never take a shortcut that would make the code or the decision look worse under review
  to save time now — flag the tension and ask instead of silently choosing "fast" over
  "correct as specified."
- Tests and specs are not optional scaffolding to skip when a deadline feels close — the
  testing strategy itself is part of what's being evaluated.

## Authority, in order

1. `specs/*.md` — the exact behavior to implement for a given unit of work.
2. `docs/adr/` — the full rationale, **split into topic files (ADR-X7) — do not read all
   of them for one question.** Start at `docs/adr/00-overview.md` (69 lines, cheap) to find
   which file actually covers what you need, then `grep -n "^### ADR-M4"` (or whichever
   decision) that one file and read just that section with `offset`/`limit`. This repo only
   carries `02-mobile-decisions.md`, not `01-backend-decisions.md` — if a task needs backend
   internals, that's a signal it may belong in `pulsecrypto-backend` instead.
3. This file — hard constraints extracted from the ADR, so they can't be missed or
   "improved" away during implementation. If anything here ever conflicts with the ADR,
   the ADR wins — flag the discrepancy rather than picking one silently.

**`docs/adr/` is a mirror, not the source.** The source of truth is
`/Users/tmpw/Projects/pulse_crypto/adr/`, one level above both repos (index:
`adr/00-overview.md`). If an ADR-level decision changes (not a spec detail — an actual
architectural decision), it gets updated there first, in the specific topic file it belongs
to, and the corresponding mirrored file in this repo (and in `pulsecrypto-backend/docs/adr/`,
if that decision applies there too) gets re-copied afterward — one file, not the whole
folder, unless several files actually changed. Don't edit a mirrored copy independently and
let it drift from the root.

**Never commit.** Leave changes in the working tree for the user to review and commit
themselves. Do not run `git commit`, even if a task seems complete, unless explicitly
told to for that specific change.

**Never commit secrets, ever — they're gitignored, not just "handled carefully."** `.env`,
any API tokens (including a Figma personal access token, if one is ever used again for
design work — see ADR-M10 in `docs/adr/02-mobile-decisions.md`), signing material
(`*.jks`/`*.p8`/`*.p12`/`*.mobileprovision`) are covered by `.gitignore` (already in
place). Real values go in `.env` (gitignored) with a placeholder in `.env.example`
(committed), never inline in code. If `git status` or a diff ever shows a secret about to
be staged, stop and flag it rather than proceeding.

## Branching (ADR-X2 — Gitflow)

Never commit directly to `main` or `develop`.

- `develop` is the integration branch. All day-to-day work happens on a `feature/*` branch
  cut **from `develop`**, e.g. `feature/mobile-watchlist`, `feature/mobile-i18n-setup`,
  `feature/order-book-animations`. PR back into `develop`, squash merge.
- `main` only ever receives merges from a `release/*` or `hotfix/*` branch — never a
  feature branch directly, and never a direct commit.
- `release/*` branches (e.g. `release/v1.0.0`) cut from `develop` when a set of features is
  ready to stabilize. Only bug fixes land on a release branch, no new feature work. On
  completion, merge into both `main` (tag it) and back into `develop`.
- `hotfix/*` branches (e.g. `hotfix/flashlist-rerender`) cut from `main` for an urgent fix
  to already-released code. Merge into both `main` (tag it) and `develop`.
- If you're not sure whether something is a `feature/*`, `release/*`, or `hotfix/*` — it's
  almost always `feature/*`, cut from `develop`. `release/*` and `hotfix/*` are for the
  specific stabilization/patch scenarios above, not a default choice.

## Non-negotiable architectural constraints

**Framework (ADR-M1):** Expo, Dev Client + Continuous Native Generation
(`npx expo prebuild`) — never Expo Go, never bare CLI. Scaffold on **SDK 57 specifically**,
not 56 (known Hermes memory regression affecting `react-native-reanimated`) and not
whatever beta is newest without re-checking its stability first (ADR §5 callout). `android/`
and `ios/` are generated, not committed.

**State management split (ADR-M2) — two tools, not one used for everything:**
- **Zustand**: WebSocket-driven market data (`marketStore`, keyed by symbol, not a fixed
  count), favourites (via `persist` middleware), connection status, search/UI state.
- **TanStack Query**: REST data (`/pairs/meta`) — caching, refetch, loading/error states.
- Do not fetch REST data with ad hoc `fetch` + Zustand state — that's the exact pattern
  TanStack Query was adopted to avoid as the REST surface grows.
- `marketStore.updatePair` sets `lastUpdatedAt` directly from the incoming payload field —
  **no client-side recomputation**. The backend's conflation tick is the single source of
  truth for that value.

**List rendering (ADR-M3):** FlashList for the watchlist, not FlatList. Combine with
`React.memo` on row components so cell recycling and Zustand's selector-scoping work
together.

**Animation (ADR-M4):** `react-native-reanimated`, UI-thread worklets — not the built-in
`Animated` API — for price-flash (green on increase, red on decrease) and order-book
bar-width transitions. This is the highest-leverage decision for staying smooth under
sustained update bursts; don't substitute a JS-thread animation approach.

**Persistence (ADR-M5):** MMKV via Zustand's `persist` middleware, for favourites, cached
last-known market state, and the manual language override (ADR-M9). Synchronous reads —
this is what avoids a flash of incorrect state on launch.

**WebSocket client (ADR-M6) — no heartbeat, ever:**
- Custom `useWebSocket` hook. Exponential backoff with jitter (1s → 2s → 4s → 8s, capped
  30s) for reconnection.
- Liveness is inferred from **broadcast silence**, not a ping/pong exchange:
  `STALE_CONNECTION_TIMEOUT_MS` (~1000ms default) is documented as a multiple of the
  backend's `BROADCAST_INTERVAL_MS` (`MAX_CONSECUTIVE_SKIPS × BROADCAST_INTERVAL_MS`).
  If no message arrives within that window, treat the connection as dead.
- **Do not add a client-side ping/pong message.** This was evaluated and explicitly
  rejected — the data stream already answers "is this connection alive." Adding one is
  scope creep relative to the spec, not a missing feature.
- App-state awareness: pause the connection when backgrounded, reconnect on foreground.
- Explicit status enum: `CONNECTING | CONNECTED | DISCONNECTED | RECONNECTING`.
- **Validate every incoming message** against the mirrored Zod schema in
  `src/contracts/schemas.ts` before it reaches `marketStore.updatePair`. A message that
  fails validation is logged (dev-only) and dropped, never thrown or applied — this is what
  satisfies the assignment's "appropriate error handling" requirement on the live-data path
  (ADR-M6, v8.1 addition).

**Offline strategy (ADR-M7):** stale data stays visible when disconnected (don't clear the
store on disconnect); connection status is always shown; reconnection is automatic. MMKV
caches last-known state so cold launch never shows an empty screen. Do not build a full
offline-sync/historical-data mode — explicitly out of scope.

**Error boundary (ADR-M6, v8.1 addition):** `app.tsx` wraps the navigator in a single
top-level React error boundary (`componentDidCatch`) with a minimal, localized fallback
screen — no per-screen boundaries. A rendering bug degrades to a recoverable fallback, not
a native crash. No new dependency required for this.

**Target platform — Android Emulator is the required, not optional, verification target
(assignment §1).** Build and run via `npx expo run:android` and confirm the app end-to-end
on the Android Emulator before considering any mobile phase "done" — don't defer this to
just before recording the screen capture. iOS Simulator support is optional and doesn't
substitute for it.

**Project structure (ADR-M8) — feature-first with a small, disciplined `core/` layer:**
```
src/
├── contracts/        # Mirrored from backend's contracts/ — see ADR-X1. Don't hand-edit
│                        without updating the mirror check.
├── core/              # ONLY what 2+ features genuinely need — the "two-or-more-features test"
│   ├── domain/models/           # MarketData (incl. lastUpdatedAt), OrderBook, TradingPair
│   ├── domain/repositories/     # IMarketRepository — subscription-based (WS is a push stream,
│   │                              not a fetchable resource; don't make this promise-returning)
│   ├── data/                    # MarketRepository impl, WebSocketSource, RestSource, mappers
│   ├── components/              # PriceText, ChangeBadge, ConnectionIndicator, LastUpdatedLabel,
│   │                              UntrackedFavouriteBadge — presentation-only, no feature logic
│   ├── i18n/                    # i18next init, locales/en/*.json namespaced per feature
│   ├── theme/ utils/ api/ hooks/ storage/
├── features/
│   ├── watchlist/       # "Markets" screen (presentation only — composes core/). No Figma
│   │                      frame exists for this one — built fresh from design-tokens.md.
│   ├── market-details/  # "Terminal" screen (presentation only — composes core/). Built to
│   │                      Figma's "Trading Terminal" frame at full fidelity (ADR-M10).
│   │                      Includes AccountDrawer.tsx — per Figma, the account drawer is
│   │                      nested inside the Trading Terminal frame, opened from Terminal's
│   │                      own hamburger button, NOT part of telemetry-settings/.
│   ├── telemetry-settings/ # "Telemetry & Settings" screen only (presentation only). Not an
│   │                          assignment requirement — built per ADR-M10's explicit fidelity
│   │                          decision. Real data where cheap (WS rate, FPS), display-only
│   │                          elsewhere — see specs/mobile-screens.md.
│   └── favourites/    # domain/ + data/ + presentation/ — genuinely feature-scoped.
│                         IFavouritesRepository lives HERE, not in core/, because nothing
│                         else needs it. Export state via index.ts's useFavourites() —
│                         other features/screens must never import favourites/data or
│                         favourites/domain directly.
├── store/uiStore.ts    # cross-feature global UI state ONLY — isOnline, activeTab, activeLocale
├── navigation/
└── app.tsx
```
- Before adding anything to `core/`, apply the two-or-more-features test: does a second
  feature genuinely need this? If not, it belongs inside the one feature that needs it.
- Every feature exposes its public surface through `index.ts` (barrel export). Reaching
  into another feature's internals (`features/favourites/data/...` from outside
  `favourites/`) is not allowed — go through the barrel.
- Untracked-favourite handling: `WatchlistScreen` merges `core/data`'s
  `MarketRepository.getTrackedPairs()` with `features/favourites`'s `useFavourites()`. A
  favourited pair outside the tracked set still renders, via
  `core/components/UntrackedFavouriteBadge`, localized — never hidden, never a crash.

**Internationalization (ADR-M9) — every user-facing string, no exceptions:**
- `i18next` + `react-i18next` + `expo-localization`. Namespaced JSON per feature
  (`common.json`, `watchlist.json`, `market-details.json`, `favourites.json`).
- Do not hardcode any user-facing string directly in JSX — route it through
  `react-i18next`, even though only English ships. This is enforced from the first screen
  built, not retrofitted at the end.
- Number/date formatting uses `Intl.NumberFormat` / `Intl.DateTimeFormat` with the active
  locale — not hardcoded formatting. `core/utils/formatPrice.ts`, `formatPercent.ts`,
  `LastUpdatedLabel` all go through `Intl`, never manual string interpolation of numbers.
- Manual language override persists via MMKV, reusing the favourites persistence pattern.

**Contracts (ADR-X1):** `src/contracts/` is a mirrored copy of the backend's
`contracts/schemas.ts`. CI diffs it against the backend's raw GitHub URL
(`raw.githubusercontent.com/PathmikaW/pulsecrypto-backend/main/contracts/schemas.ts`) and
fails the build on drift. If a screen needs a field that isn't in the mirror yet, that's a
backend contract change to request, not something to invent locally.

## Tech stack (verify exact patch versions at scaffold time — see ADR §5)

Expo SDK 57 (RN 0.86, React 19.2) · pnpm (package manager, ADR-X5) · TypeScript 5.9.x ·
React Navigation 7.x (Native Stack) · Zustand 5.x · TanStack Query 5.102.x · FlashList v2.x ·
react-native-reanimated (install via `npx expo install`, do not pin independently) ·
`react-native-mmkv` 3.x (via `npx expo install`) · i18next + react-i18next (plain
`pnpm add`) + expo-localization (via `npx expo install`) · Jest 30.x + React Native
Testing Library 13.x

**Install rule:** anything with native code (`react-native-reanimated`, `react-native-mmkv`,
`expo-localization`) goes through `npx expo install <package>`, never plain `pnpm add` —
Expo resolves the SDK-compatible version; plain semver ranges won't catch an incompatible
native module until a build fails.

## Testing (ADR §8)

- Unit (Jest): Zustand stores (incl. dynamic pair membership), mappers, locale-aware
  `formatPrice`/`formatPercent`, `core/`/`favourites/` repository impls against mocked
  sources, the `useWebSocket` broadcast-silence timeout logic.
- Component (RNTL): `PairRow`, price-flash behavior, `ConnectionIndicator`,
  `LastUpdatedLabel`, `UntrackedFavouriteBadge`, the watchlist/favourites merge logic, and
  key screens rendered under a **non-English mocked locale** (this is what catches a
  hardcoded string that bypassed translation — don't skip it).

## Git workflow (ADR-X2)

Conventional Commits (`feat(mobile): ...`, `fix(mobile): ...`, `test(mobile): ...`).
Three-stage Husky pipeline identical to the backend: `pre-commit` (lint-staged),
`commit-msg` (commitlint), `pre-push` (`tsc --noEmit` + full test suite). Do not bypass
with `--no-verify` unless the user explicitly says to for that specific commit.

## Working method

1. Confirm a spec exists in `specs/` for what you're about to build. If not, write it
   first, referencing the relevant ADR-M* section and the Figma screen it corresponds to.
2. Implement against the spec, matching the Figma mockup for layout/visual detail.
3. Write tests derived from the spec's stated behavior, including a non-English-locale
   render check for any new screen.
4. Verify directly before calling anything done — run the typecheck/lint/test suite
   yourself, don't just eyeball the code (ADR-X6).
5. Review the diff (`git status`/`git diff`), then commit with a conventional-format
   message — no AI attribution trailer. Never push or merge; that's the user's alone.
6. **Always end by giving the user exact terminal commands to independently verify what
   was just built** (install/typecheck/test, and a manual check — e.g. what to tap/see in
   the running app — if one makes sense for the feature) — don't just assert it works,
   hand them the means to confirm it themselves, every time, not only when asked.
7. If something in the spec or ADR seems wrong or you want to deviate, say so and wait —
   don't implement your own alternative silently.
