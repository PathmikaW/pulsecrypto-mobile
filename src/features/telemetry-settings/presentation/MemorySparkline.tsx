import { memo } from 'react';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../../../core/theme';

const WIDTH = 300;
const HEIGHT = 60;

// Static, decorative sparkline shape matching Figma's memory-footprint chart — there is no
// cheap RN API for real historical process-memory samples, so this is a display-only
// visual, same treatment as the Memory Footprint value itself and the three micro-cards
// (ADR-M10). Not real data - documented in the README as intentionally static.
const POINTS: readonly number[] = [42, 38, 40, 30, 34, 22, 26, 16, 20, 10, 14, 4, 8, 2];

function buildLinePath(): string {
  const stepX = WIDTH / (POINTS.length - 1);
  return POINTS.map((y, i) => `${i === 0 ? 'M' : 'L'} ${i * stepX} ${y}`).join(' ');
}

function buildAreaPath(): string {
  return `${buildLinePath()} L ${WIDTH} ${HEIGHT} L 0 ${HEIGHT} Z`;
}

// Computed once at module load, not per-render — this shape is 100% static, but its parent
// card re-renders every second (the WS message-rate counter), so without memoization these
// path strings would be rebuilt for no reason on every one of those renders.
const AREA_PATH = buildAreaPath();
const LINE_PATH = buildLinePath();

function MemorySparklineComponent() {
  return (
    <Svg width="100%" height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none">
      <Path d={AREA_PATH} fill={colors.signal.negativeMuted} fillOpacity={0.15} />
      <Path d={LINE_PATH} stroke={colors.signal.negativeMuted} strokeWidth={2} fill="none" />
    </Svg>
  );
}

export const MemorySparkline = memo(MemorySparklineComponent);
