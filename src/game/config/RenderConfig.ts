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

  /** Building fallback rendering configuration */
  buildingFallback: {
    /** Multiplier for building height based on footprint size */
    heightMultiplier: 15,
    /** Base height added to buildings */
    baseHeight: 10,
    /** Horizontal offset for left face depth */
    faceDepthOffset: 10,
    /** Vertical offset for left face depth */
    faceHeightOffset: 5,
    /** Icon offset from center */
    iconOffset: 12,
    /** Icon font size */
    iconFontSize: 24,
    /** Icon font family */
    iconFontFamily: 'Arial',
  },
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
    // Wasteland terrain colors
    wasteland: 0x8b7355,
    radiation: 0x4cff00,
    rubble: 0x696969,
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
    wasteland: 0x8b7355,
    rubble: 0x696969,
    // Zone tool colors (RCI)
    zoneResidential: 0x4caf50, // Green for housing
    zoneCommercial: 0x2196f3, // Blue for commercial
    zoneIndustrial: 0xffc107, // Yellow/orange for industrial
    dezone: 0xff5252, // Red for removing zones
    default: 0xffffff,
  },

  /** Zone overlay colors (for developed zones) */
  zones: {
    residential: 0x4caf50, // Green
    commercial: 0x2196f3, // Blue
    industrial: 0xffc107, // Yellow/orange
  },
} as const;
