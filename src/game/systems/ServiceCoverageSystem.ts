import Phaser from "phaser";
import { GameSystem } from "./GameSystem";
import type { GridCell } from "../types";
import { GRID_WIDTH, GRID_HEIGHT } from "../types";

/**
 * Service types and their effects
 */
export enum ServiceType {
  Police = "police",
  Fire = "fire",
  Health = "health",
  Education = "education",
  Park = "park",
}

/**
 * Service building definition
 */
export interface ServiceBuilding {
  x: number;
  y: number;
  buildingId: string;
  serviceType: ServiceType;
  radius: number;
  effectiveness: number; // 0-100%
}

/**
 * Service coverage data for a tile
 */
export interface ServiceCoverage {
  police: number; // 0-100 (crime reduction)
  fire: number; // 0-100 (fire protection)
  health: number; // 0-100 (health bonus)
  education: number; // 0-100 (education level)
  landValue: number; // Modifier from parks (-100 to +100)
}

/**
 * Service statistics
 */
export interface ServiceStats {
  totalPoliceStations: number;
  totalFireStations: number;
  totalHealthFacilities: number;
  totalSchools: number;
  totalParks: number;
  averageCoverage: ServiceCoverage;
  coveredTiles: number;
  uncoveredTiles: number;
}

/**
 * ServiceCoverageSystem - SimCity-style service coverage
 *
 * Features:
 * - Police stations reduce crime in radius
 * - Fire stations provide fire protection in radius
 * - Health facilities provide health bonus in radius
 * - Schools provide education in radius
 * - Parks increase land value in radius
 *
 * Wasteland Theme:
 * - Police = Militia posts (watch towers)
 * - Fire = Fire brigade stations
 * - Health = Medic tents/stations
 * - Education = School tents
 * - Parks = Recreation areas/green spaces
 */
export class ServiceCoverageSystem implements GameSystem {
  private scene!: Phaser.Scene;

  // Service buildings cache
  private serviceBuildings: ServiceBuilding[] = [];

  // Coverage map (stores coverage data for each tile)
  private coverageMap: ServiceCoverage[][] = [];

  // Service building definitions (building ID -> service type + radius)
  private readonly SERVICE_DEFINITIONS: Record<
    string,
    { type: ServiceType; radius: number }
  > = {
    // Militia/Police
    watch_tower: { type: ServiceType.Police, radius: 8 },
    militia_post: { type: ServiceType.Police, radius: 10 },
    security_hq: { type: ServiceType.Police, radius: 15 },

    // Fire
    fire_station: { type: ServiceType.Fire, radius: 10 },
    fire_brigade: { type: ServiceType.Fire, radius: 12 },

    // Health
    medic_tent: { type: ServiceType.Health, radius: 8 },
    med_tent: { type: ServiceType.Health, radius: 8 },
    clinic: { type: ServiceType.Health, radius: 12 },
    hospital: { type: ServiceType.Health, radius: 15 },

    // Education
    school_tent: { type: ServiceType.Education, radius: 10 },
    school: { type: ServiceType.Education, radius: 12 },
    library: { type: ServiceType.Education, radius: 8 },

    // Parks and recreation
    park: { type: ServiceType.Park, radius: 6 },
    garden: { type: ServiceType.Park, radius: 5 },
    plaza: { type: ServiceType.Park, radius: 7 },
    fountain: { type: ServiceType.Park, radius: 4 },
  };

  /**
   * Initialize the service coverage system
   */
  init(scene: Phaser.Scene): void {
    this.scene = scene;
    this.initializeCoverageMap();
  }

  /**
   * Initialize coverage map with empty data
   */
  private initializeCoverageMap(): void {
    this.coverageMap = [];
    for (let y = 0; y < GRID_HEIGHT; y++) {
      const row: ServiceCoverage[] = [];
      for (let x = 0; x < GRID_WIDTH; x++) {
        row.push({
          police: 0,
          fire: 0,
          health: 0,
          education: 0,
          landValue: 0,
        });
      }
      this.coverageMap.push(row);
    }
  }

  /**
   * Scan grid for service buildings
   */
  private scanForServiceBuildings(grid: GridCell[][]): void {
    this.serviceBuildings = [];

    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const cell = grid[y][x];

        // Check if cell has a service building
        if (
          cell.type === "building" &&
          cell.buildingId &&
          cell.isOrigin
        ) {
          const serviceDef = this.SERVICE_DEFINITIONS[cell.buildingId];

          if (serviceDef) {
            this.serviceBuildings.push({
              x,
              y,
              buildingId: cell.buildingId,
              serviceType: serviceDef.type,
              radius: serviceDef.radius,
              effectiveness: 100, // Default 100% effectiveness
            });
          }
        }
      }
    }
  }

  /**
   * Calculate coverage for all tiles
   */
  calculateCoverage(grid: GridCell[][]): void {
    // Reset coverage map
    this.initializeCoverageMap();

    // Scan for service buildings
    this.scanForServiceBuildings(grid);

    // Calculate coverage from each service building
    for (const building of this.serviceBuildings) {
      this.applyCoverageFromBuilding(building);
    }
  }

  /**
   * Apply coverage from a single service building
   */
  private applyCoverageFromBuilding(building: ServiceBuilding): void {
    const radius = building.radius;
    const centerX = building.x;
    const centerY = building.y;

    // Apply coverage in circular radius
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = centerX + dx;
        const y = centerY + dy;

        // Skip out of bounds
        if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) {
          continue;
        }

        // Calculate distance
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Skip if outside radius
        if (distance > radius) {
          continue;
        }

        // Calculate coverage strength (100% at center, decreasing with distance)
        const strength = Math.round(
          ((radius - distance) / radius) * building.effectiveness
        );

        // Apply coverage based on service type
        const coverage = this.coverageMap[y][x];

        switch (building.serviceType) {
          case ServiceType.Police:
            coverage.police = Math.min(100, coverage.police + strength);
            break;
          case ServiceType.Fire:
            coverage.fire = Math.min(100, coverage.fire + strength);
            break;
          case ServiceType.Health:
            coverage.health = Math.min(100, coverage.health + strength);
            break;
          case ServiceType.Education:
            coverage.education = Math.min(100, coverage.education + strength);
            break;
          case ServiceType.Park:
            // Parks increase land value (additive, can go above 100)
            coverage.landValue += strength / 2; // Parks give +50 max
            break;
        }
      }
    }
  }

  /**
   * Get coverage data for a specific tile
   */
  getCoverageAt(x: number, y: number): ServiceCoverage | null {
    if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) {
      return null;
    }
    return { ...this.coverageMap[y][x] };
  }

  /**
   * Get all service buildings
   */
  getServiceBuildings(): ServiceBuilding[] {
    return [...this.serviceBuildings];
  }

  /**
   * Calculate service statistics
   */
  getServiceStats(): ServiceStats {
    let totalPolice = 0;
    let totalFire = 0;
    let totalHealth = 0;
    let totalSchools = 0;
    let totalParks = 0;

    for (const building of this.serviceBuildings) {
      switch (building.serviceType) {
        case ServiceType.Police:
          totalPolice++;
          break;
        case ServiceType.Fire:
          totalFire++;
          break;
        case ServiceType.Health:
          totalHealth++;
          break;
        case ServiceType.Education:
          totalSchools++;
          break;
        case ServiceType.Park:
          totalParks++;
          break;
      }
    }

    // Calculate average coverage across all tiles
    let totalPoliceC = 0;
    let totalFireC = 0;
    let totalHealthC = 0;
    let totalEducationC = 0;
    let totalLandValue = 0;
    let coveredTiles = 0;
    let totalTiles = 0;

    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const coverage = this.coverageMap[y][x];
        totalPoliceC += coverage.police;
        totalFireC += coverage.fire;
        totalHealthC += coverage.health;
        totalEducationC += coverage.education;
        totalLandValue += coverage.landValue;

        if (
          coverage.police > 0 ||
          coverage.fire > 0 ||
          coverage.health > 0 ||
          coverage.education > 0
        ) {
          coveredTiles++;
        }
        totalTiles++;
      }
    }

    return {
      totalPoliceStations: totalPolice,
      totalFireStations: totalFire,
      totalHealthFacilities: totalHealth,
      totalSchools: totalSchools,
      totalParks: totalParks,
      averageCoverage: {
        police: Math.round(totalPoliceC / totalTiles),
        fire: Math.round(totalFireC / totalTiles),
        health: Math.round(totalHealthC / totalTiles),
        education: Math.round(totalEducationC / totalTiles),
        landValue: Math.round(totalLandValue / totalTiles),
      },
      coveredTiles,
      uncoveredTiles: totalTiles - coveredTiles,
    };
  }

  /**
   * Calculate happiness bonus from services
   * Good coverage = happiness boost
   */
  calculateServiceHappinessBonus(): number {
    const stats = this.getServiceStats();
    const avgCoverage = stats.averageCoverage;

    // Each service type contributes up to +5 happiness
    const policeBonus = Math.round((avgCoverage.police / 100) * 5);
    const fireBonus = Math.round((avgCoverage.fire / 100) * 5);
    const healthBonus = Math.round((avgCoverage.health / 100) * 5);
    const educationBonus = Math.round((avgCoverage.education / 100) * 5);

    // Total bonus: 0 to +20
    return policeBonus + fireBonus + healthBonus + educationBonus;
  }

  /**
   * Get full coverage map
   */
  getCoverageMap(): ServiceCoverage[][] {
    return this.coverageMap.map((row) => row.map((cell) => ({ ...cell })));
  }

  update(time: number, delta: number): void {
    // Coverage is calculated on demand when needed
  }

  serialize(): any {
    return {
      serviceBuildings: this.serviceBuildings,
    };
  }

  deserialize(data: any): void {
    if (data.serviceBuildings) {
      this.serviceBuildings = data.serviceBuildings;
    }
  }
}
