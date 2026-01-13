import Phaser from "phaser";
import { GameSystem } from "./GameSystem";
import type { GridCell } from "../types";
import { GRID_WIDTH, GRID_HEIGHT } from "../types";

/**
 * Utility types that can be placed on the grid
 */
export enum UtilityType {
  PowerLine = "power_line",
  WaterPipe = "water_pipe",
  PowerPole = "power_pole", // Extends power line reach
  WaterTower = "water_tower", // Extends water pipe reach
}

/**
 * Utility tile placed on the grid
 */
export interface UtilityTile {
  x: number;
  y: number;
  type: UtilityType;
  networkId?: string; // ID of connected network
}

/**
 * Utility network (connected graph of utilities + buildings)
 */
export interface UtilityNetwork {
  id: string;
  type: "power" | "water";
  tiles: Set<string>; // Set of "x,y" tile coordinates
  sourceBuildings: Set<string>; // Building IDs that produce power/water
  connectedBuildings: Set<string>; // Building IDs connected to network
  totalOutput: number; // Total power/water production
  totalDemand: number; // Total power/water consumption
}

/**
 * Utility coverage stats
 */
export interface UtilityStats {
  totalPowerLines: number;
  totalWaterPipes: number;
  totalPowerPoles: number;
  totalWaterTowers: number;
  powerNetworks: number;
  waterNetworks: number;
  buildingsWithPower: number;
  buildingsWithWater: number;
  buildingsWithoutPower: number;
  buildingsWithoutWater: number;
  totalPowerOutput: number;
  totalPowerDemand: number;
  totalWaterOutput: number;
  totalWaterDemand: number;
}

/**
 * Utility costs
 */
export interface UtilityCost {
  scrap: number;
  caps: number;
}

/**
 * UtilitiesNetworkSystem - SimCity-style utility networks
 *
 * Features:
 * - Power lines connect buildings to power sources
 * - Water pipes connect buildings to water sources
 * - Network detection via flood fill
 * - Building connectivity validation
 * - Coverage visualization for overlays
 * - Power poles and water towers extend reach
 *
 * Wasteland Theme:
 * - Power lines = Makeshift cables
 * - Water pipes = Scrap pipes
 * - Power poles = Salvaged poles
 * - Water towers = Water storage tanks
 */
export class UtilitiesNetworkSystem implements GameSystem {
  private scene!: Phaser.Scene;

  // Utility map (stores utility tiles)
  private utilityMap: Map<string, UtilityTile> = new Map();

  // Networks (keyed by network ID)
  private powerNetworks: Map<string, UtilityNetwork> = new Map();
  private waterNetworks: Map<string, UtilityNetwork> = new Map();

  // Power source buildings (building IDs)
  private readonly POWER_SOURCES = [
    "solar-array",
    "generator",
    "wind-turbine",
    "nuclear-reactor",
  ];

  // Water source buildings (building IDs)
  private readonly WATER_SOURCES = [
    "water-purifier",
    "water-pump",
    "well",
    "desalination-plant",
  ];

  // Buildings that consume power
  private readonly POWER_CONSUMERS = [
    "water-purifier",
    "hydroponic-farm",
    "med-tent",
    "radio-tower",
    "trading-post",
  ];

  // Buildings that consume water
  private readonly WATER_CONSUMERS = [
    "hydroponic-farm",
    "med-tent",
  ];

  // Utility costs
  private readonly UTILITY_COSTS: Record<UtilityType, UtilityCost> = {
    [UtilityType.PowerLine]: { scrap: 2, caps: 0 },
    [UtilityType.WaterPipe]: { scrap: 3, caps: 0 },
    [UtilityType.PowerPole]: { scrap: 10, caps: 5 },
    [UtilityType.WaterTower]: { scrap: 15, caps: 10 },
  };

  // Utility reach (how many tiles away from a building)
  private readonly POWER_LINE_REACH = 1; // Must be adjacent
  private readonly WATER_PIPE_REACH = 1;
  private readonly POWER_POLE_REACH = 2; // Poles extend reach
  private readonly WATER_TOWER_REACH = 2;

  // Rendering
  private utilityGraphics!: Phaser.GameObjects.Graphics;

  /**
   * Initialize the utilities network system
   */
  init(scene: Phaser.Scene): void {
    this.scene = scene;

    // Create graphics for rendering utilities
    this.utilityGraphics = scene.add.graphics();
    this.utilityGraphics.setDepth(5); // Above ground, below buildings
  }

  /**
   * Update the system (recalculate networks periodically)
   */
  update(delta: number): void {
    // Rebuild networks every 5 seconds
    // (or trigger manually when utilities are placed/removed)
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.utilityGraphics?.destroy();
    this.utilityMap.clear();
    this.powerNetworks.clear();
    this.waterNetworks.clear();
  }

  /**
   * Place a utility tile on the grid
   */
  placeUtility(
    x: number,
    y: number,
    type: UtilityType,
    grid: GridCell[][]
  ): boolean {
    const key = `${x},${y}`;

    // Check if tile is valid
    if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) {
      return false;
    }

    const cell = grid[y][x];

    // Can only place utilities on grass, road, or existing utilities
    if (
      cell.type !== "grass" &&
      cell.type !== "road" &&
      !this.utilityMap.has(key)
    ) {
      return false;
    }

    // Don't place on top of buildings
    if (cell.buildingId) {
      return false;
    }

    // Check if utility already exists
    if (this.utilityMap.has(key)) {
      const existing = this.utilityMap.get(key)!;
      // Can't replace same type
      if (existing.type === type) {
        return false;
      }
      // Can upgrade power line to power pole
      if (
        type === UtilityType.PowerPole &&
        existing.type === UtilityType.PowerLine
      ) {
        this.utilityMap.set(key, { x, y, type });
        this.rebuildNetworks(grid);
        return true;
      }
      // Can upgrade water pipe to water tower
      if (
        type === UtilityType.WaterTower &&
        existing.type === UtilityType.WaterPipe
      ) {
        this.utilityMap.set(key, { x, y, type });
        this.rebuildNetworks(grid);
        return true;
      }
      return false;
    }

    // Place utility
    this.utilityMap.set(key, { x, y, type });

    // Rebuild networks
    this.rebuildNetworks(grid);

    return true;
  }

  /**
   * Remove a utility tile from the grid
   */
  removeUtility(x: number, y: number, grid: GridCell[][]): boolean {
    const key = `${x},${y}`;

    if (!this.utilityMap.has(key)) {
      return false;
    }

    this.utilityMap.delete(key);

    // Rebuild networks
    this.rebuildNetworks(grid);

    return true;
  }

  /**
   * Get utility at a position
   */
  getUtility(x: number, y: number): UtilityTile | undefined {
    return this.utilityMap.get(`${x},${y}`);
  }

  /**
   * Get all utilities
   */
  getAllUtilities(): UtilityTile[] {
    return Array.from(this.utilityMap.values());
  }

  /**
   * Rebuild all utility networks (power and water)
   */
  rebuildNetworks(grid: GridCell[][]): void {
    this.powerNetworks.clear();
    this.waterNetworks.clear();

    // Find all power source buildings
    const powerSources: { x: number; y: number; id: string }[] = [];
    const waterSources: { x: number; y: number; id: string }[] = [];

    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const cell = grid[y][x];
        if (cell.buildingId && cell.isOrigin) {
          if (this.POWER_SOURCES.includes(cell.buildingId)) {
            powerSources.push({ x, y, id: cell.buildingId });
          }
          if (this.WATER_SOURCES.includes(cell.buildingId)) {
            waterSources.push({ x, y, id: cell.buildingId });
          }
        }
      }
    }

    // Build power networks from each source
    powerSources.forEach((source) => {
      this.buildNetwork("power", source, grid);
    });

    // Build water networks from each source
    waterSources.forEach((source) => {
      this.buildNetwork("water", source, grid);
    });

    // Render networks
    this.renderUtilities();

    // Emit event for UI updates
    this.scene.events.emit("utilities:updated");
  }

  /**
   * Build a network from a source building using flood fill
   */
  private buildNetwork(
    type: "power" | "water",
    source: { x: number; y: number; id: string },
    grid: GridCell[][]
  ): void {
    const networkId = `${type}_${source.x}_${source.y}`;
    const network: UtilityNetwork = {
      id: networkId,
      type,
      tiles: new Set(),
      sourceBuildings: new Set([source.id]),
      connectedBuildings: new Set(),
      totalOutput: 0,
      totalDemand: 0,
    };

    // Flood fill from source building
    const queue: { x: number; y: number }[] = [source];
    const visited = new Set<string>();
    visited.add(`${source.x},${source.y}`);

    const utilityTypes =
      type === "power"
        ? [UtilityType.PowerLine, UtilityType.PowerPole]
        : [UtilityType.WaterPipe, UtilityType.WaterTower];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const key = `${current.x},${current.y}`;

      // Add to network
      network.tiles.add(key);

      // Check neighbors (4-directional)
      const neighbors = [
        { x: current.x - 1, y: current.y },
        { x: current.x + 1, y: current.y },
        { x: current.x, y: current.y - 1 },
        { x: current.x, y: current.y + 1 },
      ];

      for (const neighbor of neighbors) {
        const nKey = `${neighbor.x},${neighbor.y}`;

        // Skip if out of bounds or already visited
        if (
          neighbor.x < 0 ||
          neighbor.x >= GRID_WIDTH ||
          neighbor.y < 0 ||
          neighbor.y >= GRID_HEIGHT ||
          visited.has(nKey)
        ) {
          continue;
        }

        visited.add(nKey);

        const cell = grid[neighbor.y][neighbor.x];
        const utility = this.utilityMap.get(nKey);

        // If there's a utility of the right type, add to network
        if (utility && utilityTypes.includes(utility.type)) {
          queue.push(neighbor);
          continue;
        }

        // If there's a building, check if it's a source or consumer
        if (cell.buildingId && cell.isOrigin) {
          const buildingId = cell.buildingId;

          // Check if it's a source building
          const sources =
            type === "power" ? this.POWER_SOURCES : this.WATER_SOURCES;
          if (sources.includes(buildingId)) {
            network.sourceBuildings.add(buildingId);
            queue.push(neighbor); // Continue flood fill through source buildings
            continue;
          }

          // Check if it's a consumer building
          const consumers =
            type === "power" ? this.POWER_CONSUMERS : this.WATER_CONSUMERS;
          if (consumers.includes(buildingId)) {
            network.connectedBuildings.add(buildingId);
            // Don't continue flood fill through consumer buildings
            continue;
          }
        }
      }
    }

    // Store network
    if (type === "power") {
      this.powerNetworks.set(networkId, network);
    } else {
      this.waterNetworks.set(networkId, network);
    }
  }

  /**
   * Check if a building is connected to power
   */
  isBuildingConnectedToPower(x: number, y: number, grid: GridCell[][]): boolean {
    const cell = grid[y]?.[x];
    if (!cell || !cell.buildingId) {
      return false;
    }

    const buildingId = cell.buildingId;

    // Check if building is a power source (always has power)
    if (this.POWER_SOURCES.includes(buildingId)) {
      return true;
    }

    // Check if building is in any power network
    for (const network of this.powerNetworks.values()) {
      if (network.connectedBuildings.has(buildingId)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if a building is connected to water
   */
  isBuildingConnectedToWater(x: number, y: number, grid: GridCell[][]): boolean {
    const cell = grid[y]?.[x];
    if (!cell || !cell.buildingId) {
      return false;
    }

    const buildingId = cell.buildingId;

    // Check if building is a water source (always has water)
    if (this.WATER_SOURCES.includes(buildingId)) {
      return true;
    }

    // Check if building is in any water network
    for (const network of this.waterNetworks.values()) {
      if (network.connectedBuildings.has(buildingId)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get utility coverage for a tile (for overlay system)
   */
  getUtilityCoverage(x: number, y: number): { power: number; water: number } {
    const key = `${x},${y}`;

    let power = 0;
    let water = 0;

    // Check if tile is in any power network
    for (const network of this.powerNetworks.values()) {
      if (network.tiles.has(key)) {
        power = 100;
        break;
      }
    }

    // Check if tile is in any water network
    for (const network of this.waterNetworks.values()) {
      if (network.tiles.has(key)) {
        water = 100;
        break;
      }
    }

    return { power, water };
  }

  /**
   * Get statistics about utilities
   */
  getStats(grid: GridCell[][]): UtilityStats {
    let totalPowerLines = 0;
    let totalWaterPipes = 0;
    let totalPowerPoles = 0;
    let totalWaterTowers = 0;

    for (const utility of this.utilityMap.values()) {
      switch (utility.type) {
        case UtilityType.PowerLine:
          totalPowerLines++;
          break;
        case UtilityType.WaterPipe:
          totalWaterPipes++;
          break;
        case UtilityType.PowerPole:
          totalPowerPoles++;
          break;
        case UtilityType.WaterTower:
          totalWaterTowers++;
          break;
      }
    }

    // Count buildings with/without utilities
    let buildingsWithPower = 0;
    let buildingsWithoutPower = 0;
    let buildingsWithWater = 0;
    let buildingsWithoutWater = 0;

    const processedBuildings = new Set<string>();

    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const cell = grid[y][x];
        if (cell.buildingId && cell.isOrigin) {
          const key = `${x},${y},${cell.buildingId}`;
          if (processedBuildings.has(key)) {
            continue;
          }
          processedBuildings.add(key);

          // Check if building needs power
          if (this.POWER_CONSUMERS.includes(cell.buildingId)) {
            if (this.isBuildingConnectedToPower(x, y, grid)) {
              buildingsWithPower++;
            } else {
              buildingsWithoutPower++;
            }
          }

          // Check if building needs water
          if (this.WATER_CONSUMERS.includes(cell.buildingId)) {
            if (this.isBuildingConnectedToWater(x, y, grid)) {
              buildingsWithWater++;
            } else {
              buildingsWithoutWater++;
            }
          }
        }
      }
    }

    // Calculate total output and demand
    let totalPowerOutput = 0;
    let totalPowerDemand = 0;
    let totalWaterOutput = 0;
    let totalWaterDemand = 0;

    // TODO: Integrate with building definitions to get actual production/consumption values

    return {
      totalPowerLines,
      totalWaterPipes,
      totalPowerPoles,
      totalWaterTowers,
      powerNetworks: this.powerNetworks.size,
      waterNetworks: this.waterNetworks.size,
      buildingsWithPower,
      buildingsWithoutPower,
      buildingsWithWater,
      buildingsWithoutWater,
      totalPowerOutput,
      totalPowerDemand,
      totalWaterOutput,
      totalWaterDemand,
    };
  }

  /**
   * Get cost to place a utility
   */
  getUtilityCost(type: UtilityType): UtilityCost {
    return this.UTILITY_COSTS[type];
  }

  /**
   * Render utilities on the grid
   */
  private renderUtilities(): void {
    if (!this.utilityGraphics) {
      return;
    }

    this.utilityGraphics.clear();

    // Render each utility
    for (const utility of this.utilityMap.values()) {
      const iso = this.gridToIso(utility.x, utility.y);

      // Choose color based on type
      let color = 0xffff00; // Yellow for power
      let lineWidth = 2;

      if (
        utility.type === UtilityType.WaterPipe ||
        utility.type === UtilityType.WaterTower
      ) {
        color = 0x00ccff; // Blue for water
      }

      if (
        utility.type === UtilityType.PowerPole ||
        utility.type === UtilityType.WaterTower
      ) {
        lineWidth = 4;
      }

      // Draw a simple line/cross to represent utility
      this.utilityGraphics.lineStyle(lineWidth, color, 0.6);
      this.utilityGraphics.strokeCircle(iso.x, iso.y, 8);
    }
  }

  /**
   * Convert grid coordinates to isometric screen coordinates
   */
  private gridToIso(gridX: number, gridY: number): { x: number; y: number } {
    const TILE_WIDTH = 44;
    const TILE_HEIGHT = 22;
    const OFFSET_X = 1056;
    const OFFSET_Y = 200;

    const isoX = (gridX - gridY) * (TILE_WIDTH / 2);
    const isoY = (gridX + gridY) * (TILE_HEIGHT / 2);

    return {
      x: isoX + OFFSET_X,
      y: isoY + OFFSET_Y,
    };
  }

  /**
   * Get all power networks
   */
  getPowerNetworks(): UtilityNetwork[] {
    return Array.from(this.powerNetworks.values());
  }

  /**
   * Get all water networks
   */
  getWaterNetworks(): UtilityNetwork[] {
    return Array.from(this.waterNetworks.values());
  }
}
