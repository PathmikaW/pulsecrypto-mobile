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
}

// React.memo + a per-pair Zustand-backed subscription (useMarketData) so recycling and
// selector-scoping work together (ADR-M3): a price update to one pair only re-renders its
// own row, not the whole list.
function PairRowComponent({ row, onPress, onToggleFavourite }: PairRowProps) {
  const { t } = useTranslation('favourites');
  const marketData = useMarketData(row.symbol);

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
  leading: { gap: spacing.xs },
  symbol: { color: colors.text.primary, ...typography.body },
  trailing: { alignItems: 'flex-end', gap: spacing.xs },
  price: { fontSize: 16, lineHeight: 20 },
});
