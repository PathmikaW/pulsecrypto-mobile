import Svg, { Circle } from 'react-native-svg';
import { StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../../../core/theme';

interface CircularGaugeProps {
  value: number;
  max: number;
  unit: string;
  size?: number;
}

const STROKE_WIDTH = 8;

// Matches Figma's "Gauge: JS Thread" node (two overlapping vector paths — a background
// ring and a progress arc), built with react-native-svg rather than approximated with
// border/transform tricks.
export function CircularGauge({ value, max, unit, size = 128 }: CircularGaugeProps) {
  const radius = (size - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, value / max));
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.background.divider}
          strokeWidth={STROKE_WIDTH}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.signal.positive}
          strokeWidth={STROKE_WIDTH}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.centerContent}>
          <Text style={styles.value}>{Math.round(value)}</Text>
          <Text style={styles.unit}>{unit}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContent: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  value: { color: colors.text.primary, ...typography.priceDisplay, fontSize: 32 },
  unit: { color: colors.text.numeric, ...typography.labelCaps },
});
