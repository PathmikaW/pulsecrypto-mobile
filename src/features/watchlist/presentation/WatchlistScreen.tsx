import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../../../core/theme';

// Row rendering (FlashList), search, and the favourites merge land in Phase 4
// (specs/mobile-screens.md) — this establishes the routable screen for Phase 3's
// navigation setup.
export function WatchlistScreen() {
  const { t } = useTranslation('watchlist');
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('title')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.screenTerminal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: colors.text.primary, ...typography.heading },
});
