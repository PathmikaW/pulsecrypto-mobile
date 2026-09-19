import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { useMarketStore } from '../data/repositories/MarketRepository';
import { colors, radius, spacing, typography } from '../theme';

const STATUS_COLOR = {
  connected: colors.signal.positive,
  connecting: colors.text.label,
  reconnecting: colors.text.label,
  disconnected: colors.signal.negative,
} as const;

// Reflects the single global connection state (ADR-M7) — never a per-row state. Owned by
// `useWebSocket`, read here via `marketStore.connectionStatus`. Memoized (takes no props)
// since it's rendered on every screen and would otherwise re-render on every parent tick
// even though its own selector rarely changes.
function ConnectionIndicatorComponent() {
  const { t } = useTranslation();
  const status = useMarketStore((state) => state.connectionStatus);

  return (
    <View style={styles.container}>
      <View style={[styles.dot, { backgroundColor: STATUS_COLOR[status] }]} />
      <Text style={styles.label}>{t(`common:connection.${status}`)}</Text>
    </View>
  );
}

export const ConnectionIndicator = memo(ConnectionIndicatorComponent);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.background.recessed,
    borderRadius: radius.badge,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { color: colors.text.label, ...typography.labelCaps },
});
