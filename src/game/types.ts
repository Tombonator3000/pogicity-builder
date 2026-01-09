export enum TileType {
  Grass = "grass",
  Road = "road",
  Asphalt = "asphalt",
  Tile = "tile",
  Snow = "snow",
  Building = "building",
  // Post-apocalyptic terrain types
  Wasteland = "wasteland",
  Radiation = "radiation",
  Contaminated = "contaminated",
  Rubble = "rubble",
  DeadForest = "deadForest",
}

export enum ToolType {
  None = "none",
  RoadNetwork = "roadNetwork",
  Asphalt = "asphalt",
  Tile = "tile",
  Snow = "snow",
  Building = "building",
  Eraser = "eraser",
  // Post-apocalyptic tools
  Wasteland = "wasteland",
  Rubble = "rubble",
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
  | "christmas"
  // Post-apocalyptic categories
  | "resource"
  | "defense"
  | "infrastructure";

/**
 * Resource types for post-apocalyptic economy
 */
export interface Resources {
  scrap: number;      // Salvaged metal/materials
  food: number;       // Sustenance for population
  water: number;      // Clean water (critical)
  power: number;      // Electricity generation
  medicine: number;   // Healthcare supplies
  caps: number;       // Currency/bottlecaps
}

/**
 * Building resource production/consumption rates (per second)
 */
export interface ResourceRate {
  scrap?: number;
  food?: number;
  water?: number;
  power?: number;
  medicine?: number;
  caps?: number;
}

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
  // Post-apocalyptic resource system
  cost?: Resources;              // Resource cost to build
  produces?: ResourceRate;       // Resources produced per second
  consumes?: ResourceRate;       // Resources consumed per second
  storage?: Partial<Resources>;  // Storage capacity increase
  description?: string;          // Tooltip description
}

export interface GameState {
  grid: GridCell[][];
  zoom: number;
  cameraX: number;
  cameraY: number;
  // Post-apocalyptic resources
  resources?: Resources;
  resourceCapacity?: Resources;
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
