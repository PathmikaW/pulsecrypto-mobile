import { memo } from 'react';
import Svg, { Path } from 'react-native-svg';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../../core/theme';

const WIDTH = 400;
const HEIGHT = 160;
const SAMPLE_COUNT = 24;
const MID_X = WIDTH / 2;

// Matches Figma's "Shader" background behind the Market Depth panel - a smooth decorative
// wave, green on the left (bids) fading into red on the right (asks), split by a thin
// divider where they meet. It's a stylized shape in the source file, not a literal plot of
// order book depth, so this is built the same way: a static, decorative curve.
function waveY(x: number): number {
  const t = x / WIDTH;
  return HEIGHT * 0.45 + Math.sin(t * Math.PI * 1.6 + 0.4) * HEIGHT * 0.22;
}

function buildWavePoints(fromX: number, toX: number): string {
  const points: string[] = [];
  for (let i = 0; i <= SAMPLE_COUNT; i++) {
    const x = fromX + ((toX - fromX) * i) / SAMPLE_COUNT;
    points.push(`${i === 0 ? 'M' : 'L'} ${x} ${waveY(x)}`);
  }
  return points.join(' ');
}

function buildFillPath(fromX: number, toX: number): string {
  return `${buildWavePoints(fromX, toX)} L ${toX} ${HEIGHT} L ${fromX} ${HEIGHT} Z`;
}

// The wave is 100% static (no props, no external inputs) - computed once at module load
// rather than on every render. MarketDetailScreen re-renders on every ~100ms WS tick, and
// this shape never changes, so recomputing 2x24 trig samples + path strings on every one
// of those ticks would be pure waste.
const LEFT_FILL_PATH = buildFillPath(0, MID_X);
const RIGHT_FILL_PATH = buildFillPath(MID_X, WIDTH);
const DIVIDER_PATH = `M ${MID_X} 0 L ${MID_X} ${HEIGHT}`;

function MarketDepthChartComponent() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none">
        <Path d={LEFT_FILL_PATH} fill={colors.signal.positiveMuted} fillOpacity={0.5} />
        <Path d={RIGHT_FILL_PATH} fill={colors.signal.negative} fillOpacity={0.35} />
        <Path d={DIVIDER_PATH} stroke={colors.text.label} strokeWidth={1} strokeOpacity={0.4} />
      </Svg>
    </View>
  );
}

// Takes no props, so this memo never re-renders once mounted - the wave truly renders once.
export const MarketDepthChart = memo(MarketDepthChartComponent);
