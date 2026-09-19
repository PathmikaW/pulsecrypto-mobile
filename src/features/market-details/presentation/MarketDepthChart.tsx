import { Image } from 'expo-image';
import { memo } from 'react';
import { StyleSheet } from 'react-native';
import { images } from '../../../core/assets/images';

function MarketDepthChartComponent() {
  return (
    // Static decorative gradient exported from Figma, not a plot of depth. expo-image's contentFit replaces RN's resizeMode.
    <Image source={images.marketDepthShader} style={StyleSheet.absoluteFill} contentFit="cover" />
  );
}

// Takes no props, so this memo never re-renders once mounted - the shader truly renders once.
export const MarketDepthChart = memo(MarketDepthChartComponent);
