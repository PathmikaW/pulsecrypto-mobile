import { toAppError } from '../../../core/api/errors';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useIsFocused } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { memo, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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

type Props = BottomTabScreenProps<RootStackParamList, 'Terminal'>;

// Renders the pair tapped from Markets, or the first tracked pair when opened via the Terminal tab (specs/mobile-screens.md).
export function MarketDetailScreen({ route }: Props) {
  const { t, i18n } = useTranslation(['market-details', 'common']);
  const pairsMetaQuery = usePairsMeta();

  // Falls back to live/MMKV-cached store data when /pairs/meta is down or loading, so a cold launch never sticks on the loading state (ADR-M7).
  const liveTrackedPairs = useMarketStore(useShallow((state) => Object.keys(state.pairs)));
  const pair = route.params?.pair ?? pairsMetaQuery.data?.pairs[0]?.symbol ?? liveTrackedPairs[0];
  const meta = pairsMetaQuery.data?.pairs.find((p) => p.symbol === pair);

  // Telemetry's TopAppBar shows the same pair; kept in sync via uiStore.
  const setSelectedPair = useUiStore((state) => state.setSelectedPair);
  useEffect(() => {
    if (pair) setSelectedPair(pair);
  }, [pair, setSelectedPair]);
  // Bottom Tabs keeps this screen mounted, so pause subscriptions while unfocused instead of re-rendering the full tree on every WS tick (ADR-M11).
  const isFocused = useIsFocused();
  const marketData = useMarketData(pair ?? '', { enabled: isFocused });
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

  // Liquidity Gap isn't a backend field; it is derived client-side from the order book totals.
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
    // No pair resolved yet (cold launch, backend unreachable): keep the full chrome so the user can navigate; REST and WS retry on their own.
    return (
      <View style={styles.container}>
        <TopAppBar title={t('common:nav.terminal')} />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.waitingBanner}>
            <Text style={styles.waitingText}>{t('waitingForConnection')}</Text>
            {pairsMetaQuery.error ? (
              <Text style={styles.errorText}>{t(`common:${toAppError(pairsMetaQuery.error).i18nKey}`)}</Text>
            ) : null}
            <Pressable
              style={styles.retryButton}
              onPress={() => pairsMetaQuery.refetch()}
              disabled={pairsMetaQuery.isFetching}
            >
              <Text style={styles.retryText}>
                {pairsMetaQuery.isFetching ? t('common:connection.connecting') : t('retry')}
              </Text>
            </Pressable>
          </View>
          <TerminalSkeleton />
        </ScrollView>
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
            <View style={styles.priceInfoPanel}>
              <View style={styles.priceSection}>
                <Text style={styles.priceLabel}>{t('lastPrice')}</Text>
                <View style={styles.priceRow}>
                  <PriceText value={marketData.price} changePercent={marketData.change24h} />
                  <Text
                    style={[
                      styles.changeInline,
                      { color: marketData.change24h < 0 ? colors.signal.negative : colors.signal.positive },
                    ]}
                    numberOfLines={1}
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
            </View>

            <OrderBookView bids={marketData.bids} asks={marketData.asks} baseAsset={baseAsset} />

            <View style={styles.depthPanel}>
              <MarketDepthChart />

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

              <View style={styles.depthLegendBox}>
                <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
                <View style={[StyleSheet.absoluteFill, styles.depthLegendTint]} />
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

            <View style={styles.lastUpdatedWrap}>
              <LastUpdatedLabel lastUpdatedAt={marketData.lastUpdatedAt} />
            </View>
          </>
        )}
      </ScrollView>
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

// Memoized on `meta` (changes only on refetch) so it doesn't re-render on every WS tick.
const PriceStatsRow = memo(function PriceStatsRow({ meta }: { meta: PairMeta | undefined }) {
  const { t, i18n } = useTranslation('market-details');
  return (
    // Own row style, not statRow: statRow's paddingHorizontal would double the inset inside priceSection.
    <View style={styles.priceStatsRow}>
      <StatCell label={t('high24h')} value={meta ? formatPrice(meta.high24h, i18n.language) : '—'} />
      <StatCell label={t('low24h')} value={meta ? formatPrice(meta.low24h, i18n.language) : '—'} />
      <StatCell
        label={t('marketCap')}
        value={meta ? formatCompactNumber(meta.marketCap, i18n.language) : '—'}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.screenTerminal },
  lastUpdatedWrap: { marginTop: spacing.md, paddingHorizontal: spacing.lg },
  scrollContent: { paddingBottom: spacing.xl },
  waitingBanner: {
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xxl,
  },
  waitingText: { color: colors.text.label, ...typography.bodySmall, textAlign: 'center' },
  errorText: { color: colors.signal.negative, ...typography.bodySmall, textAlign: 'center' },
  retryButton: {
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.background.divider,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  retryText: { color: colors.signal.positive, ...typography.labelCaps },
  priceInfoPanel: { backgroundColor: colors.background.navBar, paddingBottom: spacing.lg },
  priceSection: { paddingHorizontal: spacing.lg, gap: spacing.xs, marginTop: spacing.xl },
  priceLabel: { color: colors.text.numeric, ...typography.labelCaps },
  // Baseline-aligned so the percent badge shares the price's text line.
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  // flexShrink: 0 stops the value wrapping onto a second line when the row is narrow.
  changeInline: { ...typography.tableValue, flexShrink: 0 },
  statRow: { flexDirection: 'row', paddingHorizontal: spacing.lg, marginTop: spacing.lg, gap: spacing.xl },
  priceStatsRow: { flexDirection: 'row', gap: spacing.xl },
  // No flex:1: inside the auto-width absolute depthLegendBox it collapses the cells to zero width.
  statCell: {},
  statLabel: { color: colors.text.numeric, ...typography.labelCaps },
  statValue: { color: colors.text.numeric, ...typography.tableValueLarge, marginTop: spacing.xs },
  // Edge-to-edge with no radius: a radius would expose the screen background at the corners.
  depthPanel: {
    backgroundColor: colors.background.card,
    minHeight: 220,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  depthTopLeft: { position: 'absolute', top: spacing.lg, left: spacing.lg, gap: spacing.sm },
  depthTitle: { color: colors.text.numeric, ...typography.labelCaps },
  depthBullets: { flexDirection: 'row', gap: spacing.md },
  bulletRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  bulletDot: { width: 6, height: 6, borderRadius: 3 },
  bulletText: { color: colors.text.primary, ...typography.bodySmall },
  // overflow:'hidden' clips the blur/tint layers to the rounded corners; padding doesn't affect the absolute-fill layers.
  depthLegendBox: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.depthLegend,
    borderRadius: radius.card,
    overflow: 'hidden',
    padding: spacing.lg,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  depthLegendTint: { backgroundColor: `${colors.background.divider}CC` },
  depthStatRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  depthStatDivider: { width: 1, height: 32, backgroundColor: colors.background.divider },
});
