import { StyleSheet, Text, View } from 'react-native';
import { Icon } from '../../../core/components/Icon';
import type { SvgIconName } from '../../../core/icons/svgIcons';
import { colors, radius, spacing, typography } from '../../../core/theme';

interface MicroCardProps {
  icon: SvgIconName;
  /** Both the icon box's background tint and the glyph's solid color derive from this one
   * value (box = 10% opacity, glyph = full opacity) - verified directly against the real
   * exported icons (Pulse Crypto Mockup/Overlay*.svg), which bake exactly that relationship
   * in rather than two independently-chosen colors. */
  tint: string;
  label: string;
  value: string;
}

// The three small bento-grid stat cards (GPU Acceleration, API Latency, Storage Cache) -
// static, display-only content per ADR-M10, since none of this has a real data source
// (no GPU/render-pipeline introspection, no real latency probe, no real cache accounting).
export function MicroCard({ icon, tint, label, value }: MicroCardProps) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconBox, { backgroundColor: `${tint}1A` }]}>
        <Icon name={icon} size={20} color={tint} />
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.label}>{label}</Text>
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
    backgroundColor: colors.background.card,
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
  label: { color: colors.text.label, ...typography.labelCaps },
  value: { color: colors.text.primary, ...typography.bodySmall },
});
