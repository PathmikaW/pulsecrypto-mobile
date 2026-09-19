import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

// Shown for a favourited pair outside the tracked set; never hidden (ADR-M8). In core/ as a generic no-live-data indicator.
export function UntrackedFavouriteBadge() {
  const { t } = useTranslation();
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{t('untrackedPair')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.background.divider,
    borderRadius: radius.badge,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    alignSelf: 'flex-start',
  },
  text: { color: colors.text.label, ...typography.labelCaps },
});
