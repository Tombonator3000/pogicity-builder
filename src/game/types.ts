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
  // Query tool
  Query = "query",
}

/**
 * Overlay types for data visualization (SimCity-style data maps)
 */
export enum OverlayType {
  None = "none",
  Power = "power",           // Power coverage (green = powered, red = no power)
  Water = "water",           // Water coverage (blue = water, red = no water)
  Radiation = "radiation",   // Radiation levels (green = safe, yellow/red = dangerous)
  Crime = "crime",           // Crime/raider threat (green = safe, red = high threat)
  Fire = "fire",             // Fire hazard (green = protected, red = high risk)
  Happiness = "happiness",   // Happiness/satisfaction (green = happy, red = unhappy)
  Population = "population", // Population density (gradient based on density)
  LandValue = "landValue",   // Land/salvage value (green = high value, red = low)
  ZoneDemand = "zoneDemand", // RCI zone demand (shows which zones are needed)
  Traffic = "traffic",       // Traffic density (green = clear, red = congested)
  Employment = "employment", // Job availability (green = jobs available, red = unemployment)
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
  // Overlay data (computed by OverlaySystem)
  overlayData?: OverlayData;
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

/**
 * Overlay data for a single grid cell
 * Values typically range from 0 (none/bad) to 100 (full/good)
 */
export interface OverlayData {
  power?: number;        // 0-100: Power coverage percentage
  water?: number;        // 0-100: Water coverage percentage
  radiation?: number;    // 0-100: Radiation level (higher = worse)
  crime?: number;        // 0-100: Crime/threat level (higher = worse)
  fire?: number;         // 0-100: Fire hazard level (higher = worse)
  happiness?: number;    // 0-100: Happiness level
  population?: number;   // Actual population count on this tile
  landValue?: number;    // 0-100: Land/salvage value
  traffic?: number;      // 0-100: Traffic density (higher = more congested)
  employment?: number;   // 0-100: Employment availability (higher = more jobs)
}

/**
 * Historical data point for graphs
 */
export interface HistoricalDataPoint {
  timestamp: number;     // Game time in seconds
  population: number;
  happiness: number;
  resources: Partial<Resources>;
  zoneDemand?: ZoneDemand;
  income?: number;       // For budget system
  expenses?: number;     // For budget system
}

/**
 * Query result for a grid cell (when using Query tool)
 */
export interface QueryResult {
  x: number;
  y: number;
  tileType: TileType;
  building?: {
    id: string;
    name: string;
    category: BuildingCategory;
    produces?: ResourceRate;
    consumes?: ResourceRate;
    workersAssigned?: number;
    workersRequired?: number;
    status?: string;
  };
  zone?: {
    type: ZoneType;
    density: ZoneDensity;
    developmentLevel: number;
  };
  overlayData?: OverlayData;
  issues?: string[];     // List of problems (e.g., "No power", "High crime")
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

/**
 * Road types with different traffic capacities
 */
export enum RoadType {
  Basic = "basic",       // Low capacity: 100 cars/day
  Avenue = "avenue",     // Medium capacity: 300 cars/day
  Highway = "highway",   // High capacity: 1000 cars/day
}

/**
 * Road capacity configuration
 */
export const ROAD_CAPACITY: Record<RoadType, number> = {
  [RoadType.Basic]: 100,
  [RoadType.Avenue]: 300,
  [RoadType.Highway]: 1000,
};

/**
 * Congestion levels based on traffic volume / capacity ratio
 */
export enum CongestionLevel {
  None = "none",           // 0-25%
  Light = "light",         // 25-50%
  Medium = "medium",       // 50-75%
  Heavy = "heavy",         // 75-100%
  Gridlock = "gridlock",   // 100%+
}

/**
 * Commuter state machine
 */
export enum CommuterState {
  AtHome = "atHome",
  TravelingToWork = "travelingToWork",
  AtWork = "atWork",
  TravelingHome = "travelingHome",
}

/**
 * A commuter (sim) that travels between residential and work zones
 */
export interface Commuter {
  id: string;
  homeX: number;          // Residential zone location
  homeY: number;
  workX: number;          // Commercial/Industrial zone location
  workY: number;
  currentX: number;       // Current position on path
  currentY: number;
  state: CommuterState;
  path?: { x: number; y: number }[]; // Current pathfinding route
  pathIndex?: number;     // Progress along path
  usingTransit?: boolean; // Using mass transit instead of roads
}

/**
 * Traffic data for a single road tile
 */
export interface TrafficData {
  x: number;
  y: number;
  roadType: RoadType;
  volume: number;         // Number of cars using this road
  capacity: number;       // Max cars based on road type
  congestion: number;     // 0-100+ (percentage of capacity)
  congestionLevel: CongestionLevel;
}

/**
 * Mass transit types
 */
export enum MassTransitType {
  Bus = "bus",
  Subway = "subway",
  Train = "train",
}

/**
 * Mass transit stop/station
 */
export interface TransitStop {
  id: string;
  type: MassTransitType;
  x: number;
  y: number;
  ridership: number;      // Number of commuters using this stop
  routeIds: string[];     // Routes serving this stop
}

/**
 * Mass transit route
 */
export interface TransitRoute {
  id: string;
  type: MassTransitType;
  stops: string[];        // Stop IDs in order
  capacity: number;       // Max commuters per day
  cost: number;           // Monthly maintenance cost
  ridership: number;      // Current commuters using route
}

/**
 * Pollution types
 */
export enum PollutionType {
  Air = "air",         // From industry, power, traffic
  Water = "water",     // From sewage, industry
  Ground = "ground",   // From landfills, toxic waste
  Radiation = "radiation", // Wasteland-specific (already exists in overlay)
}

/**
 * Pollution source definition
 */
export interface PollutionSource {
  x: number;
  y: number;
  type: PollutionType;
  amount: number;      // Pollution units per update
  radius: number;      // Spread radius
  buildingId?: string; // Source building (if any)
}

/**
 * Pollution data for a grid cell
 */
export interface PollutionData {
  x: number;
  y: number;
  airPollution: number;     // 0-100+
  waterPollution: number;   // 0-100+
  groundPollution: number;  // 0-100+
  totalPollution: number;   // Sum of all types
}

/**
 * Advisor types (SimCity-style city advisors)
 */
export enum AdvisorType {
  Financial = "financial",       // Budget, taxes, loans
  Safety = "safety",             // Police, fire, disasters
  Utilities = "utilities",       // Power, water, sewage
  Transportation = "transportation", // Traffic, roads, transit
  Environmental = "environmental", // Pollution, parks
}

/**
 * Advisor message severity
 */
export enum AdvisorSeverity {
  Info = "info",         // General information
  Warning = "warning",   // Attention needed
  Critical = "critical", // Urgent action required
}

/**
 * Advisor message
 */
export interface AdvisorMessage {
  id: string;
  advisorType: AdvisorType;
  severity: AdvisorSeverity;
  title: string;
  message: string;
  timestamp: number;
  location?: { x: number; y: number }; // Optional location reference
  dismissed?: boolean;
}

/**
 * Petition from citizens (requested changes)
 */
export interface CitizenPetition {
  id: string;
  type: 'park' | 'service' | 'infrastructure' | 'policy';
  title: string;
  description: string;
  location?: { x: number; y: number };
  supportLevel: number; // 0-100 (percentage of citizens supporting)
  timestamp: number;
  resolved?: boolean;
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
  // Overlay system state
  activeOverlay?: OverlayType;
  // Historical data for graphs
  historicalData?: HistoricalDataPoint[];
  // Traffic system state
  commuters?: Commuter[];
  trafficData?: Map<string, TrafficData>; // Key: "x,y"
  transitStops?: TransitStop[];
  transitRoutes?: TransitRoute[];
  // Pollution system state
  pollutionData?: Map<string, PollutionData>; // Key: "x,y"
  pollutionSources?: PollutionSource[];
  // Advisor system state
  advisorMessages?: AdvisorMessage[];
  citizenPetitions?: CitizenPetition[];
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

/**
 * ========================================
 * PHASE 4: Content Systems (Scenarios, Ordinances, Disasters)
 * ========================================
 */

/**
 * Objective types for scenarios
 */
export enum ObjectiveType {
  Population = "population",           // Reach X population
  Happiness = "happiness",             // Maintain X happiness
  Resources = "resources",             // Collect X resources
  Buildings = "buildings",             // Build X buildings
  ZoneDevelopment = "zoneDevelopment", // Develop X zones
  Budget = "budget",                   // Reach X caps
  Survival = "survival",               // Survive X days
  DisasterSurvival = "disasterSurvival", // Survive a disaster
  Pollution = "pollution",             // Keep pollution below X
  Custom = "custom",                   // Custom condition
}

/**
 * Objective definition
 */
export interface Objective {
  id: string;
  type: ObjectiveType;
  title: string;
  description: string;
  target: number;
  current: number;
  completed: boolean;
  required: boolean; // Must complete to win scenario
  hidden?: boolean;  // Hidden until revealed
}

/**
 * Scenario difficulty
 */
export enum ScenarioDifficulty {
  Tutorial = "tutorial",
  Easy = "easy",
  Medium = "medium",
  Hard = "hard",
  Expert = "expert",
}

/**
 * Scenario definition
 */
export interface Scenario {
  id: string;
  name: string;
  description: string;
  difficulty: ScenarioDifficulty;
  objectives: Objective[];
  startingResources: Resources;
  startingBuildings?: Array<{
    buildingId: string;
    x: number;
    y: number;
    orientation: Direction;
  }>;
  timeLimit?: number; // In seconds (optional)
  disasterFrequency?: number; // Multiplier for disaster probability
  specialRules?: string[]; // Custom rules text
  rewards?: {
    unlockBuildings?: string[];
    unlockScenarios?: string[];
    achievement?: string;
  };
}

/**
 * Achievement types
 */
export enum AchievementCategory {
  Population = "population",
  Building = "building",
  Economy = "economy",
  Survival = "survival",
  Scenario = "scenario",
  Special = "special",
}

/**
 * Achievement definition
 */
export interface Achievement {
  id: string;
  category: AchievementCategory;
  name: string;
  description: string;
  icon?: string;
  requirement: {
    type: string;
    value: number;
  };
  unlocked: boolean;
  unlockedAt?: number; // Timestamp
  secret?: boolean; // Hidden until unlocked
}

/**
 * Mayor rating levels (SimCity-style)
 */
export enum MayorRating {
  Outcast = "outcast",           // 0-20: Terrible performance
  Settler = "settler",           // 21-40: Poor performance
  Overseer = "overseer",         // 41-60: Average performance
  Guardian = "guardian",         // 61-80: Good performance
  WastelandHero = "wastelandHero", // 81-95: Excellent performance
  Legend = "legend",             // 96-100: Perfect performance
}

/**
 * Mayor rating factors
 */
export interface MayorRatingFactors {
  population: number;        // Population size (0-100)
  happiness: number;         // Average happiness (0-100)
  economy: number;           // Budget health (0-100)
  infrastructure: number;    // Coverage & services (0-100)
  environment: number;       // Pollution control (0-100)
  safety: number;            // Crime & disaster management (0-100)
}

/**
 * Ordinance/Policy types (SimCity-style city ordinances)
 */
export enum OrdinanceCategory {
  Finance = "finance",       // Tax & budget policies
  Safety = "safety",         // Security & disaster prep
  Environment = "environment", // Pollution & conservation
  Social = "social",         // Population policies
  Industry = "industry",     // Production & trade
}

/**
 * Ordinance definition
 */
export interface Ordinance {
  id: string;
  category: OrdinanceCategory;
  name: string;
  description: string;
  monthlyCost: number; // Monthly budget cost
  effects: {
    happinessModifier?: number;    // +/- happiness
    taxRateModifier?: number;      // +/- tax income
    pollutionModifier?: number;    // +/- pollution
    productionModifier?: number;   // +/- resource production
    disasterRiskModifier?: number; // +/- disaster probability
    crimeModifier?: number;        // +/- crime rate
  };
  requirements?: {
    minPopulation?: number;
    minBudget?: number;
    requiredBuildings?: string[];
  };
  enabled: boolean;
}

/**
 * Disaster types (wasteland-themed)
 */
export enum DisasterType {
  // Natural disasters
  Radstorm = "radstorm",               // Radiation storm
  DustStorm = "duststorm",             // Wasteland dust storm
  Earthquake = "earthquake",           // Earthquake
  // Hostile events
  RaiderAssault = "raiderAssault",     // Major raider attack
  SuperMutantInvasion = "superMutantInvasion", // Super mutant raid
  FeralhGoulPlague = "feralGhoulPlague", // Feral ghoul infestation
  // Infrastructure disasters
  ReactorMeltdown = "reactorMeltdown", // Nuclear reactor failure
  WaterContamination = "waterContamination", // Water supply poisoned
  Fire = "fire",                       // Spreading fire
  // Creature attacks
  DeathclawAttack = "deathclawAttack", // Deathclaw rampage
  RadscorpionSwarm = "radscorpionSwarm", // Radscorpion infestation
}

/**
 * Disaster severity
 */
export enum DisasterSeverity {
  Minor = "minor",       // Small area, low damage
  Moderate = "moderate", // Medium area, moderate damage
  Major = "major",       // Large area, high damage
  Catastrophic = "catastrophic", // Massive area, devastating damage
}

/**
 * Building damage state
 */
export enum DamageState {
  None = "none",           // No damage (100%)
  Light = "light",         // Light damage (75-99%)
  Moderate = "moderate",   // Moderate damage (50-74%)
  Heavy = "heavy",         // Heavy damage (25-49%)
  Critical = "critical",   // Critical damage (1-24%)
  Destroyed = "destroyed", // Completely destroyed (0%)
}

/**
 * Disaster instance (active disaster)
 */
export interface Disaster {
  id: string;
  type: DisasterType;
  severity: DisasterSeverity;
  name: string;
  description: string;
  epicenter: { x: number; y: number };
  radius: number;
  startTime: number;
  duration: number; // In seconds
  active: boolean;
  damageDealt: number;
  buildingsAffected: string[]; // Building IDs
  warning?: {
    warningTime: number; // Seconds before disaster
    message: string;
  };
}

/**
 * Building damage information
 */
export interface BuildingDamage {
  buildingId: string;
  damageState: DamageState;
  healthPercent: number; // 0-100
  repairCost: ResourceCost;
  productionPenalty: number; // 0-1 (percentage of production lost)
}

/**
 * Scenario progress tracking
 */
export interface ScenarioProgress {
  scenarioId: string;
  startTime: number;
  elapsedTime: number;
  objectiveProgress: Record<string, number>; // objective ID -> current value
  completed: boolean;
  victory: boolean;
  score?: number;
}
