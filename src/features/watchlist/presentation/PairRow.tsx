import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChangeBadge } from '../../../core/components/ChangeBadge';
import { ConnectionIndicator } from '../../../core/components/ConnectionIndicator';
import { PriceText } from '../../../core/components/PriceText';
import { UntrackedFavouriteBadge } from '../../../core/components/UntrackedFavouriteBadge';
import { useMarketData } from '../../../core/hooks/useMarketData';
import { colors, spacing, typography } from '../../../core/theme';
import type { TradingPairSymbol } from '../../../core/domain/models/TradingPair';
import type { WatchlistRow } from './useWatchlist';

interface PairRowProps {
  row: WatchlistRow;
  onPress: (pair: TradingPairSymbol) => void;
  onToggleFavourite: (pair: TradingPairSymbol) => void;
  // Bottom Tabs keeps Watchlist mounted; unsubscribe while unfocused (ADR-M11, see useMarketData).
  isFocused: boolean;
}

// memo + per-pair subscription: a price update re-renders only its own row (ADR-M3).
function PairRowComponent({ row, onPress, onToggleFavourite, isFocused }: PairRowProps) {
  const { t } = useTranslation('favourites');
  const marketData = useMarketData(row.symbol, { enabled: isFocused });

  return (
    <Pressable style={styles.row} onPress={() => onPress(row.symbol)}>
      <View style={styles.leading}>
        <Text style={styles.symbol}>{row.displayName}</Text>
        <ConnectionIndicator />
      </View>

      <View style={styles.trailing}>
        {marketData ? (
          <>
            <PriceText value={marketData.price} style={styles.price} />
            <ChangeBadge changePercent={marketData.change24h} />
          </>
        ) : (
          <UntrackedFavouriteBadge />
        )}
      </View>

      <Pressable
        onPress={() => onToggleFavourite(row.symbol)}
        hitSlop={8}
        accessibilityLabel={t(row.isFavourite ? 'removeFavourite' : 'addFavourite')}
      >
        <Ionicons
          name={row.isFavourite ? 'star' : 'star-outline'}
          size={20}
          color={row.isFavourite ? colors.signal.positive : colors.text.label}
        />
      </Pressable>
    </Pressable>
  );
}

export const PairRow = memo(PairRowComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.divider,
    gap: spacing.md,
  },
  // Equal-share columns with a left-aligned middle column (like the order book), so prices line up vertically.
  leading: { flex: 1, gap: spacing.xs, alignItems: 'flex-start' },
  symbol: { color: colors.text.primary, ...typography.body },
  trailing: { flex: 1, alignItems: 'flex-start', gap: spacing.xs },
  price: { ...typography.tableValueLarge },
});
