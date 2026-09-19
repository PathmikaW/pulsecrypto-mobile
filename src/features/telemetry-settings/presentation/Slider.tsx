import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors } from '../../../core/theme';

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

// From scratch because @react-native-community/slider's track thickness and thumb inset aren't stylable.
// PanResponder drives the drag; reanimated positions the thumb on the UI thread.
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

  // Syncs the thumb when `value` changes outside a drag (e.g. a parent reset).
  useEffect(() => {
    if (widthRef.current > 0) {
      thumbX.value = withTiming(valueToX(value, widthRef.current), { duration: 100 });
    }
  }, [value, thumbX, valueToX]);

  // PanResponder handlers only run from touch events, never during render, which the React Compiler lint rules can't see.
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
      <View style={styles.track} />
      {trackWidth > 0 && <Animated.View style={[styles.thumb, thumbStyle]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  // Taller than the drawn bar to keep the touch target comfortable.
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
