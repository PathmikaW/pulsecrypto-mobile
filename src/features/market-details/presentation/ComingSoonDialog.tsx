import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, radius, spacing, typography } from '../../../core/theme';

const ANIMATION_DURATION_MS = 120;
// Spring scale, slightly underdamped: a natural settle without looking bouncy.
const OPEN_SCALE_SPRING = { duration: 260, dampingRatio: 0.85 };

interface ComingSoonDialogProps {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  onDismiss: () => void;
}

// Themed replacement for Alert.alert, which always renders in the OS light theme. Mounts during render like AccountDrawer to avoid a one-tick open delay.
export function ComingSoonDialog({ visible, title, body, confirmLabel, onDismiss }: ComingSoonDialogProps) {
  const [isMounted, setIsMounted] = useState(false);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.92);

  if (visible && !isMounted) {
    setIsMounted(true);
  }

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: ANIMATION_DURATION_MS });
      scale.value = withSpring(1, OPEN_SCALE_SPRING);
    } else if (isMounted) {
      opacity.value = withTiming(0, { duration: ANIMATION_DURATION_MS }, (finished) => {
        if (finished) runOnJS(setIsMounted)(false);
      });
      scale.value = withTiming(0.92, { duration: ANIMATION_DURATION_MS });
    }
    // Deps are [visible] only: a one-shot transition handler, same as AccountDrawer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const cardStyle = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ scale: scale.value }] }));

  if (!isMounted) return null;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} accessibilityLabel={confirmLabel} />
      <Animated.View style={[styles.card, cardStyle]} accessibilityRole="alert">
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
        <Pressable style={styles.confirmButton} onPress={onDismiss}>
          <Text style={styles.confirmText}>{confirmLabel}</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: { color: colors.text.primary, ...typography.heading },
  body: { color: colors.text.numeric, ...typography.body },
  confirmButton: {
    alignSelf: 'flex-end',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  confirmText: {
    color: colors.signal.positive,
    ...typography.body,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
  },
});
