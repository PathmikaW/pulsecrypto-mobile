import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../../../core/theme';

// Price ticker, order book, market depth panel, and the account drawer land in Phase 4,
// built to Figma's "Trading Terminal" frame at full fidelity (ADR-M10). This establishes
// the routable screen for Phase 3's navigation setup.
export function MarketDetailScreen() {
  const { t } = useTranslation('market-details');
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('currentPrice')}</Text>
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
