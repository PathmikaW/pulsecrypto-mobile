import Svg, { Path } from 'react-native-svg';
import { svgIcons, type SvgIconName } from '../icons/svgIcons';

interface IconProps {
  name: SvgIconName;
  size?: number;
  color: string;
}

// Color is applied at render time, not baked into the path, so one shape covers active and inactive states.
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
