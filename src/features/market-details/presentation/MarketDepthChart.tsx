import { Image } from 'expo-image';
import { memo } from 'react';
import { StyleSheet } from 'react-native';
import { images } from '../../../core/assets/images';

function MarketDepthChartComponent() {
  return (
    // The real exported "Shader" layer from Figma - a static decorative gradient, not a
    // literal plot of order book depth, so a real exported image is the right fit rather
    // than an approximated vector. expo-image, not RN's built-in Image - contentFit is its
    // resizeMode equivalent. Plain decorative Image, no touch handler - nothing for it to
    // intercept, so no pointerEvents override is needed (RN's ImageStyle doesn't accept one
    // directly).
    <Image source={images.marketDepthShader} style={StyleSheet.absoluteFill} contentFit="cover" />
  );
}

// Takes no props, so this memo never re-renders once mounted - the shader truly renders once.
export const MarketDepthChart = memo(MarketDepthChartComponent);
