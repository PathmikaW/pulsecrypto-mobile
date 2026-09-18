import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../../core/theme';

interface MicroCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  boxColor: string;
  glyphColor: string;
  label: string;
  value: string;
}

// The three small bento-grid stat cards (GPU Acceleration, API Latency, Storage Cache) -
// static, display-only content per ADR-M10, since none of this has a real data source
// (no GPU/render-pipeline introspection, no real latency probe, no real cache accounting).
// Icon shapes are interim Ionicons stand-ins - the real Figma exports are still blocked by
// a persistent API rate limit (see TelemetryScreen); box/glyph colors are already matched
// to the verified Figma fills (a muted box tint with a darker, same-hue glyph on top).
export function MicroCard({ icon, boxColor, glyphColor, label, value }: MicroCardProps) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconBox, { backgroundColor: boxColor }]}>
        <Ionicons name={icon} size={20} color={glyphColor} />
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
