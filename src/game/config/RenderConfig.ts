/**
 * Rendering configuration constants
 * Defines depth sorting and rendering parameters
 */
export const RENDER_CONFIG = {
  /** Depth multiplier for Y-axis sorting */
  depthYMultiplier: 10000,

  /** Depth layer offsets */
  layers: {
    tile: 0,
    building: 0.05,
    buildingIcon: 0.06,
    vehicle: 0.1,
    character: 0.2,
    preview: 999999,
  },

  /** Default scale for character sprites */
  characterScale: 0.5,

  /** Character sprite Y offset */
  characterYOffset: 5,

  /** Fallback character circle radius */
  characterCircleRadius: 8,

  /** Preview overlay alpha */
  previewAlpha: 0.4,
} as const;

/**
 * Color palette for rendering
 */
export const COLOR_PALETTE = {
  /** Tile colors */
  tiles: {
    grass: 0x4caf50,
    road: 0x9e9e9e,
    asphalt: 0x424242,
    tile: 0xbdbdbd,
    snow: 0xeceff1,
    building: 0x757575,
  },

  /** Building fallback colors */
  building: {
    base: 0x78909c,
    dark: 0x546e7a,
    light: 0x90a4ae,
  },

  /** Character colors */
  characters: {
    banana: 0xffeb3b,
    apple: 0xef5350,
  },

  /** Preview overlay colors */
  preview: {
    roadNetwork: 0xffc107,
    asphalt: 0x424242,
    tile: 0xbdbdbd,
    snow: 0xeceff1,
    building: 0x4caf50,
    eraser: 0xff5252,
    default: 0xffffff,
  },
} as const;
