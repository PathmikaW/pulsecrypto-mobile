// Central registry for raster assets, mirroring core/icons/svgIcons.ts.
export const images = {
  marketDepthShader: require('../../../assets/market-depth-shader.png'),
} as const;

export type ImageName = keyof typeof images;
