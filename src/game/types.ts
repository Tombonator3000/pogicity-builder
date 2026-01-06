export enum TileType {
  Grass = "grass",
  Road = "road",
  Water = "water",
  Building = "building",
}

export enum ToolType {
  None = "none",
  Road = "road",
  Building = "building",
  Eraser = "eraser",
}

export enum Direction {
  Up = "up",
  Down = "down",
  Left = "left",
  Right = "right",
}

export interface GridCell {
  type: TileType;
  x: number;
  y: number;
  isOrigin?: boolean;
  originX?: number;
  originY?: number;
  buildingId?: string;
  buildingOrientation?: Direction;
}

export type BuildingCategory = "residential" | "commercial" | "civic" | "props";

export interface BuildingDefinition {
  id: string;
  name: string;
  category: BuildingCategory;
  footprint: { width: number; height: number };
  color: string;
  icon: string;
}

export interface GameState {
  grid: GridCell[][];
  zoom: number;
  cameraX: number;
  cameraY: number;
}

// Isometric constants
export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;
export const GRID_SIZE = 32;

// Convert grid coordinates to screen coordinates
export function gridToScreen(gridX: number, gridY: number): { x: number; y: number } {
  return {
    x: (gridX - gridY) * (TILE_WIDTH / 2),
    y: (gridX + gridY) * (TILE_HEIGHT / 2),
  };
}

// Convert screen coordinates to grid coordinates
export function screenToGrid(screenX: number, screenY: number): { x: number; y: number } {
  return {
    x: Math.floor(screenX / TILE_WIDTH + screenY / TILE_HEIGHT),
    y: Math.floor(screenY / TILE_HEIGHT - screenX / TILE_WIDTH),
  };
}
