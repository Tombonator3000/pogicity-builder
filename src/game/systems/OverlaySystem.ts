import Phaser from 'phaser';
import { GameSystem } from './GameSystem';
import {
  GridCell,
  OverlayType,
  OverlayData,
  Resources,
  ZoneDemand,
  GRID_WIDTH,
  GRID_HEIGHT,
} from '../types';
import { BUILDINGS } from '../buildings';

/**
 * OverlaySystem - SimCity-style data visualization system
 *
 * Calculates and displays various data overlays on the grid:
 * - Power coverage
 * - Water coverage
 * - Radiation levels
 * - Crime/threat levels
 * - Happiness
 * - Population density
 * - Land value
 * - Zone demand
 * - Traffic
 * - Employment
 *
 * Features:
 * - Radius-based calculations for service coverage
 * - Heatmap visualization with color gradients
 * - Real-time updates based on game state
 * - Wasteland-themed overlays (radiation instead of pollution)
 */
export class OverlaySystem implements GameSystem {
  private scene!: Phaser.Scene;
  private overlayGraphics?: Phaser.GameObjects.Graphics;
  private activeOverlay: OverlayType = OverlayType.None;
  private lastUpdateTime: number = 0;
  private updateInterval: number = 2000; // Update overlays every 2 seconds

  // Service coverage radius configuration (in grid tiles)
  private readonly SERVICE_RADIUS = {
    power: 8,         // Power reaches 8 tiles from source
    water: 6,         // Water reaches 6 tiles from source
    security: 10,     // Security/police coverage
    fire: 8,          // Fire protection coverage
    medical: 7,       // Medical coverage
    radiation: 5,     // Radiation source affects 5 tiles
  };

  init(scene: Phaser.Scene): void {
    this.scene = scene;
    this.overlayGraphics = this.scene.add.graphics();
    this.overlayGraphics.setDepth(999); // Above everything except UI
    console.log('[OverlaySystem] Initialized');
  }

  update(delta: number): void {
    this.lastUpdateTime += delta;

    // Update overlays periodically
    if (this.lastUpdateTime >= this.updateInterval && this.activeOverlay !== OverlayType.None) {
      this.lastUpdateTime = 0;
      // Overlay data will be recalculated on demand
    }
  }

  destroy(): void {
    this.overlayGraphics?.destroy();
    console.log('[OverlaySystem] Destroyed');
  }

  /**
   * Set the active overlay type
   */
  setActiveOverlay(overlayType: OverlayType): void {
    this.activeOverlay = overlayType;
    console.log(`[OverlaySystem] Active overlay set to: ${overlayType}`);
  }

  /**
   * Get the currently active overlay type
   */
  getActiveOverlay(): OverlayType {
    return this.activeOverlay;
  }

  /**
   * Calculate overlay data for the entire grid
   */
  calculateOverlayData(
    grid: GridCell[][],
    resources: Resources,
    zoneDemand?: ZoneDemand
  ): void {
    if (this.activeOverlay === OverlayType.None) {
      return;
    }

    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const cell = grid[y][x];
        if (!cell.overlayData) {
          cell.overlayData = {};
        }

        // Calculate overlay value based on type
        switch (this.activeOverlay) {
          case OverlayType.Power:
            cell.overlayData.power = this.calculatePowerCoverage(grid, x, y);
            break;
          case OverlayType.Water:
            cell.overlayData.water = this.calculateWaterCoverage(grid, x, y);
            break;
          case OverlayType.Radiation:
            cell.overlayData.radiation = this.calculateRadiationLevel(grid, x, y);
            break;
          case OverlayType.Crime:
            cell.overlayData.crime = this.calculateCrimeLevel(grid, x, y);
            break;
          case OverlayType.Fire:
            cell.overlayData.fire = this.calculateFireHazard(grid, x, y);
            break;
          case OverlayType.Happiness:
            cell.overlayData.happiness = resources.happiness;
            break;
          case OverlayType.Population:
            cell.overlayData.population = this.calculatePopulationDensity(grid, x, y);
            break;
          case OverlayType.LandValue:
            cell.overlayData.landValue = this.calculateLandValue(grid, x, y);
            break;
          case OverlayType.ZoneDemand:
            // Zone demand is global, not per-tile
            break;
          case OverlayType.Traffic:
            cell.overlayData.traffic = this.calculateTrafficDensity(grid, x, y);
            break;
          case OverlayType.Employment:
            cell.overlayData.employment = this.calculateEmployment(grid, x, y);
            break;
        }
      }
    }
  }

  /**
   * Calculate power coverage for a cell (0-100)
   */
  private calculatePowerCoverage(grid: GridCell[][], x: number, y: number): number {
    // Find nearest power-producing building
    let nearestDistance = Infinity;

    for (let cy = 0; cy < GRID_HEIGHT; cy++) {
      for (let cx = 0; cx < GRID_WIDTH; cx++) {
        const cell = grid[cy][cx];
        if (cell.buildingId && cell.isOrigin) {
          const building = BUILDINGS[cell.buildingId];
          if (building?.produces?.power && building.produces.power > 0) {
            const distance = Math.sqrt((cx - x) ** 2 + (cy - y) ** 2);
            nearestDistance = Math.min(nearestDistance, distance);
          }
        }
      }
    }

    // Calculate coverage based on distance
    if (nearestDistance <= this.SERVICE_RADIUS.power) {
      return 100 - (nearestDistance / this.SERVICE_RADIUS.power) * 100;
    }

    return 0;
  }

  /**
   * Calculate water coverage for a cell (0-100)
   */
  private calculateWaterCoverage(grid: GridCell[][], x: number, y: number): number {
    // Find nearest water-producing building
    let nearestDistance = Infinity;

    for (let cy = 0; cy < GRID_HEIGHT; cy++) {
      for (let cx = 0; cx < GRID_WIDTH; cx++) {
        const cell = grid[cy][cx];
        if (cell.buildingId && cell.isOrigin) {
          const building = BUILDINGS[cell.buildingId];
          if (building?.produces?.water && building.produces.water > 0) {
            const distance = Math.sqrt((cx - x) ** 2 + (cy - y) ** 2);
            nearestDistance = Math.min(nearestDistance, distance);
          }
        }
      }
    }

    // Calculate coverage based on distance
    if (nearestDistance <= this.SERVICE_RADIUS.water) {
      return 100 - (nearestDistance / this.SERVICE_RADIUS.water) * 100;
    }

    return 0;
  }

  /**
   * Calculate radiation level for a cell (0-100, higher = worse)
   */
  private calculateRadiationLevel(grid: GridCell[][], x: number, y: number): number {
    const cell = grid[y][x];

    // Base radiation from tile type
    let radiation = 0;
    if (cell.type === 'radiation') {
      radiation = 100;
    } else if (cell.type === 'contaminated') {
      radiation = 60;
    } else if (cell.type === 'wasteland') {
      radiation = 30;
    }

    // Check for nearby radiation sources
    for (let cy = Math.max(0, y - this.SERVICE_RADIUS.radiation);
         cy < Math.min(GRID_HEIGHT, y + this.SERVICE_RADIUS.radiation); cy++) {
      for (let cx = Math.max(0, x - this.SERVICE_RADIUS.radiation);
           cx < Math.min(GRID_WIDTH, x + this.SERVICE_RADIUS.radiation); cx++) {
        const nearCell = grid[cy][cx];
        if (nearCell.type === 'radiation') {
          const distance = Math.sqrt((cx - x) ** 2 + (cy - y) ** 2);
          if (distance <= this.SERVICE_RADIUS.radiation) {
            const influence = (1 - distance / this.SERVICE_RADIUS.radiation) * 50;
            radiation = Math.max(radiation, influence);
          }
        }
      }
    }

    return Math.min(100, radiation);
  }

  /**
   * Calculate crime/threat level for a cell (0-100, higher = worse)
   */
  private calculateCrimeLevel(grid: GridCell[][], x: number, y: number): number {
    // Find nearest security/defense building
    let nearestSecurityDistance = Infinity;

    for (let cy = 0; cy < GRID_HEIGHT; cy++) {
      for (let cx = 0; cx < GRID_WIDTH; cx++) {
        const cell = grid[cy][cx];
        if (cell.buildingId && cell.isOrigin) {
          const building = BUILDINGS[cell.buildingId];
          // Defense buildings: guard_tower, militia_barracks, etc.
          if (building?.category === 'defense') {
            const distance = Math.sqrt((cx - x) ** 2 + (cy - y) ** 2);
            nearestSecurityDistance = Math.min(nearestSecurityDistance, distance);
          }
        }
      }
    }

    // High crime if far from security, low crime if close
    if (nearestSecurityDistance <= this.SERVICE_RADIUS.security) {
      return (nearestSecurityDistance / this.SERVICE_RADIUS.security) * 100;
    }

    return 100; // Maximum crime if no security nearby
  }

  /**
   * Calculate fire hazard level for a cell (0-100, higher = worse)
   */
  private calculateFireHazard(grid: GridCell[][], x: number, y: number): number {
    // Similar to crime - find nearest fire protection building
    // For now, return moderate hazard everywhere
    return 50;
  }

  /**
   * Calculate population density for a cell (0-100)
   */
  private calculatePopulationDensity(grid: GridCell[][], x: number, y: number): number {
    const cell = grid[y][x];

    // If this is a residential building, check its capacity
    if (cell.buildingId && cell.isOrigin) {
      const building = BUILDINGS[cell.buildingId];
      if (building?.housingCapacity && building.housingCapacity > 0) {
        // Normalize to 0-100 scale (assuming max 50 capacity)
        return Math.min(100, (building.housingCapacity / 50) * 100);
      }
    }

    // Count nearby residential buildings
    let nearbyPopulation = 0;
    const checkRadius = 5;

    for (let cy = Math.max(0, y - checkRadius);
         cy < Math.min(GRID_HEIGHT, y + checkRadius); cy++) {
      for (let cx = Math.max(0, x - checkRadius);
           cx < Math.min(GRID_WIDTH, x + checkRadius); cx++) {
        const nearCell = grid[cy][cx];
        if (nearCell.buildingId && nearCell.isOrigin) {
          const building = BUILDINGS[nearCell.buildingId];
          if (building?.housingCapacity) {
            nearbyPopulation += building.housingCapacity;
          }
        }
      }
    }

    return Math.min(100, nearbyPopulation);
  }

  /**
   * Calculate land/salvage value for a cell (0-100)
   */
  private calculateLandValue(grid: GridCell[][], x: number, y: number): number {
    let value = 50; // Base value

    // Factors that increase value:
    // - Near water/power sources (+)
    // - Near commercial buildings (+)
    // - Near parks/props (+)

    // Factors that decrease value:
    // - Near radiation/contamination (-)
    // - Near industrial buildings (-)
    // - High crime (-)

    const checkRadius = 5;

    for (let cy = Math.max(0, y - checkRadius);
         cy < Math.min(GRID_HEIGHT, y + checkRadius); cy++) {
      for (let cx = Math.max(0, x - checkRadius);
           cx < Math.min(GRID_WIDTH, x + checkRadius); cx++) {
        const nearCell = grid[cy][cx];

        // Decrease value near radiation
        if (nearCell.type === 'radiation') {
          value -= 20;
        } else if (nearCell.type === 'contaminated') {
          value -= 10;
        }

        // Increase value near props/parks
        if (nearCell.buildingId && nearCell.isOrigin) {
          const building = BUILDINGS[nearCell.buildingId];
          if (building?.category === 'props') {
            value += 5;
          } else if (building?.category === 'commercial') {
            value += 3;
          }
        }
      }
    }

    return Math.max(0, Math.min(100, value));
  }

  /**
   * Calculate traffic density for a cell (0-100)
   */
  private calculateTrafficDensity(grid: GridCell[][], x: number, y: number): number {
    const cell = grid[y][x];

    // Only roads have traffic
    if (cell.type !== 'road' && cell.type !== 'asphalt') {
      return 0;
    }

    // Count nearby buildings (more buildings = more traffic)
    let nearbyBuildings = 0;
    const checkRadius = 8;

    for (let cy = Math.max(0, y - checkRadius);
         cy < Math.min(GRID_HEIGHT, y + checkRadius); cy++) {
      for (let cx = Math.max(0, x - checkRadius);
           cx < Math.min(GRID_WIDTH, x + checkRadius); cx++) {
        const nearCell = grid[cy][cx];
        if (nearCell.buildingId && nearCell.isOrigin) {
          nearbyBuildings++;
        }
      }
    }

    // More buildings = more traffic
    return Math.min(100, nearbyBuildings * 5);
  }

  /**
   * Calculate employment availability for a cell (0-100)
   */
  private calculateEmployment(grid: GridCell[][], x: number, y: number): number {
    // Count nearby job-providing buildings
    let nearbyJobs = 0;
    const checkRadius = 8;

    for (let cy = Math.max(0, y - checkRadius);
         cy < Math.min(GRID_HEIGHT, y + checkRadius); cy++) {
      for (let cx = Math.max(0, x - checkRadius);
           cx < Math.min(GRID_WIDTH, x + checkRadius); cx++) {
        const nearCell = grid[cy][cx];
        if (nearCell.buildingId && nearCell.isOrigin) {
          const building = BUILDINGS[nearCell.buildingId];
          if (building?.workersRequired) {
            nearbyJobs += building.workersRequired;
          }
        }
      }
    }

    // Normalize to 0-100 scale
    return Math.min(100, nearbyJobs * 10);
  }

  /**
   * Get overlay value for a specific cell
   */
  getOverlayValue(cell: GridCell): number {
    if (!cell.overlayData) {
      return 0;
    }

    switch (this.activeOverlay) {
      case OverlayType.Power:
        return cell.overlayData.power || 0;
      case OverlayType.Water:
        return cell.overlayData.water || 0;
      case OverlayType.Radiation:
        return cell.overlayData.radiation || 0;
      case OverlayType.Crime:
        return cell.overlayData.crime || 0;
      case OverlayType.Fire:
        return cell.overlayData.fire || 0;
      case OverlayType.Happiness:
        return cell.overlayData.happiness || 0;
      case OverlayType.Population:
        return cell.overlayData.population || 0;
      case OverlayType.LandValue:
        return cell.overlayData.landValue || 0;
      case OverlayType.Traffic:
        return cell.overlayData.traffic || 0;
      case OverlayType.Employment:
        return cell.overlayData.employment || 0;
      default:
        return 0;
    }
  }

  /**
   * Get color for overlay value (0-100)
   * Returns hex color for heatmap visualization
   *
   * For "good" overlays (power, water, happiness, land value, employment):
   * - 0 = Red (bad)
   * - 50 = Yellow (medium)
   * - 100 = Green (good)
   *
   * For "bad" overlays (radiation, crime, fire, traffic):
   * - 0 = Green (good)
   * - 50 = Yellow (medium)
   * - 100 = Red (bad)
   */
  getOverlayColor(value: number, overlayType: OverlayType): number {
    const isBadOverlay =
      overlayType === OverlayType.Radiation ||
      overlayType === OverlayType.Crime ||
      overlayType === OverlayType.Fire ||
      overlayType === OverlayType.Traffic;

    // Invert value for "bad" overlays
    const adjustedValue = isBadOverlay ? 100 - value : value;

    // Color gradient: Red (0) -> Yellow (50) -> Green (100)
    if (adjustedValue < 50) {
      // Red to Yellow
      const t = adjustedValue / 50;
      const r = 255;
      const g = Math.floor(255 * t);
      const b = 0;
      return (r << 16) | (g << 8) | b;
    } else {
      // Yellow to Green
      const t = (adjustedValue - 50) / 50;
      const r = Math.floor(255 * (1 - t));
      const g = 255;
      const b = 0;
      return (r << 16) | (g << 8) | b;
    }
  }

  /**
   * Get issues for a cell (for query tool)
   */
  getIssues(cell: GridCell): string[] {
    const issues: string[] = [];

    if (!cell.overlayData) {
      return issues;
    }

    // Check for low power
    if (cell.overlayData.power !== undefined && cell.overlayData.power < 50) {
      issues.push('Low power coverage');
    }

    // Check for low water
    if (cell.overlayData.water !== undefined && cell.overlayData.water < 50) {
      issues.push('Low water coverage');
    }

    // Check for high radiation
    if (cell.overlayData.radiation !== undefined && cell.overlayData.radiation > 50) {
      issues.push('High radiation levels');
    }

    // Check for high crime
    if (cell.overlayData.crime !== undefined && cell.overlayData.crime > 70) {
      issues.push('High crime/threat');
    }

    // Check for high traffic
    if (cell.overlayData.traffic !== undefined && cell.overlayData.traffic > 80) {
      issues.push('Heavy traffic congestion');
    }

    // Check for low employment
    if (cell.overlayData.employment !== undefined && cell.overlayData.employment < 30) {
      issues.push('Low job availability');
    }

    return issues;
  }
}
