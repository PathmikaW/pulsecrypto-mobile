import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../../core/theme';

interface MicroCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  value: string;
}

// The three small bento-grid stat cards (GPU Acceleration, API Latency, Storage Cache) -
// static, display-only content per ADR-M10, since none of this has a real data source
// (no GPU/render-pipeline introspection, no real latency probe, no real cache accounting).
export function MicroCard({ icon, iconColor, label, value }: MicroCardProps) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconBox, { backgroundColor: iconColor }]}>
        <Ionicons name={icon} size={20} color={colors.background.screenTelemetry} />
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
