export enum TileType {
  Grass = "grass",
  Road = "road",
  Asphalt = "asphalt",
  Tile = "tile",
  Snow = "snow",
  Building = "building",
}

export enum ToolType {
  None = "none",
  RoadNetwork = "roadNetwork",
  Asphalt = "asphalt",
  Tile = "tile",
  Snow = "snow",
  Building = "building",
  Eraser = "eraser",
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
  underlyingTileType?: TileType;
}

export enum Direction {
  Up = "up",
  Down = "down",
  Left = "left",
  Right = "right",
}

export enum CharacterType {
  Banana = "banana",
  Apple = "apple",
}

export interface Character {
  id: string;
  x: number;
  y: number;
  direction: Direction;
  speed: number;
  characterType: CharacterType;
}

export enum CarType {
  Jeep = "jeep",
  Taxi = "taxi",
}

export interface Car {
  id: string;
  x: number;
  y: number;
  direction: Direction;
  speed: number;
  waiting: number;
  carType: CarType;
}

export type BuildingCategory =
  | "residential"
  | "commercial"
  | "civic"
  | "landmark"
  | "props"
  | "christmas";

export interface BuildingDefinition {
  id: string;
  name: string;
  category: BuildingCategory;
  footprint: { width: number; height: number };
  footprintByOrientation?: {
    south?: { width: number; height: number };
    north?: { width: number; height: number };
    east?: { width: number; height: number };
    west?: { width: number; height: number };
  };
  renderSize?: { width: number; height: number };
  sprites: {
    south: string;
    west?: string;
    north?: string;
    east?: string;
  };
  icon: string;
  supportsRotation?: boolean;
  isDecoration?: boolean;
}

export interface GameState {
  grid: GridCell[][];
  zoom: number;
  cameraX: number;
  cameraY: number;
}

// Isometric constants - matching original repo (44x22)
export const TILE_WIDTH = 44;
export const TILE_HEIGHT = 22;
export const GRID_WIDTH = 48;
export const GRID_HEIGHT = 48;

// Character and car speeds
export const CHARACTER_SPEED = 0.015;
export const CAR_SPEED = 0.05;

// Grid offset for centering
export const GRID_OFFSET_X = 1200;
export const GRID_OFFSET_Y = 100;

// Convert grid coordinates to isometric screen position
export function gridToIso(gridX: number, gridY: number): { x: number; y: number } {
  return {
    x: (gridX - gridY) * (TILE_WIDTH / 2),
    y: (gridX + gridY) * (TILE_HEIGHT / 2),
  };
}

// Convert isometric screen coordinates back to grid coordinates
export function isoToGrid(isoX: number, isoY: number): { x: number; y: number } {
  return {
    x: (isoX / (TILE_WIDTH / 2) + isoY / (TILE_HEIGHT / 2)) / 2,
    y: (isoY / (TILE_HEIGHT / 2) - isoX / (TILE_WIDTH / 2)) / 2,
  };
}
