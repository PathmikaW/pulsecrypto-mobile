import { memo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import type { OrderBookLevel } from '../../../core/domain/models/OrderBook';
import { colors, spacing, typography } from '../../../core/theme';

const DISPLAY_DEPTH = 10; // rows shown per side - a display choice, independent of the
// backend's ORDER_BOOK_PRESSURE_DEPTH (which happens to also default to 10)

function formatOrderBookNumber(value: number, locale: string, fractionDigits: number): string {
  // Order book cells are plain grouped numbers, no currency symbol (verified against the
  // Figma file's own "64,239.50" style — only the main price ticker gets a "$").
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

interface OrderBookRowProps {
  level: OrderBookLevel;
  maxQuantity: number;
  side: 'bid' | 'ask';
}

// Quantity bar width animates smoothly on change via reanimated (ADR-M4) - not an instant
// re-layout - visualizing relative depth within the currently-displayed rows. Memoized
// with a value-based comparator (not the default reference check, since `level` is a new
// object every WS tick even when its price/quantity are unchanged) so a row whose own
// values didn't move this tick skips re-rendering — real work at 8 pairs x 10 ticks/sec.
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
      <Text style={styles.headerCell}>{t('amountHeader', { asset: baseAsset })}</Text>
      <Text style={styles.headerCell}>{t('totalHeader')}</Text>
    </View>
  );
}

interface OrderBookViewProps {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  baseAsset: string;
}

// Bids section first, then Asks — each with its own header row, matching the Figma file's
// actual structure exactly (two distinct "Bids Section"/"Asks Section" frames, not one
// shared header over a single combined list).
export function OrderBookView({ bids, asks, baseAsset }: OrderBookViewProps) {
  const { t } = useTranslation('market-details');
  const visibleBids = bids.slice(0, DISPLAY_DEPTH);
  const visibleAsks = asks.slice(0, DISPLAY_DEPTH);
  const maxBidQuantity = Math.max(0, ...visibleBids.map((l) => l.quantity));
  const maxAskQuantity = Math.max(0, ...visibleAsks.map((l) => l.quantity));

  return (
    <View>
      <Text style={styles.sectionTitle}>{t('orderBook')}</Text>

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
  priceHeaderCell: { textAlign: 'left' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  bar: { position: 'absolute', left: 0, top: 0, bottom: 0, opacity: 0.15 },
  priceCell: { flex: 1, ...typography.tableValue, textAlign: 'left' },
  bidColor: { color: colors.signal.positive },
  askColor: { color: colors.signal.negative },
  amountCell: { flex: 1, color: colors.text.primary, ...typography.tableValue, textAlign: 'right' },
  totalCell: { flex: 1, color: colors.text.numeric, ...typography.tableValue, textAlign: 'right' },
});
