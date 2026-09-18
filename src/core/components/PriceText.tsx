import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View, type TextStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors, typography } from '../theme';
import { formatPrice } from '../utils/formatPrice';

interface PriceTextProps {
  value: number;
  style?: TextStyle;
  /** When provided, the text's steady-state color reflects this sign (green/red) instead
   * of the default primary color — matches Figma's Terminal "LAST PRICE" treatment, which
   * colors the price itself by 24h direction, not just a separate badge next to it. Omit
   * for contexts (e.g. watchlist rows) that don't use this treatment. */
  changePercent?: number;
}

const FLASH_DURATION_MS = 400;

// Flashes green on increase, red on decrease (ADR-M4) — a background overlay animated on
// the UI thread via a worklet, so the flash stays smooth independent of JS-thread load at
// a 100ms update cadence. The overlay's opacity animates, not the text's own opacity, so
// the price stays fully legible throughout the flash.
export function PriceText({ value, style, changePercent }: PriceTextProps) {
  const { i18n } = useTranslation();
  const previousValue = useRef(value);
  const flashOpacity = useSharedValue(0);
  const [direction, setDirection] = useState<'up' | 'down' | null>(null);

  const steadyStateColor =
    changePercent == null
      ? colors.text.primary
      : changePercent < 0
        ? colors.signal.negative
        : colors.signal.positive;

  useEffect(() => {
    if (value !== previousValue.current) {
      setDirection(value > previousValue.current ? 'up' : 'down');
      previousValue.current = value;
      flashOpacity.value = 0.35;
      flashOpacity.value = withTiming(0, { duration: FLASH_DURATION_MS });
    }
  }, [value, flashOpacity]);

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
    backgroundColor: direction === 'down' ? colors.signal.negative : colors.signal.positive,
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
