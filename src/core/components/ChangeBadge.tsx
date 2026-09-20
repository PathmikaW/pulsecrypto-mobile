import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';
import { formatPercent } from '../utils/formatPercent';

interface ChangeBadgeProps {
  changePercent: number;
}

export function ChangeBadge({ changePercent }: ChangeBadgeProps) {
  const { i18n } = useTranslation();
  const isPositive = changePercent >= 0;

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: isPositive ? colors.signal.positiveMuted : colors.signal.negativeMuted },
      ]}
    >
      <Text style={[styles.text, { color: isPositive ? colors.signal.positive : colors.signal.negative }]}>
        {formatPercent(changePercent, i18n.language)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.badge,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
    alignSelf: 'flex-start',
  },
  text: { ...typography.tableValueSmall },
});
