import Phaser from 'phaser';
import { GameSystem } from './GameSystem';
import {
  GridCell,
  TileType,
  ZoneType,
  PollutionType,
  PollutionSource,
  PollutionData,
  BuildingCategory,
  GRID_WIDTH,
  GRID_HEIGHT,
} from '../types';

/**
 * Pollution System Configuration
 */
export const POLLUTION_CONFIG = {
  updateInterval: 5000, // Update pollution every 5 seconds
  diffusionRate: 0.1, // How fast pollution spreads to neighbors (0-1)
  decayRate: 0.02, // Natural pollution decay per update
  maxPollution: 150, // Cap pollution at this value

  // Pollution production rates
  industrialZonePollution: 10, // Air pollution per industrial zone
  powerPlantPollution: 15, // Air pollution per power plant
  trafficPollutionBase: 2, // Base air pollution per congested road tile
  landfillPollution: 8, // Ground pollution per landfill

  // Pollution reduction
  parkReduction: 5, // Air pollution reduced by parks (in radius)
  treeReduction: 2, // Air pollution reduced by trees
  parkRadius: 5, // Park pollution reduction radius

  // Pollution effects
  healthImpact: {
    // Happiness reduction per 10 pollution units
    0: 0, // No impact below 20 pollution
    20: 1,
    40: 2,
    60: 5,
    80: 10,
    100: 20,
  },
  landValueImpact: {
    // Land value reduction percentage
    0: 0,
    20: 5,
    40: 15,
    60: 30,
    80: 50,
    100: 80,
  },
} as const;

/**
 * PollutionSystem
 * Manages environmental pollution from industry, traffic, and power plants.
 *
 * Features:
 * - Multiple pollution types (air, water, ground, radiation)
 * - Pollution sources from buildings and zones
 * - Diffusion algorithm (spreads to neighbors)
 * - Natural decay over time
 * - Traffic-based pollution
 * - Pollution effects on health and land value
 * - Pollution reduction from parks and trees
 * - Pollution overlay visualization
 */
export class PollutionSystem implements GameSystem {
  private scene!: Phaser.Scene;
  private pollutionData: Map<string, PollutionData> = new Map();
  private pollutionSources: PollutionSource[] = [];
  private lastUpdateTime: number = 0;

  /**
   * Initialize the pollution system
   */
  init(scene: Phaser.Scene): void {
    this.scene = scene;
    this.lastUpdateTime = Date.now();
    console.log('[PollutionSystem] Initialized');
  }

  /**
   * Update pollution calculations
   */
  update(delta: number): void {
    const now = Date.now();
    if (now - this.lastUpdateTime >= POLLUTION_CONFIG.updateInterval) {
      this.updatePollution();
      this.lastUpdateTime = now;
    }
  }

  /**
   * Main pollution update logic
   */
  private updatePollution(): void {
    const grid = (this.scene as any).getGrid?.();
    if (!grid) return;

    // 1. Identify pollution sources
    this.identifyPollutionSources(grid);

    // 2. Calculate pollution from sources
    this.calculateSourcePollution();

    // 3. Add traffic pollution
    this.addTrafficPollution();

    // 4. Spread pollution to neighbors (diffusion)
    this.diffusePollution(grid);

    // 5. Apply pollution reduction (parks, trees)
    this.applyPollutionReduction(grid);

    // 6. Natural decay
    this.applyDecay();

    // 7. Calculate total pollution
    this.calculateTotalPollution();

    // Emit event for overlays
    this.scene.events.emit('pollution:updated', this.pollutionData);
  }

  /**
   * Identify pollution sources from buildings and zones
   */
  private identifyPollutionSources(grid: GridCell[][]): void {
    this.pollutionSources = [];

    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const cell = grid[y][x];

        // Industrial zones produce air pollution
        if (
          cell.type === TileType.Zone &&
          cell.zoneType === ZoneType.Industrial &&
          cell.buildingId
        ) {
          this.pollutionSources.push({
            x,
            y,
            type: PollutionType.Air,
            amount: POLLUTION_CONFIG.industrialZonePollution,
            radius: 8,
            buildingId: cell.buildingId,
          });
        }

        // Power plants (infrastructure buildings) produce air pollution
        if (cell.type === TileType.Building && cell.buildingId) {
          const buildingDef = this.getBuildingDefinition(cell.buildingId);
          if (buildingDef?.category === 'infrastructure') {
            // Check if it produces power (power plant)
            if (buildingDef.produces?.power && buildingDef.produces.power > 0) {
              this.pollutionSources.push({
                x,
                y,
                type: PollutionType.Air,
                amount: POLLUTION_CONFIG.powerPlantPollution,
                radius: 10,
                buildingId: cell.buildingId,
              });
            }
          }
        }

        // Radiation sources (wasteland theme)
        if (cell.type === TileType.Radiation) {
          this.pollutionSources.push({
            x,
            y,
            type: PollutionType.Radiation,
            amount: 15,
            radius: 5,
          });
        }
      }
    }
  }

  /**
   * Calculate pollution from identified sources
   */
  private calculateSourcePollution(): void {
    this.pollutionSources.forEach((source) => {
      // Apply pollution in radius around source
      for (let dy = -source.radius; dy <= source.radius; dy++) {
        for (let dx = -source.radius; dx <= source.radius; dx++) {
          const targetX = source.x + dx;
          const targetY = source.y + dy;

          if (targetX < 0 || targetX >= GRID_WIDTH || targetY < 0 || targetY >= GRID_HEIGHT) {
            continue;
          }

          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance > source.radius) continue;

          // Pollution decreases with distance from source
          const falloff = 1 - distance / source.radius;
          const pollutionAmount = source.amount * falloff;

          this.addPollution(targetX, targetY, source.type, pollutionAmount);
        }
      }
    });
  }

  /**
   * Add pollution from traffic congestion
   */
  private addTrafficPollution(): void {
    const trafficSystem = (this.scene as any).trafficSystem;
    if (!trafficSystem) return;

    const trafficData = trafficSystem.getAllTrafficData?.();
    if (!trafficData) return;

    trafficData.forEach((data: any) => {
      // Traffic produces air pollution based on congestion
      const congestionMultiplier = trafficSystem.getPollutionMultiplier(data.x, data.y);
      const pollutionAmount = POLLUTION_CONFIG.trafficPollutionBase * congestionMultiplier;

      this.addPollution(data.x, data.y, PollutionType.Air, pollutionAmount);
    });
  }

  /**
   * Spread pollution to neighboring tiles (diffusion algorithm)
   */
  private diffusePollution(grid: GridCell[][]): void {
    const newPollution = new Map<string, PollutionData>();

    // Create copies for diffusion
    this.pollutionData.forEach((data, key) => {
      newPollution.set(key, { ...data });
    });

    // Diffuse pollution to neighbors
    this.pollutionData.forEach((data) => {
      const neighbors = [
        { x: data.x - 1, y: data.y },
        { x: data.x + 1, y: data.y },
        { x: data.x, y: data.y - 1 },
        { x: data.x, y: data.y + 1 },
      ];

      neighbors.forEach((neighbor) => {
        if (
          neighbor.x < 0 ||
          neighbor.x >= GRID_WIDTH ||
          neighbor.y < 0 ||
          neighbor.y >= GRID_HEIGHT
        ) {
          return;
        }

        const key = `${neighbor.x},${neighbor.y}`;
        const neighborData = newPollution.get(key) || {
          x: neighbor.x,
          y: neighbor.y,
          airPollution: 0,
          waterPollution: 0,
          groundPollution: 0,
          totalPollution: 0,
        };

        // Spread each type of pollution
        neighborData.airPollution += data.airPollution * POLLUTION_CONFIG.diffusionRate;
        neighborData.waterPollution += data.waterPollution * POLLUTION_CONFIG.diffusionRate;
        neighborData.groundPollution += data.groundPollution * POLLUTION_CONFIG.diffusionRate;

        newPollution.set(key, neighborData);
      });
    });

    this.pollutionData = newPollution;
  }

  /**
   * Apply pollution reduction from parks and trees
   */
  private applyPollutionReduction(grid: GridCell[][]): void {
    // Find all parks and trees
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const cell = grid[y][x];

        // Parks reduce air pollution in radius
        if (cell.type === TileType.Building && cell.buildingId) {
          const buildingDef = this.getBuildingDefinition(cell.buildingId);
          if (buildingDef?.category === 'landmark' || buildingDef?.isDecoration) {
            // Parks and decorations reduce pollution
            this.reducePollutionInRadius(
              x,
              y,
              POLLUTION_CONFIG.parkRadius,
              POLLUTION_CONFIG.parkReduction
            );
          }
        }
      }
    }
  }

  /**
   * Reduce pollution in radius around a point
   */
  private reducePollutionInRadius(
    centerX: number,
    centerY: number,
    radius: number,
    amount: number
  ): void {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const targetX = centerX + dx;
        const targetY = centerY + dy;

        if (targetX < 0 || targetX >= GRID_WIDTH || targetY < 0 || targetY >= GRID_HEIGHT) {
          continue;
        }

        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > radius) continue;

        const key = `${targetX},${targetY}`;
        const data = this.pollutionData.get(key);
        if (data) {
          const falloff = 1 - distance / radius;
          const reductionAmount = amount * falloff;

          data.airPollution = Math.max(0, data.airPollution - reductionAmount);
        }
      }
    }
  }

  /**
   * Apply natural pollution decay
   */
  private applyDecay(): void {
    this.pollutionData.forEach((data) => {
      data.airPollution = Math.max(0, data.airPollution * (1 - POLLUTION_CONFIG.decayRate));
      data.waterPollution = Math.max(0, data.waterPollution * (1 - POLLUTION_CONFIG.decayRate));
      data.groundPollution = Math.max(0, data.groundPollution * (1 - POLLUTION_CONFIG.decayRate));

      // Cap at max pollution
      data.airPollution = Math.min(POLLUTION_CONFIG.maxPollution, data.airPollution);
      data.waterPollution = Math.min(POLLUTION_CONFIG.maxPollution, data.waterPollution);
      data.groundPollution = Math.min(POLLUTION_CONFIG.maxPollution, data.groundPollution);
    });
  }

  /**
   * Calculate total pollution for each cell
   */
  private calculateTotalPollution(): void {
    this.pollutionData.forEach((data) => {
      data.totalPollution = data.airPollution + data.waterPollution + data.groundPollution;
    });
  }

  /**
   * Add pollution to a specific cell
   */
  private addPollution(x: number, y: number, type: PollutionType, amount: number): void {
    const key = `${x},${y}`;
    let data = this.pollutionData.get(key);

    if (!data) {
      data = {
        x,
        y,
        airPollution: 0,
        waterPollution: 0,
        groundPollution: 0,
        totalPollution: 0,
      };
      this.pollutionData.set(key, data);
    }

    switch (type) {
      case PollutionType.Air:
      case PollutionType.Radiation:
        data.airPollution += amount;
        break;
      case PollutionType.Water:
        data.waterPollution += amount;
        break;
      case PollutionType.Ground:
        data.groundPollution += amount;
        break;
    }
  }

  /**
   * Get pollution data for a specific tile
   */
  getPollutionData(x: number, y: number): PollutionData | undefined {
    return this.pollutionData.get(`${x},${y}`);
  }

  /**
   * Get total pollution at a location (for overlay)
   */
  getTotalPollution(x: number, y: number): number {
    const data = this.pollutionData.get(`${x},${y}`);
    return data ? data.totalPollution : 0;
  }

  /**
   * Get air pollution at a location (for overlay)
   */
  getAirPollution(x: number, y: number): number {
    const data = this.pollutionData.get(`${x},${y}`);
    return data ? data.airPollution : 0;
  }

  /**
   * Get health impact at a location (happiness reduction)
   */
  getHealthImpact(x: number, y: number): number {
    const pollution = this.getTotalPollution(x, y);

    // Find the appropriate health impact tier
    const tiers = Object.entries(POLLUTION_CONFIG.healthImpact)
      .map(([threshold, impact]) => ({ threshold: Number(threshold), impact }))
      .sort((a, b) => b.threshold - a.threshold);

    for (const tier of tiers) {
      if (pollution >= tier.threshold) {
        return tier.impact;
      }
    }

    return 0;
  }

  /**
   * Get land value impact at a location (percentage reduction)
   */
  getLandValueImpact(x: number, y: number): number {
    const pollution = this.getTotalPollution(x, y);

    const tiers = Object.entries(POLLUTION_CONFIG.landValueImpact)
      .map(([threshold, impact]) => ({ threshold: Number(threshold), impact }))
      .sort((a, b) => b.threshold - a.threshold);

    for (const tier of tiers) {
      if (pollution >= tier.threshold) {
        return tier.impact;
      }
    }

    return 0;
  }

  /**
   * Get city-wide pollution statistics
   */
  getPollutionStats(): {
    averageAirPollution: number;
    averageWaterPollution: number;
    averageGroundPollution: number;
    totalPollutionSources: number;
    highPollutionTiles: number;
    criticalPollutionTiles: number;
    worstPollutionLocation: { x: number; y: number; pollution: number } | null;
  } {
    let totalAir = 0;
    let totalWater = 0;
    let totalGround = 0;
    let tiles = 0;
    let highPollutionTiles = 0;
    let criticalPollutionTiles = 0;
    let worstPollution = 0;
    let worstLocation: { x: number; y: number; pollution: number } | null = null;

    this.pollutionData.forEach((data) => {
      tiles++;
      totalAir += data.airPollution;
      totalWater += data.waterPollution;
      totalGround += data.groundPollution;

      if (data.totalPollution > 60) highPollutionTiles++;
      if (data.totalPollution > 100) criticalPollutionTiles++;

      if (data.totalPollution > worstPollution) {
        worstPollution = data.totalPollution;
        worstLocation = { x: data.x, y: data.y, pollution: data.totalPollution };
      }
    });

    return {
      averageAirPollution: tiles > 0 ? totalAir / tiles : 0,
      averageWaterPollution: tiles > 0 ? totalWater / tiles : 0,
      averageGroundPollution: tiles > 0 ? totalGround / tiles : 0,
      totalPollutionSources: this.pollutionSources.length,
      highPollutionTiles,
      criticalPollutionTiles,
      worstPollutionLocation: worstLocation,
    };
  }

  /**
   * Helper to get building definition
   */
  private getBuildingDefinition(buildingId: string): any {
    return (this.scene as any).getBuildingDefinition?.(buildingId);
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.pollutionData.clear();
    this.pollutionSources = [];
    console.log('[PollutionSystem] Destroyed');
  }
}
