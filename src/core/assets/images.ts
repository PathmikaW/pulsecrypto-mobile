// Central registry for raster image assets, mirroring core/icons/svgIcons.ts's pattern for
// vectors - one typed source of truth instead of require() calls scattered across
// components, so every image asset the app bundles is visible/auditable in one place.
export const images = {
  marketDepthShader: require('../../../assets/market-depth-shader.png'),
} as const;

export type ImageName = keyof typeof images;
