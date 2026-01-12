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
  // Zone types (SimCity-style)
  Zone = "zone",
}

/**
 * Zone types for SimCity-style zoning system
 * Residential = Housing (Shantytown settlements)
 * Commercial = Trading posts (Market camps)
 * Industrial = Production facilities (Scrap yards, factories)
 */
export enum ZoneType {
  Residential = "residential",
  Commercial = "commercial",
  Industrial = "industrial",
}

/**
 * Zone density levels - affects building size and capacity
 */
export enum ZoneDensity {
  Low = "low",
  Medium = "medium",
  High = "high",
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
  // Zoning tools
  ZoneResidential = "zoneResidential",
  ZoneCommercial = "zoneCommercial",
  ZoneIndustrial = "zoneIndustrial",
  Dezone = "dezone",
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
  // Zoning data
  zoneType?: ZoneType;
  zoneDensity?: ZoneDensity;
  zoneDevelopmentLevel?: number; // 0-100, affects automatic building growth
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
 * Base resource types (materials/currency) - used for building costs
 */
export interface BaseResources {
  scrap: number;
  food: number;
  water: number;
  power: number;
  medicine: number;
  caps: number;
}

/**
 * Full resources including population state
 */
export interface Resources extends BaseResources {
  population: number;
  maxPopulation: number;
  happiness: number;
}

/**
 * Building costs use only base resources
 */
export type ResourceCost = Partial<BaseResources>;

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

/**
 * Population consumption rates per capita per second
 */
export const CONSUMPTION_PER_CAPITA = {
  food: 0.05,
  water: 0.08,
  power: 0.02,
} as const;

/**
 * Population growth/death thresholds
 */
export const POPULATION_CONFIG = {
  growthInterval: 30,
  growthHappinessMin: 60,
  deathNoFoodInterval: 20,
  deathNoWaterInterval: 15,
  happinessDecayRate: 2,
  happinessRecoveryRate: 1,
  baseHappiness: 70,
} as const;

/**
 * Worker assignment for a building instance
 */
export interface WorkerAssignment {
  buildingInstanceId: string;
  buildingId: string;
  workersAssigned: number;
  workersRequired: number;
  priority: number;
  x: number;
  y: number;
}

/**
 * Game event types
 */
export type GameEventType =
  | "raid"
  | "caravan"
  | "radstorm"
  | "refugees"
  | "disease"
  | "discovery";

/**
 * Game event definition
 */
export interface GameEvent {
  id: string;
  type: GameEventType;
  name: string;
  description: string;
  effect: Partial<Resources>;
  rateEffect?: ResourceRate;
  duration?: number;
  choices?: GameEventChoice[];
  timestamp: number;
}

/**
 * Event choice option
 */
export interface GameEventChoice {
  label: string;
  description: string;
  effect: Partial<Resources>;
}

/**
 * Population state for save/load
 */
export interface PopulationState {
  current: number;
  max: number;
  happiness: number;
  lastGrowthCheck: number;
  foodDepletedAt?: number;
  waterDepletedAt?: number;
}

/**
 * Zone demand tracking (RCI bars in SimCity)
 * Values range from -100 (no demand) to +100 (high demand)
 */
export interface ZoneDemand {
  residential: number; // Demand for housing
  commercial: number; // Demand for shops/trading
  industrial: number; // Demand for production facilities
}

/**
 * Zone statistics for a specific zone type
 */
export interface ZoneStats {
  zoneType: ZoneType;
  totalZones: number; // Total zoned tiles
  developedZones: number; // Zones with buildings
  undevelopedZones: number; // Empty zones waiting for growth
  totalPopulation?: number; // For residential zones
  totalJobs?: number; // For commercial/industrial zones
  averageDevelopmentLevel: number; // Average development progress (0-100)
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
  cost?: ResourceCost;
  produces?: ResourceRate;
  consumes?: ResourceRate;
  storage?: Partial<BaseResources>;
  housingCapacity?: number;
  workersRequired?: number;
  description?: string;
}

export interface GameState {
  grid: GridCell[][];
  zoom: number;
  cameraX: number;
  cameraY: number;
  resources?: Resources;
  resourceCapacity?: Resources;
  populationState?: PopulationState;
  workerAssignments?: WorkerAssignment[];
  eventHistory?: GameEvent[];
  gameTime?: number;
  // Zoning system state
  zoneDemand?: ZoneDemand;
  zoneStats?: {
    residential: ZoneStats;
    commercial: ZoneStats;
    industrial: ZoneStats;
  };
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
