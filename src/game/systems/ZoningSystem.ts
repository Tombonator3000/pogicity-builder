import Phaser from "phaser";
import { GameSystem } from "./GameSystem";
import type {
  GridCell,
  ZoneType,
  ZoneDensity,
  ZoneDemand,
  ZoneStats,
  BuildingDefinition,
} from "../types";
import { GRID_WIDTH, GRID_HEIGHT } from "../types";

/**
 * ZoningSystem - SimCity-style zoning system
 *
 * Features:
 * - RCI zones (Residential, Commercial, Industrial)
 * - Zone demand calculation based on game state
 * - Automatic building growth in zones
 * - Zone statistics tracking
 *
 * Wasteland Theme Integration:
 * - Residential = Shantytown settlements
 * - Commercial = Trading posts/markets
 * - Industrial = Scrap yards/production facilities
 */
export class ZoningSystem extends GameSystem {
  private zoneDemand: ZoneDemand = {
    residential: 0,
    commercial: 0,
    industrial: 0,
  };

  private zoneStats: {
    residential: ZoneStats;
    commercial: ZoneStats;
    industrial: ZoneStats;
  };

  private lastDemandUpdate = 0;
  private lastGrowthCheck = 0;

  // Configuration
  private readonly DEMAND_UPDATE_INTERVAL = 5000; // Update demand every 5 seconds
  private readonly GROWTH_CHECK_INTERVAL = 10000; // Check for growth every 10 seconds
  private readonly GROWTH_CHANCE = 0.1; // 10% chance per check for zone to develop

  constructor(scene: Phaser.Scene) {
    super(scene);

    this.zoneStats = {
      residential: this.createEmptyStats("residential"),
      commercial: this.createEmptyStats("commercial"),
      industrial: this.createEmptyStats("industrial"),
    };
  }

  private createEmptyStats(zoneType: ZoneType): ZoneStats {
    return {
      zoneType,
      totalZones: 0,
      developedZones: 0,
      undevelopedZones: 0,
      totalPopulation: 0,
      totalJobs: 0,
      averageDevelopmentLevel: 0,
    };
  }

  /**
   * Place a zone at the specified grid position
   */
  placeZone(
    grid: GridCell[][],
    x: number,
    y: number,
    zoneType: ZoneType,
    density: ZoneDensity = ZoneDensity.Low
  ): boolean {
    if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) {
      return false;
    }

    const cell = grid[y][x];

    // Can only zone on grass or wasteland tiles
    if (cell.type !== "grass" && cell.type !== "wasteland") {
      return false;
    }

    // Can't zone on tiles with buildings
    if (cell.buildingId) {
      return false;
    }

    // Place zone
    cell.type = "zone";
    cell.zoneType = zoneType;
    cell.zoneDensity = density;
    cell.zoneDevelopmentLevel = 0;

    return true;
  }

  /**
   * Remove zone from specified grid position
   */
  removeZone(grid: GridCell[][], x: number, y: number): boolean {
    if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) {
      return false;
    }

    const cell = grid[y][x];

    if (cell.type !== "zone") {
      return false;
    }

    // Revert to underlying tile type (grass or wasteland)
    cell.type = cell.underlyingTileType || "grass";
    cell.zoneType = undefined;
    cell.zoneDensity = undefined;
    cell.zoneDevelopmentLevel = undefined;

    return true;
  }

  /**
   * Calculate zone demand based on current game state
   * Demand ranges from -100 (oversupply) to +100 (high demand)
   */
  calculateZoneDemand(
    grid: GridCell[][],
    population: number,
    maxPopulation: number,
    resources: any
  ): ZoneDemand {
    // Calculate stats first
    this.updateZoneStats(grid);

    const demand: ZoneDemand = {
      residential: 0,
      commercial: 0,
      industrial: 0,
    };

    // Residential demand based on population vs capacity
    const populationRatio = maxPopulation > 0 ? population / maxPopulation : 0;
    if (populationRatio > 0.8) {
      // High population, need more housing
      demand.residential = Math.min(100, Math.round((populationRatio - 0.8) * 500));
    } else if (populationRatio < 0.3) {
      // Low population, too much housing
      demand.residential = Math.max(-100, Math.round((populationRatio - 0.3) * 300));
    } else {
      // Balanced
      demand.residential = Math.round((populationRatio - 0.5) * 100);
    }

    // Commercial demand based on population and existing commercial zones
    const commercialRatio =
      this.zoneStats.commercial.totalZones > 0
        ? population / this.zoneStats.commercial.totalZones
        : Infinity;

    if (commercialRatio > 20) {
      // Need more trading posts
      demand.commercial = Math.min(100, Math.round((commercialRatio - 20) * 5));
    } else if (commercialRatio < 10 && this.zoneStats.commercial.totalZones > 0) {
      // Too many trading posts
      demand.commercial = Math.max(-100, Math.round((commercialRatio - 10) * 10));
    } else {
      demand.commercial = 0;
    }

    // Industrial demand based on resource production needs
    const industrialRatio =
      this.zoneStats.industrial.totalZones > 0
        ? population / this.zoneStats.industrial.totalZones
        : Infinity;

    if (industrialRatio > 15) {
      // Need more production facilities
      demand.industrial = Math.min(100, Math.round((industrialRatio - 15) * 7));
    } else if (industrialRatio < 8 && this.zoneStats.industrial.totalZones > 0) {
      // Too many production facilities
      demand.industrial = Math.max(-100, Math.round((industrialRatio - 8) * 12));
    } else {
      demand.industrial = 0;
    }

    // Add randomness to make demand feel organic (-5 to +5)
    demand.residential += Math.floor(Math.random() * 11) - 5;
    demand.commercial += Math.floor(Math.random() * 11) - 5;
    demand.industrial += Math.floor(Math.random() * 11) - 5;

    // Clamp to valid range
    demand.residential = Math.max(-100, Math.min(100, demand.residential));
    demand.commercial = Math.max(-100, Math.min(100, demand.commercial));
    demand.industrial = Math.max(-100, Math.min(100, demand.industrial));

    this.zoneDemand = demand;
    return demand;
  }

  /**
   * Update zone statistics by scanning the grid
   */
  private updateZoneStats(grid: GridCell[][]): void {
    // Reset stats
    this.zoneStats.residential = this.createEmptyStats("residential");
    this.zoneStats.commercial = this.createEmptyStats("commercial");
    this.zoneStats.industrial = this.createEmptyStats("industrial");

    let resDevSum = 0;
    let comDevSum = 0;
    let indDevSum = 0;

    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const cell = grid[y][x];

        if (cell.type === "zone" && cell.zoneType) {
          const stats = this.zoneStats[cell.zoneType];
          stats.totalZones++;

          const devLevel = cell.zoneDevelopmentLevel || 0;

          if (cell.buildingId) {
            stats.developedZones++;
          } else {
            stats.undevelopedZones++;
          }

          // Sum development levels for averaging
          if (cell.zoneType === "residential") {
            resDevSum += devLevel;
          } else if (cell.zoneType === "commercial") {
            comDevSum += devLevel;
          } else if (cell.zoneType === "industrial") {
            indDevSum += devLevel;
          }
        }
      }
    }

    // Calculate average development levels
    if (this.zoneStats.residential.totalZones > 0) {
      this.zoneStats.residential.averageDevelopmentLevel =
        resDevSum / this.zoneStats.residential.totalZones;
    }
    if (this.zoneStats.commercial.totalZones > 0) {
      this.zoneStats.commercial.averageDevelopmentLevel =
        comDevSum / this.zoneStats.commercial.totalZones;
    }
    if (this.zoneStats.industrial.totalZones > 0) {
      this.zoneStats.industrial.averageDevelopmentLevel =
        indDevSum / this.zoneStats.industrial.totalZones;
    }
  }

  /**
   * Check for automatic building growth in zones
   * Returns list of positions where buildings should be placed
   */
  checkForGrowth(
    grid: GridCell[][],
    demand: ZoneDemand,
    availableBuildings: BuildingDefinition[]
  ): Array<{ x: number; y: number; zoneType: ZoneType; building?: BuildingDefinition }> {
    const growthLocations: Array<{
      x: number;
      y: number;
      zoneType: ZoneType;
      building?: BuildingDefinition;
    }> = [];

    // Only check zones with positive demand
    const zoneTypes: ZoneType[] = [];
    if (demand.residential > 0) zoneTypes.push("residential");
    if (demand.commercial > 0) zoneTypes.push("commercial");
    if (demand.industrial > 0) zoneTypes.push("industrial");

    if (zoneTypes.length === 0) {
      return growthLocations;
    }

    // Find undeveloped zones
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const cell = grid[y][x];

        if (
          cell.type === "zone" &&
          cell.zoneType &&
          zoneTypes.includes(cell.zoneType) &&
          !cell.buildingId
        ) {
          // Check if zone should grow
          const demandValue = demand[cell.zoneType];
          const growthProbability = this.GROWTH_CHANCE * (demandValue / 100);

          if (Math.random() < growthProbability) {
            // Increment development level
            cell.zoneDevelopmentLevel = (cell.zoneDevelopmentLevel || 0) + 10;

            // If development level reaches 100, trigger building placement
            if (cell.zoneDevelopmentLevel >= 100) {
              // Find suitable building for this zone type
              const building = this.findSuitableBuildingForZone(
                cell.zoneType,
                availableBuildings
              );

              growthLocations.push({
                x,
                y,
                zoneType: cell.zoneType,
                building,
              });
            }
          }
        }
      }
    }

    return growthLocations;
  }

  /**
   * Find a suitable building definition for the given zone type
   */
  private findSuitableBuildingForZone(
    zoneType: ZoneType,
    availableBuildings: BuildingDefinition[]
  ): BuildingDefinition | undefined {
    // Filter buildings by category matching zone type
    const categoryMap: Record<ZoneType, string> = {
      residential: "residential",
      commercial: "commercial",
      industrial: "resource", // Map industrial zones to resource buildings
    };

    const category = categoryMap[zoneType];
    const suitableBuildings = availableBuildings.filter(
      (b) => b.category === category && !b.isDecoration
    );

    if (suitableBuildings.length === 0) {
      return undefined;
    }

    // Pick a random building from suitable options
    return suitableBuildings[Math.floor(Math.random() * suitableBuildings.length)];
  }

  /**
   * Get current zone demand
   */
  getZoneDemand(): ZoneDemand {
    return { ...this.zoneDemand };
  }

  /**
   * Get current zone statistics
   */
  getZoneStats(): {
    residential: ZoneStats;
    commercial: ZoneStats;
    industrial: ZoneStats;
  } {
    return {
      residential: { ...this.zoneStats.residential },
      commercial: { ...this.zoneStats.commercial },
      industrial: { ...this.zoneStats.industrial },
    };
  }

  update(time: number, delta: number): void {
    // Update demand periodically
    if (time - this.lastDemandUpdate > this.DEMAND_UPDATE_INTERVAL) {
      this.lastDemandUpdate = time;
      // Demand calculation happens when called from MainScene with game state
    }

    // Growth check happens separately
    if (time - this.lastGrowthCheck > this.GROWTH_CHECK_INTERVAL) {
      this.lastGrowthCheck = time;
      // Growth check happens when called from MainScene
    }
  }

  serialize(): any {
    return {
      zoneDemand: this.zoneDemand,
      zoneStats: this.zoneStats,
    };
  }

  deserialize(data: any): void {
    if (data.zoneDemand) {
      this.zoneDemand = data.zoneDemand;
    }
    if (data.zoneStats) {
      this.zoneStats = data.zoneStats;
    }
  }
}
