import Phaser from 'phaser';
import { 
  Resources, 
  PopulationState, 
  CONSUMPTION_PER_CAPITA, 
  POPULATION_CONFIG,
  GridCell,
  BuildingDefinition
} from '../types';
import { GameSystem } from './GameSystem';

/**
 * Population management system
 * Handles population growth, death, happiness, and consumption
 */
export class PopulationSystem implements GameSystem {
  private scene!: Phaser.Scene;
  private state: PopulationState;
  private grid: GridCell[][] = [];
  private buildingRegistry: Map<string, BuildingDefinition> = new Map();
  private gameTime: number = 0;

  constructor() {
    this.state = {
      current: 3, // Start with 3 settlers
      max: 5,     // Basic shelter for 5
      happiness: POPULATION_CONFIG.baseHappiness,
      lastGrowthCheck: 0,
    };
  }

  init(scene: Phaser.Scene): void {
    this.scene = scene;
    this.emitPopulationChange();
  }

  setGrid(grid: GridCell[][]): void {
    this.grid = grid;
    this.recalculateMaxPopulation();
  }

  registerBuilding(building: BuildingDefinition): void {
    this.buildingRegistry.set(building.id, building);
  }

  /**
   * Main update loop
   */
  update(delta: number): void {
    const deltaSeconds = delta / 1000;
    this.gameTime += deltaSeconds;

    // Check for population changes every growth interval
    if (this.gameTime - this.state.lastGrowthCheck >= POPULATION_CONFIG.growthInterval) {
      this.checkPopulationGrowth();
      this.state.lastGrowthCheck = this.gameTime;
    }
  }

  /**
   * Calculates resource consumption based on population
   */
  getPopulationConsumption(): { food: number; water: number; power: number } {
    return {
      food: this.state.current * CONSUMPTION_PER_CAPITA.food,
      water: this.state.current * CONSUMPTION_PER_CAPITA.water,
      power: this.state.current * CONSUMPTION_PER_CAPITA.power,
    };
  }

  /**
   * Updates happiness based on resource availability
   */
  updateHappiness(resources: Resources, deltaSeconds: number): void {
    const consumption = this.getPopulationConsumption();
    let happinessChange = 0;
    
    // Check basic needs
    const hasFood = resources.food > consumption.food * deltaSeconds;
    const hasWater = resources.water > consumption.water * deltaSeconds;
    const hasPower = resources.power >= 0;
    const hasMedicine = resources.medicine > 0;

    if (!hasFood || !hasWater) {
      // Needs not met - decrease happiness
      happinessChange -= POPULATION_CONFIG.happinessDecayRate * deltaSeconds;
      
      // Track starvation/dehydration
      if (!hasFood && !this.state.foodDepletedAt) {
        this.state.foodDepletedAt = this.gameTime;
      }
      if (!hasWater && !this.state.waterDepletedAt) {
        this.state.waterDepletedAt = this.gameTime;
      }
    } else {
      // Basic needs met - recover happiness
      happinessChange += POPULATION_CONFIG.happinessRecoveryRate * deltaSeconds;
      this.state.foodDepletedAt = undefined;
      this.state.waterDepletedAt = undefined;
    }

    // Bonus happiness for power and medicine
    if (hasPower) happinessChange += 0.2 * deltaSeconds;
    if (hasMedicine) happinessChange += 0.3 * deltaSeconds;

    // Apply happiness change
    this.state.happiness = Math.max(0, Math.min(100, this.state.happiness + happinessChange));
  }

  /**
   * Checks for population death due to starvation/dehydration
   */
  checkPopulationDeath(): number {
    let deaths = 0;

    // Death from starvation
    if (this.state.foodDepletedAt) {
      const starvationDuration = this.gameTime - this.state.foodDepletedAt;
      if (starvationDuration >= POPULATION_CONFIG.deathNoFoodInterval) {
        deaths++;
        this.state.foodDepletedAt = this.gameTime; // Reset timer
      }
    }

    // Death from dehydration
    if (this.state.waterDepletedAt) {
      const dehydrationDuration = this.gameTime - this.state.waterDepletedAt;
      if (dehydrationDuration >= POPULATION_CONFIG.deathNoWaterInterval) {
        deaths++;
        this.state.waterDepletedAt = this.gameTime; // Reset timer
      }
    }

    if (deaths > 0) {
      this.state.current = Math.max(1, this.state.current - deaths); // Always keep at least 1
      this.emitPopulationChange();
      this.scene.events.emit('population:death', { deaths });
    }

    return deaths;
  }

  /**
   * Checks for population growth
   */
  private checkPopulationGrowth(): void {
    // Can only grow if happiness is high enough and room available
    if (
      this.state.happiness >= POPULATION_CONFIG.growthHappinessMin &&
      this.state.current < this.state.max
    ) {
      this.state.current++;
      this.emitPopulationChange();
      this.scene.events.emit('population:growth', { population: this.state.current });
    }
  }

  /**
   * Recalculates max population from residential buildings
   */
  recalculateMaxPopulation(): void {
    let maxPop = 5; // Base capacity

    // Housing capacity per building type
    const housingCapacity: Record<string, number> = {
      'scrap-shack': 3,
      'reinforced-bunker': 5,
      'survivor-apartments': 10,
    };

    // Find all residential buildings
    const seen = new Set<string>();
    for (let y = 0; y < this.grid.length; y++) {
      for (let x = 0; x < this.grid[y].length; x++) {
        const cell = this.grid[y][x];
        if (cell.buildingId && !seen.has(`${cell.originX},${cell.originY}`)) {
          seen.add(`${cell.originX},${cell.originY}`);
          const capacity = housingCapacity[cell.buildingId] || 0;
          maxPop += capacity;
        }
      }
    }

    this.state.max = maxPop;
    this.emitPopulationChange();
  }

  /**
   * Gets available workers (population not assigned)
   */
  getAvailableWorkers(): number {
    return this.state.current; // For now, all population can work
  }

  /**
   * Gets work efficiency based on happiness
   */
  getWorkEfficiency(): number {
    // 50% happiness = 50% efficiency, 100% = 100%
    return Math.max(0.25, this.state.happiness / 100);
  }

  // Getters
  getPopulation(): number {
    return this.state.current;
  }

  getMaxPopulation(): number {
    return this.state.max;
  }

  getHappiness(): number {
    return this.state.happiness;
  }

  getState(): PopulationState {
    return { ...this.state };
  }

  getGameTime(): number {
    return this.gameTime;
  }

  // State management for save/load
  setState(state: PopulationState): void {
    this.state = { ...state };
    this.emitPopulationChange();
  }

  setGameTime(time: number): void {
    this.gameTime = time;
  }

  addPopulation(amount: number): void {
    this.state.current = Math.min(this.state.max, this.state.current + amount);
    this.emitPopulationChange();
  }

  reset(): void {
    this.state = {
      current: 3,
      max: 5,
      happiness: POPULATION_CONFIG.baseHappiness,
      lastGrowthCheck: 0,
    };
    this.gameTime = 0;
    this.emitPopulationChange();
  }

  private emitPopulationChange(): void {
    if (!this.scene) return;
    this.scene.events.emit('population:changed', {
      current: this.state.current,
      max: this.state.max,
      happiness: this.state.happiness,
    });
  }
}
