import { memo, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import type { OrderBookLevel } from '../../../core/domain/models/OrderBook';
import { colors, spacing, typography } from '../../../core/theme';
import { getCachedNumberFormat } from '../../../core/utils/intlFormatterCache';

const DISPLAY_DEPTH = 10; // rows shown per side - a display choice, independent of the
// backend's ORDER_BOOK_PRESSURE_DEPTH (which happens to also default to 10)

function formatOrderBookNumber(value: number, locale: string, fractionDigits: number): string {
  // Order book cells are plain grouped numbers, no currency symbol (verified against the
  // Figma file's own "64,239.50" style — only the main price ticker gets a "$"). Cached
  // formatter (ADR-M10 perf pass) - this runs up to 60x/tick across the visible rows.
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

// Bids section first, then Asks — each with its own header row, matching the Figma file's
// actual structure exactly (two distinct "Bids Section"/"Asks Section" frames, not one
// shared header over a single combined list).
export function OrderBookView({ bids, asks, baseAsset }: OrderBookViewProps) {
  // Memoized, keyed on the bids/asks array refs themselves - skips the slice/map/Math.max
  // work on a re-render that isn't actually caused by new order book data (e.g. a language
  // or baseAsset change bubbling down through the parent). Doesn't reduce work on a genuine
  // WS-driven update (bids/asks are new refs every tick by design), only on the incidental
  // re-renders layered on top of that steady 100ms cadence.
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
    // The hairline is this row's own top border, not a separate line floating above it
    // with a gap (was: a standalone divider View before the whole OrderBookView, which
    // read as disconnected from the row it was meant to introduce).
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  // text.numeric (#C6C6CB) - verified value, not text.primary/white as tried earlier.
  headerCell: { flex: 1, color: colors.text.numeric, ...typography.labelCaps, textAlign: 'right' },
  priceHeaderCell: { textAlign: 'left' },
  // Fixed left inset, not textAlign:'center' - centering makes each row's own starting
  // digit drift depending on that value's own text width (a longer/shorter quantity
  // starts at a different x than its neighbors), so rows don't line up with each other or
  // with this header's "A". A shared paddingLeft on both this and amountCell keeps every
  // row's first digit at the exact same x as "A", while still reading as a roughly
  // centered column rather than flush against PRICE like a plain left-align would.
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
