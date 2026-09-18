import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import type { OrderBookLevel } from '../../../core/domain/models/OrderBook';
import { colors, spacing, typography } from '../../../core/theme';
import { formatPrice } from '../../../core/utils/formatPrice';

const DISPLAY_DEPTH = 10; // rows shown per side - a display choice, independent of the
// backend's ORDER_BOOK_PRESSURE_DEPTH (which happens to also default to 10)

interface OrderBookRowProps {
  level: OrderBookLevel;
  maxQuantity: number;
  side: 'bid' | 'ask';
}

// Quantity bar width animates smoothly on change via reanimated (ADR-M4) - not an instant
// re-layout - visualizing relative depth within the currently-displayed rows.
function OrderBookRow({ level, maxQuantity, side }: OrderBookRowProps) {
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
      <Text style={[styles.cell, styles.priceCell]}>{formatPrice(level.price, i18n.language)}</Text>
      <Text style={styles.cell}>{level.quantity.toFixed(5)}</Text>
      <Text style={styles.cell}>{(level.price * level.quantity).toFixed(2)}</Text>
    </View>
  );
}

interface OrderBookViewProps {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  baseAsset: string;
}

export function OrderBookView({ bids, asks, baseAsset }: OrderBookViewProps) {
  const { t } = useTranslation('market-details');
  const visibleBids = bids.slice(0, DISPLAY_DEPTH);
  const visibleAsks = asks.slice(0, DISPLAY_DEPTH);
  const maxBidQuantity = Math.max(0, ...visibleBids.map((l) => l.quantity));
  const maxAskQuantity = Math.max(0, ...visibleAsks.map((l) => l.quantity));

  return (
    <View>
      <Text style={styles.sectionTitle}>{t('orderBook')}</Text>
      <View style={styles.header}>
        <Text style={[styles.headerCell, styles.priceCell]}>{t('priceHeader')}</Text>
        <Text style={styles.headerCell}>{t('amountHeader', { asset: baseAsset })}</Text>
        <Text style={styles.headerCell}>{t('totalHeader')}</Text>
      </View>
      {visibleAsks.map((level) => (
        <OrderBookRow key={`ask-${level.price}`} level={level} maxQuantity={maxAskQuantity} side="ask" />
      ))}
      {visibleBids.map((level) => (
        <OrderBookRow key={`bid-${level.price}`} level={level} maxQuantity={maxBidQuantity} side="bid" />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color: colors.text.primary,
    ...typography.labelCaps,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    backgroundColor: colors.background.tableHeader,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  headerCell: { flex: 1, color: colors.text.label, ...typography.labelCaps, textAlign: 'right' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  bar: { position: 'absolute', left: 0, top: 0, bottom: 0, opacity: 0.15 },
  cell: { flex: 1, color: colors.text.numeric, ...typography.tableValue, textAlign: 'right' },
  priceCell: { textAlign: 'left' },
});
