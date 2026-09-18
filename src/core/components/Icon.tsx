import Svg, { Path } from 'react-native-svg';
import { svgIcons, type SvgIconName } from '../icons/svgIcons';

interface IconProps {
  name: SvgIconName;
  size?: number;
  color: string;
}

// Renders one of the real Figma-exported vector icons (svgIcons.ts) at a given size/color
// — the color is applied here, not baked into the path, so the same shape covers both
// active/inactive states (e.g. BottomNavBar) without needing a second export.
export function Icon({ name, size = 24, color }: IconProps) {
  const icon = svgIcons[name];
  const [, , viewWidth, viewHeight] = icon.viewBox.split(' ').map(Number);
  const height = (size * viewHeight) / viewWidth;

  return (
    <Svg width={size} height={height} viewBox={icon.viewBox}>
      <Path d={icon.path} fill={color} />
    </Svg>
  );
}
