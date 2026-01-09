import { GRID_CONFIG } from '../config';

/**
 * Utilities for grid coordinate conversion and calculations
 */

/**
 * Converts grid coordinates to isometric screen coordinates
 * @param gridX - Grid X coordinate (0 to GRID_WIDTH)
 * @param gridY - Grid Y coordinate (0 to GRID_HEIGHT)
 * @returns Screen coordinates {x, y} in pixels
 */
export function gridToScreen(gridX: number, gridY: number): { x: number; y: number } {
  return {
    x: GRID_CONFIG.offsetX + (gridX - gridY) * (GRID_CONFIG.tileWidth / 2),
    y: GRID_CONFIG.offsetY + (gridX + gridY) * (GRID_CONFIG.tileHeight / 2),
  };
}

/**
 * Converts screen coordinates to grid coordinates
 * @param screenX - Screen X coordinate in pixels
 * @param screenY - Screen Y coordinate in pixels
 * @returns Grid coordinates {x, y} (may be fractional)
 */
export function screenToGrid(screenX: number, screenY: number): { x: number; y: number } {
  const relX = screenX - GRID_CONFIG.offsetX;
  const relY = screenY - GRID_CONFIG.offsetY;

  return {
    x: (relX / (GRID_CONFIG.tileWidth / 2) + relY / (GRID_CONFIG.tileHeight / 2)) / 2,
    y: (relY / (GRID_CONFIG.tileHeight / 2) - relX / (GRID_CONFIG.tileWidth / 2)) / 2,
  };
}

/**
 * Calculates depth value for proper isometric sorting
 * @param sortX - X coordinate for sorting
 * @param sortY - Y coordinate for sorting
 * @param layerOffset - Additional layer offset (default 0)
 * @param depthYMultiplier - Multiplier for Y depth (default 10000)
 * @returns Depth value for Phaser sprite
 */
export function calculateDepth(
  sortX: number,
  sortY: number,
  layerOffset: number = 0,
  depthYMultiplier: number = 10000
): number {
  return sortY * depthYMultiplier + sortX + layerOffset;
}

/**
 * Checks if grid coordinates are within bounds
 * @param x - Grid X coordinate
 * @param y - Grid Y coordinate
 * @returns True if coordinates are within grid bounds
 */
export function isInBounds(x: number, y: number): boolean {
  return x >= 0 && x < GRID_CONFIG.width && y >= 0 && y < GRID_CONFIG.height;
}

/**
 * Gets snow texture variant based on position
 * @param x - Grid X coordinate
 * @param y - Grid Y coordinate
 * @returns Texture key for snow variant (1-3)
 */
export function getSnowTextureKey(x: number, y: number): string {
  const variant = ((x * 7 + y * 13) % 3) + 1;
  return `snow_${variant}`;
}
