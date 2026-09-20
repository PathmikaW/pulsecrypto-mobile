# Design Tokens — Extracted from Figma (verified via API, not approximated)

**Source:** pulled directly from the Figma file's REST API (`GET /v1/files/:key` and
`/nodes`) on 2026-09-17, file key `JYfr5h2vC9IFKtX3vasmZk`, using a personal access token
with `file_content:read` scope. Every value below is a real fill/text-style/layout property
read from the file, traced to the specific node it belongs to — not a visual guess from a
screenshot. Where a value's exact semantic role is inferred rather than directly labeled in
Figma, that's called out explicitly.

Implement these as actual token modules — `core/theme/colors.ts`,
`core/theme/typography.ts`, `core/theme/spacing.ts` — and have every component reference
them. No component hardcodes a raw hex, font size, or spacing number inline (same
"named constant, not a literal" discipline as `ORDER_BOOK_PRESSURE_DEPTH`, ADR-B5).

## Colors

**Background (elevation scale — darkest to lightest):**

| Token                        | Hex       | Verified role                                                             |
| ---------------------------- | --------- | ------------------------------------------------------------------------- |
| `background.screenTerminal`  | `#0B1420` | Root fill of the "Trading Terminal" screen                                |
| `background.screenTelemetry` | `#0B0E14` | Root fill of the "Telemetry & Settings" screen                            |
| `background.navBar`          | `#141C28` | BottomNavBar fill (both screens); Aside drawer's profile header section   |
| `background.recessed`        | `#18202D` | Aside drawer's own panel fill; TopAppBar's "LIVE" badge container         |
| `background.card`            | `#1E2633` | Bento grid card fills (Data Throttling, Telemetry Dashboard, micro-cards) |
| `background.tableHeader`     | `#222A37` | Order book Bids/Asks table header row (`Overlay+HorizontalBorder`)        |
| `background.divider`         | `#2D3543` | Depth-legend panel, toggle-off state, borders/dividers                    |

`screenTerminal` and `screenTelemetry` are two distinct-but-nearly-identical values in the
source file (a one-off inconsistency in the mockup, not a deliberate two-token system) —
implement both exactly as found rather than silently unifying them to one value, per the
"build what's provided 100% accurately" instruction this spec follows.

**Text:**

| Token           | Hex       | Verified role                                                  |
| --------------- | --------- | -------------------------------------------------------------- |
| `text.primary`  | `#DBE3F4` | Primary text (headings, main values)                           |
| `text.numeric`  | `#C6C6CB` | Secondary/tabular numeric text (order book rows, stat values)  |
| `text.label`    | `#909095` | Uppercase small-caps labels ("PRICE (USDT)", "24H HIGH", etc.) |
| `text.onAccent` | `#FFFFFF` | White, used sparingly (icons, small badge borders)             |

**Signal (buy/positive vs sell/negative):**

| Token                  | Hex       | Verified role                                                                                                            |
| ---------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------ |
| `signal.positive`      | `#3FE092` | Bid row highlight overlay, "CONNECTED" badge fill, toggle-on fill, slider fill                                           |
| `signal.positiveDeep`  | `#00C479` | Deeper green — drawer profile avatar background                                                                          |
| `signal.positiveMuted` | `#004A2A` | Dark green badge fill (low-frequency; verify exact usage node visually if implementing the specific badge it appears on) |
| `signal.negative`      | `#EA295B` | Ask row highlight overlay, negative/sell pill backgrounds                                                                |
| `signal.negativeMuted` | `#FFB2BA` | Light pink — icon-overlay tint on one of the telemetry micro-cards                                                       |

The mapping "bid = green, ask = red" confirms the standard convention ADR-M4 assumed —
use `signal.positive` for price-up flashes and buy-side order book rows, `signal.negative`
for price-down flashes and sell-side rows.

## Typography

| Token                  | Family         | Weight | Size | Line height                                     | Verified role                                                                                              |
| ---------------------- | -------------- | ------ | ---- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `type.priceDisplay`    | JetBrains Mono | 700    | 32   | 38.4 (also seen at 32, treat 38.4 as canonical) | The large current-price display                                                                            |
| `type.tableValue`      | JetBrains Mono | 500    | 14   | 14                                              | Order book price/amount/total cells — the dominant numeric style (67 occurrences)                          |
| `type.tableValueSmall` | JetBrains Mono | 400    | 10   | 10                                              | Smaller mono text (micro-labels within cards)                                                              |
| `type.tableValueLarge` | JetBrains Mono | 500    | 16   | 16                                              | Slightly larger mono value (spot-check which element when implementing)                                    |
| `type.labelCaps`       | Inter          | 700    | 11   | 11                                              | Uppercase section/column labels ("PRICE (USDT)", "MARKET CAP") — the dominant label style (37 occurrences) |
| `type.body`            | Inter          | 400    | 14   | 21                                              | Body text                                                                                                  |
| `type.bodySmall`       | Inter          | 400    | 12   | 16.8                                            | Smaller body/caption text                                                                                  |
| `type.heading`         | Hanken Grotesk | 600    | 20   | 28                                              | Section headings (e.g. "System Settings & Telemetry")                                                      |
| `type.headingLarge`    | Hanken Grotesk | 700    | 32   | 38.4                                            | Largest display heading                                                                                    |

**Font family roles, stated plainly:** JetBrains Mono is used exclusively for numeric/
tabular data (prices, amounts, stats) — this is a deliberate monospace choice for column
alignment in a trading UI; don't substitute a proportional font for numeric displays.
Inter is used for UI labels and body text. Hanken Grotesk is used for headings only.

## Spacing & radius

Derived from actual auto-layout `padding*`/`itemSpacing` properties on real frames (not
estimated from bounding boxes):

**Spacing scale:** `4, 8, 12, 16, 24, 32` (px) — a standard 4/8px-based scale. Verified
usage: card internal padding = 24, section padding = 16, table row internal padding = 4–8,
badge/pill padding = 4×16 (vertical×horizontal), card-to-card gap in the bento grid = 24,
gap within the telemetry dashboard card = 32.

**Corner radius scale:** `2, 4, 8, 12` (px). Verified usage: buttons = 2, small badges/
panels (depth-legend overlay) = 4, cards (bento grid cards) = 8, nav pills/links = 12.

## What this does NOT cover

Exact vector icon paths, precise component states (hover/pressed/disabled), and a few
lower-confidence color-role mappings (flagged inline above) weren't fully resolved via the
API pull — reasonable to spot-check the specific node in Figma directly when implementing
the exact component they belong to, rather than block on getting 100% of every micro-detail
via API before starting. See `specs/mobile-screens.md` for the full screen inventory this
file's tokens apply to.
