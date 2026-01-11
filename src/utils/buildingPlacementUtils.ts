/**
 * Building Placement Utilities
 *
 * This module provides pure utility functions for building placement,
 * validation, and grid manipulation. All functions are stateless and
 * testable, following the Extract Method refactoring pattern.
 */

import { GridCell, TileType, Direction, GRID_WIDTH, GRID_HEIGHT, BuildingDefinition, Footprint } from "@/game/types";
import { getBuilding, getBuildingFootprint } from "@/game/buildings";

/**
 * Tiles that buildings can be placed on
 */
export const BUILDABLE_TILES: TileType[] = [
  TileType.Grass,
  TileType.Snow,
  TileType.Wasteland,
  TileType.Rubble,
];

/**
 * Result of a building placement validation check
 */
export interface PlacementValidationResult {
  valid: boolean;
  error?: string;
  errorDescription?: string;
}

/**
 * Validates if a building can be placed at the given position
 *
 * @param grid - Current grid state
 * @param x - Grid X coordinate (origin)
 * @param y - Grid Y coordinate (origin)
 * @param footprint - Building footprint
 * @returns Validation result with error details if invalid
 */
export function validateBuildingPlacement(
  grid: GridCell[][],
  x: number,
  y: number,
  footprint: Footprint
): PlacementValidationResult {
  // Check if footprint fits within grid bounds
  for (let dy = 0; dy < footprint.height; dy++) {
    for (let dx = 0; dx < footprint.width; dx++) {
      const gx = x + dx;
      const gy = y + dy;

      if (gx >= GRID_WIDTH || gy >= GRID_HEIGHT) {
        return {
          valid: false,
          error: "Out of bounds",
          errorDescription: "Building doesn't fit within the map"
        };
      }

      const cellType = grid[gy][gx].type;
      if (!BUILDABLE_TILES.includes(cellType)) {
        return {
          valid: false,
          error: "Invalid placement",
          errorDescription: "Can only build on grass, wasteland, rubble, or snow"
        };
      }
    }
  }

  return { valid: true };
}

/**
 * Places a building on the grid by modifying grid cells
 *
 * @param grid - Grid to modify (will be mutated)
 * @param x - Grid X coordinate (origin)
 * @param y - Grid Y coordinate (origin)
 * @param building - Building definition
 * @param orientation - Building orientation
 * @param footprint - Building footprint
 * @param originalGrid - Original grid before modification (for underlying tile tracking)
 */
export function placeBuilding(
  grid: GridCell[][],
  x: number,
  y: number,
  building: BuildingDefinition,
  orientation: Direction,
  footprint: Footprint,
  originalGrid: GridCell[][]
): void {
  for (let dy = 0; dy < footprint.height; dy++) {
    for (let dx = 0; dx < footprint.width; dx++) {
      const gx = x + dx;
      const gy = y + dy;

      grid[gy][gx] = {
        type: TileType.Building,
        x: gx,
        y: gy,
        isOrigin: dx === 0 && dy === 0,
        originX: x,
        originY: y,
        buildingId: building.id,
        buildingOrientation: orientation,
        underlyingTileType: originalGrid[gy][gx].type,
      };
    }
  }
}

/**
 * Removes a building from the grid by restoring underlying tiles
 *
 * @param grid - Grid to modify (will be mutated)
 * @param x - Grid X coordinate (any tile within building)
 * @param y - Grid Y coordinate (any tile within building)
 * @returns True if building was removed, false if no building at position
 */
export function removeBuilding(
  grid: GridCell[][],
  x: number,
  y: number
): boolean {
  const cell = grid[y][x];

  // Not a building tile
  if (cell.type !== TileType.Building) {
    return false;
  }

  // Find origin coordinates
  const originX = cell.originX ?? x;
  const originY = cell.originY ?? y;

  // Get building definition and footprint
  const building = getBuilding(cell.buildingId || "");
  if (!building) {
    return false;
  }

  const footprint = getBuildingFootprint(building, cell.buildingOrientation);

  // Remove all tiles in footprint
  for (let dy = 0; dy < footprint.height; dy++) {
    for (let dx = 0; dx < footprint.width; dx++) {
      const gx = originX + dx;
      const gy = originY + dy;

      if (gx < GRID_WIDTH && gy < GRID_HEIGHT) {
        const underlying = grid[gy][gx].underlyingTileType || TileType.Grass;
        grid[gy][gx] = { type: underlying, x: gx, y: gy, isOrigin: true };
      }
    }
  }

  return true;
}

/**
 * Erases a single tile, converting it back to grass
 *
 * @param grid - Grid to modify (will be mutated)
 * @param x - Grid X coordinate
 * @param y - Grid Y coordinate
 * @returns True if tile was erased, false if already grass
 */
export function eraseTile(
  grid: GridCell[][],
  x: number,
  y: number
): boolean {
  const cell = grid[y][x];

  if (cell.type === TileType.Grass) {
    return false;
  }

  grid[y][x] = { type: TileType.Grass, x, y, isOrigin: true };
  return true;
}
