import { memo } from 'react';
import { Image, StyleSheet } from 'react-native';

// The real exported "Shader" layer from Figma (Pulse Crypto Mockup/Shader.png) - a static
// decorative gradient, not a literal plot of order book depth, so a real exported image is
// the right fit rather than an approximated vector (was: a hand-built SVG wave standing in
// while Figma API access was rate-limited).
const SHADER_IMAGE = require('../../../../assets/market-depth-shader.png');

function MarketDepthChartComponent() {
  return (
    // Plain decorative Image, no touch handler - nothing for it to intercept, so no
    // pointerEvents override is needed (RN's ImageStyle doesn't accept one directly).
    <Image source={SHADER_IMAGE} style={StyleSheet.absoluteFill} resizeMode="cover" />
  );
}

// Takes no props, so this memo never re-renders once mounted - the shader truly renders once.
export const MarketDepthChart = memo(MarketDepthChartComponent);
