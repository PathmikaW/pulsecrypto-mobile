import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors } from '../theme';

const TRACK_HEIGHT = 4;
const THUMB_SIZE = 20;

interface SliderProps {
  value: number;
  minimumValue: number;
  maximumValue: number;
  step?: number;
  onValueChange: (value: number) => void;
  accessibilityLabel?: string;
}

// @react-native-community/slider's native track has a fixed, non-stylable thickness and a
// built-in inset around the thumb (to leave room for it at the extremes) that isn't exposed
// as a style prop - this made the track both thinner than Figma and narrower than the
// surrounding full-width content (the divider line below it), no matter how the wrapping
// style was adjusted. A from-scratch control sidesteps both platform constraints entirely -
// same rationale as Toggle - using PanResponder (core React Native, no new native
// dependency) for the drag gesture and reanimated for the UI-thread thumb position.
export function Slider({
  value,
  minimumValue,
  maximumValue,
  step = 1,
  onValueChange,
  accessibilityLabel,
}: SliderProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const thumbX = useSharedValue(0);
  const widthRef = useRef(0);
  const grantXRef = useRef(0);

  const valueToX = useCallback(
    (v: number, width: number) => {
      if (width <= THUMB_SIZE) return 0;
      const ratio = (v - minimumValue) / (maximumValue - minimumValue);
      return ratio * (width - THUMB_SIZE);
    },
    [minimumValue, maximumValue]
  );

  const xToValue = useCallback(
    (x: number, width: number) => {
      if (width <= THUMB_SIZE) return minimumValue;
      const ratio = Math.max(0, Math.min(1, x / (width - THUMB_SIZE)));
      const raw = minimumValue + ratio * (maximumValue - minimumValue);
      return Math.round(raw / step) * step;
    },
    [minimumValue, maximumValue, step]
  );

  const onLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    widthRef.current = width;
    setTrackWidth(width);
    thumbX.value = valueToX(value, width);
  };

  // Keeps the thumb in sync when `value` changes from outside a drag (e.g. a parent reset)
  // - doesn't fire from the drag's own onValueChange calls updating the same value, since
  // this only reads the current width/value, it doesn't re-trigger the gesture.
  useEffect(() => {
    if (widthRef.current > 0) {
      thumbX.value = withTiming(valueToX(value, widthRef.current), { duration: 100 });
    }
  }, [value, thumbX, valueToX]);

  // PanResponder's handlers are only ever invoked from real touch events, never during
  // render - but the react-hooks/refs and react-hooks/immutability rules (React Compiler
  // compatibility checks) can't see that; they flag any ref/shared-value read-or-write
  // lexically inside a closure built during render, which is exactly what constructing a
  // PanResponder requires. This is the same class of justified, targeted disable already
  // used elsewhere in this app (e.g. AccountDrawer's set-state-in-effect) for an API whose
  // actual execution timing the linter's static analysis can't follow.
  const panResponder = useMemo(
    () =>
      // eslint-disable-next-line react-hooks/refs -- only touched from handlers below, not during render
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          grantXRef.current = thumbX.value;
        },
        onPanResponderMove: (_, gestureState) => {
          const width = widthRef.current;
          if (width <= THUMB_SIZE) return;
          const newX = Math.max(0, Math.min(width - THUMB_SIZE, grantXRef.current + gestureState.dx));
          // eslint-disable-next-line react-hooks/immutability -- fires only from a real drag gesture, not render
          thumbX.value = newX;
          onValueChange(xToValue(newX, width));
        },
      }),
    [thumbX, xToValue, onValueChange]
  );

  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: thumbX.value }] }));

  return (
    <View
      style={styles.hitArea}
      onLayout={onLayout}
      {...panResponder.panHandlers}
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: minimumValue, max: maximumValue, now: value }}
    >
      {/* Uniform gray track, no filled portion - Figma only colors the thumb itself. */}
      <View style={styles.track} />
      {trackWidth > 0 && <Animated.View style={[styles.thumb, thumbStyle]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  // Taller than the visual track so the touch target stays comfortable even though the
  // drawn bar itself is thin.
  hitArea: { height: THUMB_SIZE, justifyContent: 'center' },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: colors.background.divider,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: colors.signal.positive,
  },
});
