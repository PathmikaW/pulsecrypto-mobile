import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View, type TextStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors, typography } from '../theme';
import { formatPrice } from '../utils/formatPrice';

interface PriceTextProps {
  value: number;
  style?: TextStyle;
  /** Colors the steady-state text by sign (green/red); omit where that treatment isn't used. */
  changePercent?: number;
}

const FLASH_DURATION_MS = 400;

// The flash overlay animates on the UI thread; its opacity animates, not the text's, so the price stays legible (ADR-M4).
export function PriceText({ value, style, changePercent }: PriceTextProps) {
  const { i18n } = useTranslation();
  const previousValue = useRef(value);
  const flashOpacity = useSharedValue(0);
  // Shared value, not state: the direction is only read in the worklet, and state would re-render every row per tick.
  const isUpFlash = useSharedValue(true);

  const steadyStateColor =
    changePercent == null
      ? colors.text.primary
      : changePercent < 0
        ? colors.signal.negative
        : colors.signal.positive;

  useEffect(() => {
    if (value !== previousValue.current) {
      isUpFlash.value = value > previousValue.current;
      previousValue.current = value;
      flashOpacity.value = 0.35;
      flashOpacity.value = withTiming(0, { duration: FLASH_DURATION_MS });
    }
  }, [value, flashOpacity, isUpFlash]);

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
    backgroundColor: isUpFlash.value ? colors.signal.positive : colors.signal.negative,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.overlay, flashStyle]} />
      <Text style={[styles.text, { color: steadyStateColor }, style]}>
        {formatPrice(value, i18n.language)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative' },
  overlay: { borderRadius: 4 },
  text: { color: colors.text.primary, ...typography.priceDisplay },
});
