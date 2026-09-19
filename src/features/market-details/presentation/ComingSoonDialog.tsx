import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors, radius, spacing, typography } from '../../../core/theme';

// 90ms, opacity-only: fast enough to read as instant while still avoiding a hard pop-in
// flash. A scale transform was tried and dropped - even at a short duration, a growing
// card reads as "still settling in" after it's already fully opaque, which is exactly the
// kind of lag this is meant to eliminate. One shared opacity value drives the whole
// overlay (backdrop + card fade together as a single unit) rather than two independently
// animated styles, so there's no risk of them drifting out of sync with each other either.
const ANIMATION_DURATION_MS = 90;

interface ComingSoonDialogProps {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  onDismiss: () => void;
}

// Replaces the native Alert.alert() previously used for the drawer's placeholder links.
// Alert.alert opens a real native dialog (a genuine OS window on Android) that's always
// styled in the OS's own light theme - it clashed hard against this app's dark UI. This is
// a plain reanimated-driven overlay instead: themed to match the rest of the app, and
// never leaves the JS/UI-thread render path, so it opens exactly as fast as the drawer
// itself. Same render-phase mount pattern as AccountDrawer's own open-lag fix (mount
// synchronously during render, not from inside an effect) - deliberately reused here so
// this dialog doesn't reintroduce the same one-tick delay.
export function ComingSoonDialog({ visible, title, body, confirmLabel, onDismiss }: ComingSoonDialogProps) {
  const [isMounted, setIsMounted] = useState(false);
  const opacity = useSharedValue(0);

  if (visible && !isMounted) {
    setIsMounted(true);
  }

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: ANIMATION_DURATION_MS });
    } else if (isMounted) {
      opacity.value = withTiming(0, { duration: ANIMATION_DURATION_MS }, (finished) => {
        if (finished) runOnJS(setIsMounted)(false);
      });
    }
    // Deps intentionally `[visible]`-only - same one-shot-transition-handler reasoning as
    // AccountDrawer's own effect (see that file).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  if (!isMounted) return null;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, overlayStyle]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} accessibilityLabel={confirmLabel} />
      <View style={styles.card} accessibilityRole="alert">
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
        <Pressable style={styles.confirmButton} onPress={onDismiss}>
          <Text style={styles.confirmText}>{confirmLabel}</Text>
        </Pressable>
      </View>
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
