import { memo, useEffect } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors, radius, spacing } from '../../../core/theme';

const PULSE_DURATION_MS = 700;

function SkeletonBlock({ style }: { style: ViewStyle }) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.85, { duration: PULSE_DURATION_MS, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[styles.block, style, animatedStyle]} />;
}

// Shown wherever MarketDetailScreen would otherwise be waiting on data with nothing to show
// (no pair resolved yet on a cold launch with the backend unreachable, or a pair resolved
// but its first WS tick hasn't arrived) - shaped like the real layout instead of a bare
// spinner, so the screen never looks broken/stuck while genuinely just waiting. Both REST
// (/pairs/meta) and the WS connection retry indefinitely on their own (TanStack Query's
// default retry, ADR-M6's uncapped exponential backoff), so this resolves on its own the
// moment either source succeeds - no manual restart needed.
export const TerminalSkeleton = memo(function TerminalSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.priceSection}>
        <SkeletonBlock style={styles.labelBlock} />
        <SkeletonBlock style={styles.priceBlock} />
        <View style={styles.statRow}>
          <SkeletonBlock style={styles.statBlock} />
          <SkeletonBlock style={styles.statBlock} />
          <SkeletonBlock style={styles.statBlock} />
        </View>
      </View>

      <View style={styles.rows}>
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonBlock key={i} style={styles.rowBlock} />
        ))}
      </View>

      <SkeletonBlock style={styles.depthBlock} />
    </View>
  );
});

const styles = StyleSheet.create({
  block: { backgroundColor: colors.background.card, borderRadius: radius.badge },
  container: { paddingHorizontal: spacing.lg, gap: spacing.lg, marginTop: spacing.lg },
  priceSection: { gap: spacing.sm },
  labelBlock: { width: 80, height: 12 },
  priceBlock: { width: 200, height: 36, marginTop: spacing.xs },
  statRow: { flexDirection: 'row', gap: spacing.xl, marginTop: spacing.sm },
  statBlock: { width: 70, height: 30 },
  rows: { gap: spacing.sm, marginTop: spacing.md },
  rowBlock: { height: 20 },
  depthBlock: { height: 220, marginHorizontal: -spacing.lg, borderRadius: 0 },
});
