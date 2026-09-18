import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BottomNavBar } from '../../../core/components/BottomNavBar';
import { ChangeBadge } from '../../../core/components/ChangeBadge';
import { ConnectionIndicator } from '../../../core/components/ConnectionIndicator';
import { LastUpdatedLabel } from '../../../core/components/LastUpdatedLabel';
import { PriceText } from '../../../core/components/PriceText';
import { useMarketStore } from '../../../core/data/repositories/MarketRepository';
import { useMarketData } from '../../../core/hooks/useMarketData';
import { usePairsMeta } from '../../../core/hooks/usePairsMeta';
import { colors, spacing, typography } from '../../../core/theme';
import { formatPrice } from '../../../core/utils/formatPrice';
import { formatPercent } from '../../../core/utils/formatPercent';
import { parseBaseAsset } from '../../../core/utils/parseBaseAsset';
import type { RootStackParamList } from '../../../navigation/types';
import { AccountDrawer } from './AccountDrawer';
import { OrderBookView } from './OrderBookView';

type Props = NativeStackScreenProps<RootStackParamList, 'Terminal'>;

// Built to Figma's "Trading Terminal" frame at full fidelity, parameterized per pair
// (specs/mobile-screens.md) - Figma's mock shows a fixed "BTC/USDT," but this screen
// renders whichever pair was tapped from Markets, or defaults to the first tracked pair
// when reached directly via the bottom nav's "Terminal" tab.
export function MarketDetailScreen({ route }: Props) {
  const { t, i18n } = useTranslation(['market-details', 'common']);
  const pairsMetaQuery = usePairsMeta();
  const [drawerOpen, setDrawerOpen] = useState(false);

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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Pressable onPress={() => setDrawerOpen(true)} hitSlop={12} accessibilityLabel={t('common:menu')}>
            <Ionicons name="menu" size={24} color={colors.text.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>{meta?.displayName ?? pair}</Text>
          <ConnectionIndicator />
        </View>

        {marketData == null ? (
          <View style={styles.loadingSection}>
            <ActivityIndicator color={colors.signal.positive} />
            <Text style={styles.loadingText}>{t('loadingOrderBook')}</Text>
          </View>
        ) : (
          <>
            <View style={styles.priceSection}>
              <PriceText value={marketData.price} />
              <ChangeBadge changePercent={marketData.change24h} />
              <View style={styles.statRow}>
                <StatCell
                  label={t('high24h')}
                  value={meta ? formatPrice(meta.high24h, i18n.language) : '—'}
                />
                <StatCell label={t('low24h')} value={meta ? formatPrice(meta.low24h, i18n.language) : '—'} />
                <StatCell
                  label={t('volume24h')}
                  value={meta ? meta.volume24h.toLocaleString(i18n.language) : '—'}
                />
              </View>
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
              <Text style={styles.depthTitle}>{t('marketDepth')}</Text>
              <Text style={styles.depthLegend}>{pressureLabel}</Text>
            </View>

            <OrderBookView bids={marketData.bids} asks={marketData.asks} baseAsset={baseAsset} />

            <LastUpdatedLabel lastUpdatedAt={marketData.lastUpdatedAt} />
          </>
        )}
      </ScrollView>

      <BottomNavBar />
      <AccountDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCell}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  headerTitle: { color: colors.text.primary, ...typography.heading },
  priceSection: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  statRow: { flexDirection: 'row', paddingHorizontal: spacing.lg, marginTop: spacing.lg, gap: spacing.lg },
  statCell: { flex: 1 },
  statLabel: { color: colors.text.label, ...typography.labelCaps },
  statValue: { color: colors.text.numeric, ...typography.tableValueLarge, marginTop: spacing.xs },
  depthPanel: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.background.card,
    borderRadius: 8,
    padding: spacing.lg,
  },
  depthTitle: { color: colors.text.label, ...typography.labelCaps },
  depthLegend: { color: colors.text.primary, ...typography.body, marginTop: spacing.xs },
});
