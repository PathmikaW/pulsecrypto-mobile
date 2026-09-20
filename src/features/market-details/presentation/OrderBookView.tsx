import { memo, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import type { OrderBookLevel } from '../../../core/domain/models/OrderBook';
import { colors, spacing, typography } from '../../../core/theme';
import { getCachedNumberFormat } from '../../../core/utils/intlFormatterCache';

const DISPLAY_DEPTH = 10; // rows per side; a display choice independent of the backend's ORDER_BOOK_PRESSURE_DEPTH

function formatOrderBookNumber(value: number, locale: string, fractionDigits: number): string {
  // Plain grouped numbers, no currency symbol (only the main price ticker gets "$"); cached formatter since this runs ~60x/tick (ADR-M10).
  return getCachedNumberFormat(locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

interface OrderBookRowProps {
  level: OrderBookLevel;
  maxQuantity: number;
  side: 'bid' | 'ask';
}

// Bar width animates via reanimated (ADR-M4). The memo compares by value because `level` is a new object every tick,
// so rows whose values didn't move skip re-rendering.
function OrderBookRowComponent({ level, maxQuantity, side }: OrderBookRowProps) {
  const { i18n } = useTranslation();
  const barWidth = useSharedValue(0);

  useEffect(() => {
    barWidth.value = withTiming(maxQuantity > 0 ? (level.quantity / maxQuantity) * 100 : 0, {
      duration: 300,
    });
  }, [level.quantity, maxQuantity, barWidth]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value}%`,
    backgroundColor: side === 'bid' ? colors.signal.positive : colors.signal.negative,
  }));

  return (
    <View style={styles.row}>
      <Animated.View style={[styles.bar, barStyle]} />
      <Text style={[styles.priceCell, side === 'bid' ? styles.bidColor : styles.askColor]}>
        {formatOrderBookNumber(level.price, i18n.language, 2)}
      </Text>
      <Text style={styles.amountCell}>{formatOrderBookNumber(level.quantity, i18n.language, 5)}</Text>
      <Text style={styles.totalCell}>
        {formatOrderBookNumber(level.price * level.quantity, i18n.language, 2)}
      </Text>
    </View>
  );
}

const OrderBookRow = memo(
  OrderBookRowComponent,
  (prev, next) =>
    prev.level.price === next.level.price &&
    prev.level.quantity === next.level.quantity &&
    prev.maxQuantity === next.maxQuantity &&
    prev.side === next.side
);

function TableHeader({ baseAsset }: { baseAsset: string }) {
  const { t } = useTranslation('market-details');
  return (
    <View style={styles.header}>
      <Text style={[styles.headerCell, styles.priceHeaderCell]}>{t('priceHeader')}</Text>
      <Text style={[styles.headerCell, styles.amountHeaderCell]}>
        {t('amountHeader', { asset: baseAsset })}
      </Text>
      <Text style={styles.headerCell}>{t('totalHeader')}</Text>
    </View>
  );
}

interface OrderBookViewProps {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  baseAsset: string;
}

export function OrderBookView({ bids, asks, baseAsset }: OrderBookViewProps) {
  // Memoized on the bids/asks refs to skip work on incidental re-renders (e.g. a language change), not on new order book data.
  const { visibleBids, visibleAsks, maxBidQuantity, maxAskQuantity } = useMemo(() => {
    const bidsSlice = bids.slice(0, DISPLAY_DEPTH);
    const asksSlice = asks.slice(0, DISPLAY_DEPTH);
    return {
      visibleBids: bidsSlice,
      visibleAsks: asksSlice,
      maxBidQuantity: Math.max(0, ...bidsSlice.map((l) => l.quantity)),
      maxAskQuantity: Math.max(0, ...asksSlice.map((l) => l.quantity)),
    };
  }, [bids, asks]);

  return (
    <View>
      <TableHeader baseAsset={baseAsset} />
      {visibleBids.map((level) => (
        <OrderBookRow key={`bid-${level.price}`} level={level} maxQuantity={maxBidQuantity} side="bid" />
      ))}

      <TableHeader baseAsset={baseAsset} />
      {visibleAsks.map((level) => (
        <OrderBookRow key={`ask-${level.price}`} level={level} maxQuantity={maxAskQuantity} side="ask" />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    backgroundColor: colors.background.tableHeader,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerCell: { flex: 1, color: colors.text.numeric, ...typography.labelCaps, textAlign: 'right' },
  priceHeaderCell: { textAlign: 'left' },
  // Fixed left inset, not textAlign:'center': centering makes each row's first digit drift with its text width.
  amountHeaderCell: { textAlign: 'left', paddingLeft: spacing.xxl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  bar: { position: 'absolute', left: 0, top: 0, bottom: 0, opacity: 0.15 },
  priceCell: { flex: 1, ...typography.tableValue, textAlign: 'left' },
  bidColor: { color: colors.signal.positive },
  askColor: { color: colors.signal.negative },
  amountCell: {
    flex: 1,
    color: colors.text.primary,
    ...typography.tableValue,
    textAlign: 'left',
    paddingLeft: spacing.xxl,
  },
  totalCell: { flex: 1, color: colors.text.numeric, ...typography.tableValue, textAlign: 'right' },
});
