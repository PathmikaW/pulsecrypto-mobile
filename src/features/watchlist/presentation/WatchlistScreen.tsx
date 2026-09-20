import { FlashList } from '@shopify/flash-list';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { TopAppBar } from '../../../core/components/TopAppBar';
import { colors, spacing, typography } from '../../../core/theme';
import type { RootStackParamList } from '../../../navigation/types';
import { PairRow } from './PairRow';
import { SearchBar } from './SearchBar';
import { useWatchlist, type WatchlistRow } from './useWatchlist';

type Navigation = BottomTabNavigationProp<RootStackParamList>;

export function WatchlistScreen() {
  const { t } = useTranslation('watchlist');
  const navigation = useNavigation<Navigation>();
  const isFocused = useIsFocused();
  const { rows, searchQuery, setSearchQuery, toggleFavourite, refetch, isRefetching, metaError } =
    useWatchlist();

  const handlePairPress = useCallback(
    (pair: string) => navigation.navigate('Terminal', { pair }),
    [navigation]
  );

  const renderItem = useCallback(
    ({ item }: { item: WatchlistRow }) => (
      <PairRow
        row={item}
        onPress={handlePairPress}
        onToggleFavourite={toggleFavourite}
        isFocused={isFocused}
      />
    ),
    [handlePairPress, toggleFavourite, isFocused]
  );

  return (
    <View style={styles.container}>
      <TopAppBar title={t('title')} />
      <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
      {metaError ? <Text style={styles.error}>{t(`common:${metaError.i18nKey}`)}</Text> : null}
      <View style={styles.listContainer}>
        <FlashList
          data={rows}
          keyExtractor={(row) => row.symbol}
          renderItem={renderItem}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListEmptyComponent={<Text style={styles.empty}>{t('noResults')}</Text>}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.screenTerminal },
  listContainer: { flex: 1 },
  error: {
    color: colors.signal.negative,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    ...typography.bodySmall,
  },
  empty: { color: colors.text.label, textAlign: 'center', marginTop: spacing.xxl, ...typography.body },
});
