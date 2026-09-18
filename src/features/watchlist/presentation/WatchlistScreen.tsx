import { FlashList } from '@shopify/flash-list';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { BottomNavBar } from '../../../core/components/BottomNavBar';
import { TopAppBar } from '../../../core/components/TopAppBar';
import { colors, spacing, typography } from '../../../core/theme';
import type { RootStackParamList } from '../../../navigation/types';
import { PairRow } from './PairRow';
import { SearchBar } from './SearchBar';
import { useWatchlist, type WatchlistRow } from './useWatchlist';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function WatchlistScreen() {
  const { t } = useTranslation('watchlist');
  const navigation = useNavigation<Navigation>();
  const { rows, searchQuery, setSearchQuery, toggleFavourite, refetch, isRefetching } = useWatchlist();

  const handlePairPress = useCallback(
    (pair: string) => navigation.navigate('Terminal', { pair }),
    [navigation]
  );

  const renderItem = useCallback(
    ({ item }: { item: WatchlistRow }) => (
      <PairRow row={item} onPress={handlePairPress} onToggleFavourite={toggleFavourite} />
    ),
    [handlePairPress, toggleFavourite]
  );

  return (
    <View style={styles.container}>
      <TopAppBar title={t('title')} />
      <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
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
      <BottomNavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.screenTerminal },
  listContainer: { flex: 1 },
  empty: { color: colors.text.label, textAlign: 'center', marginTop: spacing.xxl, ...typography.body },
});
