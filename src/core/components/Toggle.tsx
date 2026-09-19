import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { colors } from '../theme';

const TRACK_WIDTH = 44;
const TRACK_HEIGHT = 24;
const THUMB_SIZE = 20;
const THUMB_INSET = 2;
const ANIMATION_DURATION_MS = 150;

interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityLabel?: string;
}

// RN's built-in <Switch> renders each platform's native widget (Material on Android, the
// iOS pill) and can't be restyled to match Figma's flat track+thumb design consistently on
// both - this is a from-scratch control instead, so it looks and behaves identically on
// both platforms and matches the exact 44x24 track / 20x20 thumb dimensions verified in
// Figma. Thumb position animates on the UI thread via reanimated, not a layout-triggering
// left/right style change.
export function Toggle({ value, onValueChange, accessibilityLabel }: ToggleProps) {
  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(value ? colors.signal.positive : colors.background.divider, {
      duration: ANIMATION_DURATION_MS,
    }),
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: withTiming(value ? TRACK_WIDTH - THUMB_SIZE - THUMB_INSET : THUMB_INSET, {
          duration: ANIMATION_DURATION_MS,
        }),
      },
    ],
  }));

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
    >
      <Animated.View style={[styles.track, trackStyle]}>
        <Animated.View style={[styles.thumb, thumbStyle]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    justifyContent: 'center',
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#FFFFFF',
  },
});
