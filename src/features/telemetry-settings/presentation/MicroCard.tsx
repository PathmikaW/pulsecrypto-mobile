import { StyleSheet, Text, View } from 'react-native';
import { Icon } from '../../../core/components/Icon';
import type { SvgIconName } from '../../../core/icons/svgIcons';
import { colors, radius, spacing, typography } from '../../../core/theme';

interface MicroCardProps {
  icon: SvgIconName;
  /** Drives both the icon box tint (10% opacity) and the glyph color (full opacity). */
  tint: string;
  label: string;
  value: string;
}

// Static, display-only card: no real GPU, latency or cache data source exists (ADR-M10).
export function MicroCard({ icon, tint, label, value }: MicroCardProps) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconBox, { backgroundColor: `${tint}1A` }]}>
        <Icon name={icon} size={24} color={tint} />
      </View>
      <View style={styles.textBlock}>
        <Text style={[styles.label, { color: tint }]}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: `${colors.background.card}66`,
    borderRadius: radius.card,
    padding: spacing.lg,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: { flex: 1, gap: 2 },
  // Label color comes from the `tint` prop; value is the dim description text.
  label: { ...typography.labelCaps },
  value: { color: colors.text.numeric, ...typography.bodySmall },
});
