import Phaser from 'phaser';
import { Resources, ResourceRate, BuildingDefinition, GridCell } from '../types';
import { GameSystem } from './GameSystem';

/**
 * Resource management system for post-apocalyptic economy
 * Handles resource tracking, production, consumption, and capacity
 */
export class ResourceSystem implements GameSystem {
  private scene!: Phaser.Scene;
  private resources: Resources;
  private capacity: Resources;
  private grid: GridCell[][] = [];
  private buildingRegistry: Map<string, BuildingDefinition> = new Map();

  // Default starting resources (can be configured)
  private static readonly DEFAULT_RESOURCES: Resources = {
    scrap: 100,
    food: 50,
    water: 50,
    power: 0,
    medicine: 10,
    caps: 0,
  };

  // Default storage capacity (can be increased with storage buildings)
  private static readonly DEFAULT_CAPACITY: Resources = {
    scrap: 500,
    food: 200,
    water: 200,
    power: 100,
    medicine: 100,
    caps: 1000,
  };

  constructor() {
    this.resources = { ...ResourceSystem.DEFAULT_RESOURCES };
    this.capacity = { ...ResourceSystem.DEFAULT_CAPACITY };
  }

  init(scene: Phaser.Scene): void {
    this.scene = scene;

    // Emit initial resource state
    this.emitResourceChange();
  }

  /**
   * Sets the grid reference for building tracking
   */
  setGrid(grid: GridCell[][]): void {
    this.grid = grid;
  }

  /**
   * Registers building definitions for cost/production lookup
   */
  registerBuilding(building: BuildingDefinition): void {
    this.buildingRegistry.set(building.id, building);
  }

  /**
   * Gets current resources
   */
  getResources(): Resources {
    return { ...this.resources };
  }

  /**
   * Gets resource capacity
   */
  getCapacity(): Resources {
    return { ...this.capacity };
  }

  /**
   * Update loop - handles production and consumption
   * Delta is in milliseconds
   */
  update(delta: number): void {
    // Convert delta to seconds for resource rates
    const deltaSeconds = delta / 1000;

    // Calculate total production and consumption from all buildings
    const production = this.calculateTotalProduction();
    const consumption = this.calculateTotalConsumption();

    // Apply net resource changes
    this.applyResourceChanges(production, consumption, deltaSeconds);
  }

  /**
   * Checks if player has enough resources for a cost
   */
  canAfford(cost: Partial<Resources>): boolean {
    const keys = Object.keys(cost) as Array<keyof Resources>;
    return keys.every(key => {
      const required = cost[key] || 0;
      return this.resources[key] >= required;
    });
  }

  /**
   * Deducts resources (e.g., for building placement)
   * Returns true if successful, false if insufficient resources
   */
  spendResources(cost: Partial<Resources>): boolean {
    if (!this.canAfford(cost)) {
      return false;
    }

    const keys = Object.keys(cost) as Array<keyof Resources>;
    keys.forEach(key => {
      const amount = cost[key] || 0;
      this.resources[key] -= amount;
    });

    this.emitResourceChange();
    return true;
  }

  /**
   * Adds resources (e.g., from salvaging)
   */
  addResources(amount: Partial<Resources>): void {
    const keys = Object.keys(amount) as Array<keyof Resources>;
    keys.forEach(key => {
      const value = amount[key] || 0;
      this.resources[key] = Math.min(
        this.resources[key] + value,
        this.capacity[key]
      );
    });

    this.emitResourceChange();
  }

  /**
   * Sets resources directly (for loading saved games)
   */
  setResources(resources: Resources): void {
    this.resources = { ...resources };
    this.emitResourceChange();
  }

  /**
   * Sets capacity directly (for loading saved games)
   */
  setCapacity(capacity: Resources): void {
    this.capacity = { ...capacity };
    this.emitResourceChange();
  }

  /**
   * Resets resources to default values
   */
  reset(): void {
    this.resources = { ...ResourceSystem.DEFAULT_RESOURCES };
    this.capacity = { ...ResourceSystem.DEFAULT_CAPACITY };
    this.emitResourceChange();
  }

  /**
   * Calculates total resource production from all buildings
   */
  private calculateTotalProduction(): ResourceRate {
    const total: ResourceRate = {};

    // Find all buildings in grid
    const buildings = this.findAllBuildings();

    buildings.forEach(({ buildingId }) => {
      if (!buildingId) return;

      const definition = this.buildingRegistry.get(buildingId);
      if (!definition?.produces) return;

      // Add production rates
      const keys = Object.keys(definition.produces) as Array<keyof ResourceRate>;
      keys.forEach(key => {
        const rate = definition.produces![key] || 0;
        total[key] = (total[key] || 0) + rate;
      });
    });

    return total;
  }

  /**
   * Calculates total resource consumption from all buildings
   */
  private calculateTotalConsumption(): ResourceRate {
    const total: ResourceRate = {};

    // Find all buildings in grid
    const buildings = this.findAllBuildings();

    buildings.forEach(({ buildingId }) => {
      if (!buildingId) return;

      const definition = this.buildingRegistry.get(buildingId);
      if (!definition?.consumes) return;

      // Add consumption rates
      const keys = Object.keys(definition.consumes) as Array<keyof ResourceRate>;
      keys.forEach(key => {
        const rate = definition.consumes![key] || 0;
        total[key] = (total[key] || 0) + rate;
      });
    });

    return total;
  }

  /**
   * Finds all buildings in the grid
   */
  private findAllBuildings(): Array<{ buildingId?: string; x: number; y: number }> {
    const buildings: Array<{ buildingId?: string; x: number; y: number }> = [];
    const seen = new Set<string>();

    for (let y = 0; y < this.grid.length; y++) {
      for (let x = 0; x < this.grid[y].length; x++) {
        const cell = this.grid[y][x];
        if (cell.buildingId && !seen.has(cell.buildingId)) {
          seen.add(cell.buildingId);
          buildings.push({
            buildingId: cell.buildingId,
            x: cell.originX ?? x,
            y: cell.originY ?? y,
          });
        }
      }
    }

    return buildings;
  }

  /**
   * Applies resource production and consumption
   */
  private applyResourceChanges(
    production: ResourceRate,
    consumption: ResourceRate,
    deltaSeconds: number
  ): void {
    let changed = false;

    // Apply production
    const prodKeys = Object.keys(production) as Array<keyof ResourceRate>;
    prodKeys.forEach(key => {
      const rate = production[key] || 0;
      const amount = rate * deltaSeconds;
      const oldValue = this.resources[key];
      this.resources[key] = Math.min(
        this.resources[key] + amount,
        this.capacity[key]
      );
      if (this.resources[key] !== oldValue) {
        changed = true;
      }
    });

    // Apply consumption
    const consKeys = Object.keys(consumption) as Array<keyof ResourceRate>;
    consKeys.forEach(key => {
      const rate = consumption[key] || 0;
      const amount = rate * deltaSeconds;
      const oldValue = this.resources[key];
      this.resources[key] = Math.max(this.resources[key] - amount, 0);
      if (this.resources[key] !== oldValue) {
        changed = true;
      }
    });

    // Emit change event if resources changed
    if (changed) {
      this.emitResourceChange();
    }
  }

  /**
   * Emits resource change event for UI updates
   */
  private emitResourceChange(): void {
    this.scene.events.emit('resources:changed', {
      resources: this.getResources(),
      capacity: this.getCapacity(),
    });
  }

  /**
   * Calculates net resource rate (production - consumption)
   */
  getNetRate(): ResourceRate {
    const production = this.calculateTotalProduction();
    const consumption = this.calculateTotalConsumption();
    const net: ResourceRate = {};

    const allKeys = new Set([
      ...Object.keys(production),
      ...Object.keys(consumption),
    ]) as Set<keyof ResourceRate>;

    allKeys.forEach(key => {
      const prod = production[key] || 0;
      const cons = consumption[key] || 0;
      net[key] = prod - cons;
    });

    return net;
  }

  /**
   * Adds storage capacity (e.g., from storage buildings)
   */
  addCapacity(increase: Partial<Resources>): void {
    const keys = Object.keys(increase) as Array<keyof Resources>;
    keys.forEach(key => {
      const value = increase[key] || 0;
      this.capacity[key] += value;
    });

    this.emitResourceChange();
  }
}
