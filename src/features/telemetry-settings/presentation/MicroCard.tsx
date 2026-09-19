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
    // Verified value: #1E2633 at 0x66 alpha (~40% opacity), not the fully solid card color.
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
  // label's color comes from the `tint` prop at render time (Figma colors each card's bold
  // label to match its own icon - green/pink/light-gray - not a uniform color); value is
  // the dim description text, which was backwards from this (label was gray, value was
  // white - the opposite of Figma's treatment).
  label: { ...typography.labelCaps },
  // text.numeric (#C6C6CB) - verified value, not text.label as tried earlier.
  value: { color: colors.text.numeric, ...typography.bodySmall },
});
