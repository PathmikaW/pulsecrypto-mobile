import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { MarketDepthChart } from './MarketDepthChart';
import { OrderBookView } from './OrderBookView';

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
    // No tracked pairs resolved yet (cold launch, /pairs/meta still loading/failed)
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.signal.positive} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopAppBar title={formatPairDisplayName(meta?.displayName, pair)} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {marketData == null ? (
          <View style={styles.loadingSection}>
            <ActivityIndicator color={colors.signal.positive} />
            <Text style={styles.loadingText}>{t('loadingOrderBook')}</Text>
          </View>
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

            <View style={styles.depthPanel}>
              <MarketDepthChart />
              <View style={styles.depthHeaderRow}>
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
              <View style={styles.depthLegendBox}>
                <View style={styles.statRow}>
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
                  <StatCell
                    label={t('pressureLabel')}
                    value={pressureLabel ?? '—'}
                    valueColor={pressureColor}
                  />
                </View>
              </View>
            </View>

            <OrderBookView bids={marketData.bids} asks={marketData.asks} baseAsset={baseAsset} />

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
    <View style={styles.statRow}>
      <StatCell label={t('high24h')} value={meta ? formatPrice(meta.high24h, i18n.language) : '—'} />
      <StatCell label={t('low24h')} value={meta ? formatPrice(meta.low24h, i18n.language) : '—'} />
      <StatCell
        label={t('volume24h')}
        value={meta ? formatCompactNumber(meta.volume24h, i18n.language) : '—'}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.screenTerminal },
  scrollContent: { paddingBottom: spacing.xl },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background.screenTerminal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingSection: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl },
  loadingText: { color: colors.text.label, ...typography.bodySmall },
  priceSection: { paddingHorizontal: spacing.lg, gap: spacing.xs },
  priceLabel: { color: colors.text.label, ...typography.labelCaps },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  changeInline: { ...typography.tableValueSmall, fontSize: 14 },
  statRow: { flexDirection: 'row', paddingHorizontal: spacing.lg, marginTop: spacing.lg, gap: spacing.lg },
  statCell: { flex: 1 },
  statLabel: { color: colors.text.label, ...typography.labelCaps },
  statValue: { color: colors.text.numeric, ...typography.tableValueLarge, marginTop: spacing.xs },
  depthPanel: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    minHeight: 220,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  depthHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  depthTitle: { color: colors.text.label, ...typography.labelCaps },
  depthBullets: { gap: spacing.xs },
  bulletRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  bulletDot: { width: 6, height: 6, borderRadius: 3 },
  bulletText: { color: colors.text.primary, ...typography.bodySmall },
  depthLegendBox: {
    backgroundColor: 'rgba(11,20,32,0.75)',
    borderRadius: radius.card,
    padding: spacing.md,
  },
});
