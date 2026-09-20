import { memo } from 'react';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../../../core/theme';

const WIDTH = 300;
const HEIGHT = 60;

// Static, decorative shape: no cheap RN API exposes historical process memory (ADR-M10).
const POINTS: readonly number[] = [42, 38, 40, 30, 34, 22, 26, 16, 20, 10, 14, 4, 8, 2];

function buildLinePath(): string {
  const stepX = WIDTH / (POINTS.length - 1);
  return POINTS.map((y, i) => `${i === 0 ? 'M' : 'L'} ${i * stepX} ${y}`).join(' ');
}

function buildAreaPath(): string {
  return `${buildLinePath()} L ${WIDTH} ${HEIGHT} L 0 ${HEIGHT} Z`;
}

// Computed once at module load; the parent re-renders every second and would otherwise rebuild these strings.
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
