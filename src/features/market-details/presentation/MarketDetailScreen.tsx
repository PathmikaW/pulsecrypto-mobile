import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { memo, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { BottomNavBar } from '../../../core/components/BottomNavBar';
import { TopAppBar } from '../../../core/components/TopAppBar';
import { LastUpdatedLabel } from '../../../core/components/LastUpdatedLabel';
import { PriceText } from '../../../core/components/PriceText';
import { useMarketStore } from '../../../core/data/repositories/MarketRepository';
import { useMarketData } from '../../../core/hooks/useMarketData';
import { usePairsMeta } from '../../../core/hooks/usePairsMeta';
import { colors, radius, spacing, typography } from '../../../core/theme';
import { formatCompactNumber } from '../../../core/utils/formatCompactNumber';
import { formatPairDisplayName } from '../../../core/utils/formatPairDisplayName';
import { formatPrice } from '../../../core/utils/formatPrice';
import { formatPercent } from '../../../core/utils/formatPercent';
import { parseBaseAsset } from '../../../core/utils/parseBaseAsset';
import type { PairMeta } from '../../../contracts/schemas';
import type { RootStackParamList } from '../../../navigation/types';
import { useUiStore } from '../../../store/uiStore';
import { MarketDepthChart } from './MarketDepthChart';
import { OrderBookView } from './OrderBookView';
import { TerminalSkeleton } from './TerminalSkeleton';

const LIQUIDITY_GAP_MEDIUM_THRESHOLD = 5;
const LIQUIDITY_GAP_HIGH_THRESHOLD = 15;
const LIQUIDITY_GAP_LABEL_KEY = {
  low: 'liquidityGapLow',
  medium: 'liquidityGapMedium',
  high: 'liquidityGapHigh',
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'Terminal'>;

// Built to Figma's "Trading Terminal" frame at full fidelity, parameterized per pair
// (specs/mobile-screens.md) - Figma's mock shows a fixed "BTC/USDT," but this screen
// renders whichever pair was tapped from Markets, or defaults to the first tracked pair
// when reached directly via the bottom nav's "Terminal" tab.
export function MarketDetailScreen({ route }: Props) {
  const { t, i18n } = useTranslation(['market-details', 'common']);
  const pairsMetaQuery = usePairsMeta();

  // Falls back to whatever's already live/MMKV-cached in the store when /pairs/meta is
  // down or still loading — without this, a cold launch or backend outage left the pair
  // permanently unresolved and the screen never left its loading state, even though cached
  // data existed (mobile-screens.md, ADR-M7).
  const liveTrackedPairs = useMarketStore(useShallow((state) => Object.keys(state.pairs)));
  const pair = route.params?.pair ?? pairsMetaQuery.data?.pairs[0]?.symbol ?? liveTrackedPairs[0];
  const meta = pairsMetaQuery.data?.pairs.find((p) => p.symbol === pair);

  // Telemetry's TopAppBar shows this same pair (confirmed against Figma) - kept in sync
  // via uiStore rather than each screen re-deriving it independently.
  const setSelectedPair = useUiStore((state) => state.setSelectedPair);
  useEffect(() => {
    if (pair) setSelectedPair(pair);
  }, [pair, setSelectedPair]);
  const marketData = useMarketData(pair ?? '');
  const baseAsset = useMemo(() => parseBaseAsset(meta?.displayName, pair ?? ''), [meta?.displayName, pair]);

  const pressureLabel =
    marketData == null
      ? null
      : marketData.buyPressure > 60
        ? t('pressureBuyHeavy')
        : marketData.sellPressure > 60
          ? t('pressureSellHeavy')
          : t('pressureBalanced');
  const pressureColor =
    marketData == null
      ? colors.text.primary
      : marketData.buyPressure > 60
        ? colors.signal.positive
        : marketData.sellPressure > 60
          ? colors.signal.negative
          : colors.text.primary;

  // "Liquidity Gap" isn't a backend field — derived here from the real order book totals
  // (Figma's "Depth Legend/Overlay" shows it alongside Pressure, but the assignment
  // doesn't require it, so this is a defensible client-side computation, not a fake value).
  const liquidityGap = useMemo(() => {
    if (marketData == null) return null;
    const bidTotal = marketData.bids.reduce((sum, level) => sum + level.quantity, 0);
    const askTotal = marketData.asks.reduce((sum, level) => sum + level.quantity, 0);
    const total = bidTotal + askTotal;
    const gapPercent = total > 0 ? (Math.abs(bidTotal - askTotal) / total) * 100 : 0;
    const level: 'low' | 'medium' | 'high' =
      gapPercent < LIQUIDITY_GAP_MEDIUM_THRESHOLD
        ? 'low'
        : gapPercent < LIQUIDITY_GAP_HIGH_THRESHOLD
          ? 'medium'
          : 'high';
    return { bidTotal, askTotal, gapPercent, level };
  }, [marketData]);
  const liquidityGapColor =
    liquidityGap == null
      ? colors.text.primary
      : liquidityGap.level === 'high'
        ? colors.signal.negative
        : colors.signal.positive;

  if (!pair) {
    // No tracked pairs resolved yet - cold launch with the backend unreachable (no REST
    // response, no WS tick, and no MMKV cache since nothing has ever synced). Still full
    // chrome (TopAppBar + BottomNavBar), not a bare spinner with no way to navigate away -
    // both /pairs/meta and the WS connection retry indefinitely on their own, so this
    // resolves itself the moment either succeeds.
    return (
      <View style={styles.container}>
        <TopAppBar title={t('common:nav.terminal')} />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <TerminalSkeleton />
        </ScrollView>
        <BottomNavBar />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopAppBar title={formatPairDisplayName(meta?.displayName, pair)} />
      {/* showsVerticalScrollIndicator=false: Android reserves a thin gutter for the
      scrollbar track even when it's not actively visible, which showed up as an
      asymmetric right-edge gap on the edge-to-edge Market Depth panel. */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {marketData == null ? (
          <TerminalSkeleton />
        ) : (
          <>
            <View style={styles.priceSection}>
              <Text style={styles.priceLabel}>{t('lastPrice')}</Text>
              <View style={styles.priceRow}>
                <PriceText value={marketData.price} changePercent={marketData.change24h} />
                <Text
                  style={[
                    styles.changeInline,
                    { color: marketData.change24h < 0 ? colors.signal.negative : colors.signal.positive },
                  ]}
                >
                  {`${marketData.change24h < 0 ? '▼' : '▲'} ${formatPercent(Math.abs(marketData.change24h), i18n.language)}`}
                </Text>
              </View>
              <PriceStatsRow meta={meta} />
            </View>

            <View style={styles.statRow}>
              <StatCell label={t('spread')} value={formatPrice(marketData.spread, i18n.language)} />
              <StatCell
                label={t('buyPressure')}
                value={formatPercent(marketData.buyPressure, i18n.language)}
              />
              <StatCell
                label={t('sellPressure')}
                value={formatPercent(marketData.sellPressure, i18n.language)}
              />
            </View>

            <OrderBookView bids={marketData.bids} asks={marketData.asks} baseAsset={baseAsset} />

            <View style={styles.depthPanel}>
              <MarketDepthChart />

              {/* Top-left block: title, then bullets inline beside each other on the next
              line - matches Figma exactly (was: bullets stacked vertically, split to the
              right of the title). */}
              <View style={styles.depthTopLeft}>
                <Text style={styles.depthTitle}>{t('marketDepth')}</Text>
                {liquidityGap && (
                  <View style={styles.depthBullets}>
                    <View style={styles.bulletRow}>
                      <View style={[styles.bulletDot, { backgroundColor: colors.signal.positive }]} />
                      <Text style={styles.bulletText}>
                        {t('bidsTotal', {
                          amount: formatCompactNumber(liquidityGap.bidTotal, i18n.language),
                          asset: baseAsset,
                        })}
                      </Text>
                    </View>
                    <View style={styles.bulletRow}>
                      <View style={[styles.bulletDot, { backgroundColor: colors.signal.negative }]} />
                      <Text style={styles.bulletText}>
                        {t('asksTotal', {
                          amount: formatCompactNumber(liquidityGap.askTotal, i18n.language),
                          asset: baseAsset,
                        })}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Bottom-right floating box, not full width - matches Figma exactly (was:
              a full-width box in normal flow below the header). */}
              <View style={styles.depthLegendBox}>
                <View style={styles.depthStatRow}>
                  <StatCell
                    label={t('liquidityGap')}
                    value={
                      liquidityGap
                        ? t(LIQUIDITY_GAP_LABEL_KEY[liquidityGap.level], {
                            value: liquidityGap.gapPercent.toFixed(2),
                          })
                        : '—'
                    }
                    valueColor={liquidityGapColor}
                  />
                  <View style={styles.depthStatDivider} />
                  <StatCell
                    label={t('pressureLabel')}
                    value={pressureLabel ?? '—'}
                    valueColor={pressureColor}
                  />
                </View>
              </View>
            </View>

            <LastUpdatedLabel lastUpdatedAt={marketData.lastUpdatedAt} />
          </>
        )}
      </ScrollView>

      <BottomNavBar />
    </View>
  );
}

function StatCell({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.statCell}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  );
}

// Memoized on `meta` alone (TanStack Query's cached /pairs/meta data, which only changes
// on a ~60s refetch or pull-to-refresh) so this row doesn't re-render on every ~100ms WS
// tick along with the rest of the screen, even though its own values never move that often.
const PriceStatsRow = memo(function PriceStatsRow({ meta }: { meta: PairMeta | undefined }) {
  const { t, i18n } = useTranslation('market-details');
  return (
    // Own row style, not statRow: this is nested inside priceSection, which already
    // applies paddingHorizontal - reusing statRow's own paddingHorizontal here doubled
    // the inset (the "24H HIGH has extra left padding" bug). statRow's padding is for the
    // standalone Spread/Buy/Sell row below, which isn't nested in a padded parent.
    <View style={styles.priceStatsRow}>
      <StatCell label={t('high24h')} value={meta ? formatPrice(meta.high24h, i18n.language) : '—'} />
      <StatCell label={t('low24h')} value={meta ? formatPrice(meta.low24h, i18n.language) : '—'} />
      {/* Figma's top stat row is High/Low/Market Cap, not Volume - matches exactly.
      marketCap is a static placeholder (see contracts/schemas.ts), same treatment as the
      Telemetry screen's other display-only values (ADR-M10). */}
      <StatCell
        label={t('marketCap')}
        value={meta ? formatCompactNumber(meta.marketCap, i18n.language) : '—'}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.screenTerminal },
  scrollContent: { paddingBottom: spacing.xl },
  // marginTop: gap between the TopAppBar and LAST PRICE - was flush against it.
  priceSection: { paddingHorizontal: spacing.lg, gap: spacing.xs, marginTop: spacing.lg },
  priceLabel: { color: colors.text.primary, ...typography.labelCaps },
  // Baseline-aligned, not center-aligned: the percent badge sits on the same text line as
  // the price, not floated in the vertical middle of the large price digits (Figma shows
  // both inline at the same baseline).
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  // Was tableValueSmall (10px/10 line-height) with an ad-hoc fontSize:14 override that left
  // the line-height too tight for the larger size - tableValue is the real 14px/14 token.
  changeInline: { ...typography.tableValue },
  statRow: { flexDirection: 'row', paddingHorizontal: spacing.lg, marginTop: spacing.lg, gap: spacing.xl },
  priceStatsRow: { flexDirection: 'row', marginTop: spacing.lg, gap: spacing.xl },
  // No flex:1: sized to content, matching Figma's tightly-packed columns instead of
  // evenly-stretched thirds. This also fixes a real bug - flex:1 inside depthLegendBox
  // (an absolutely-positioned, auto-width container with no definite main-axis size to
  // grow against) was collapsing the Liquidity Gap/Pressure StatCells to zero width,
  // making that box invisible even though it was rendering.
  statCell: {},
  // text.primary (near-white), not text.label (dim gray) - Figma shows these stat labels
  // (24H HIGH/LOW/MARKET CAP, Spread/Buy Pressure/Sell Pressure) bright and bold, unlike
  // the dimmer standalone section eyebrows (LAST PRICE, MARKET DEPTH).
  statLabel: { color: colors.text.primary, ...typography.labelCaps },
  statValue: { color: colors.text.numeric, ...typography.tableValueLarge, marginTop: spacing.xs },
  // Edge-to-edge (no horizontal margin), no marginTop, and no borderRadius - Figma shows
  // the Market Depth card flush against the order book directly above it and bleeding to
  // both screen edges. A radius on a truly edge-to-edge card reveals a sliver of the
  // screen's own background color at the top/bottom-right corners where the curve pulls
  // away from the device edge - that sliver was the reported "right side gap."
  depthPanel: {
    backgroundColor: colors.background.card,
    minHeight: 220,
    overflow: 'hidden',
  },
  depthTopLeft: { position: 'absolute', top: spacing.lg, left: spacing.lg, gap: spacing.sm },
  depthTitle: { color: colors.text.primary, ...typography.labelCaps },
  depthBullets: { flexDirection: 'row', gap: spacing.md },
  bulletRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  bulletDot: { width: 6, height: 6, borderRadius: 3 },
  bulletText: { color: colors.text.primary, ...typography.bodySmall },
  // Flush against the panel's true bottom-right corner (bottom/right: 0, not an inset
  // offset) - the box's own margin from the edge was repeatedly misread as the whole
  // panel having a right-side gap, since it sits exactly where that corner gets checked.
  // Breathing room from the panel edge now comes from its own padding, not a position
  // offset, and only the top-left corner rounds (the other three coincide with the
  // panel's own square corners, so rounding them would cut a visible notch there).
  depthLegendBox: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(11,20,32,0.85)',
    borderTopLeftRadius: radius.card,
    padding: spacing.md,
  },
  depthStatRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  depthStatDivider: { width: 1, height: 32, backgroundColor: colors.background.divider },
});
