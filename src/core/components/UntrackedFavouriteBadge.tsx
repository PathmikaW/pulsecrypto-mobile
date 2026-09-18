import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

// A favourited pair outside the backend's currently-tracked set still renders — via this
// badge — never hidden, never a crash (ADR-M8's untracked-favourite handling). Placed in
// core/ rather than watchlist/ since it's a generic "no live data for this pair" indicator.
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
