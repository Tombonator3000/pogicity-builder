/**
 * Grid configuration constants
 * Defines the isometric grid system parameters
 */
export const GRID_CONFIG = {
  /** Grid dimensions */
  width: 48,
  height: 48,

  /** Tile dimensions (isometric) */
  tileWidth: 44,
  tileHeight: 22,

  /** Grid offset from screen origin */
  offsetX: 2000,
  offsetY: 100,
} as const;
