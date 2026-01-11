import Phaser from 'phaser';
import { WorkerAssignment, GridCell, BuildingDefinition, TileType } from '../types';
import { GameSystem } from './GameSystem';

/**
 * Worker priority categories (lower = higher priority)
 */
export const WORKER_PRIORITIES: Record<string, number> = {
  // Critical infrastructure - highest priority
  'water-purifier': 1,
  'hydroponic-farm': 2,
  'generator': 3,
  'solar-array': 3,
  
  // Medical/Defense - high priority
  'med-tent': 4,
  'guard-tower': 5,
  
  // Production - medium priority
  'scavenging-station': 6,
  'trading-post': 7,
  
  // Other - low priority
  'radio-tower': 8,
};

/**
 * Default workers required per building type
 */
export const WORKERS_REQUIRED: Record<string, number> = {
  // Resource production
  'scavenging-station': 2,
  'water-purifier': 1,
  'hydroponic-farm': 3,
  'generator': 1,
  'solar-array': 0,  // Automated
  'med-tent': 2,
  'radio-tower': 1,
  
  // Defense
  'guard-tower': 1,
  
  // Commercial
  'trading-post': 2,
  
  // Decorations/props don't need workers
  'campfire': 0,
  'dead-tree': 0,
  'car-wreck': 0,
  'scrap-pile': 0,
  'water-barrel': 0,
  'skull-pile': 0,
  'toxic-barrel': 0,
  'barricade': 0,
};

/**
 * Worker allocation system
 * Automatically assigns available workers to buildings based on priority
 */
export class WorkerSystem implements GameSystem {
  private scene!: Phaser.Scene;
  private grid: GridCell[][] = [];
  private buildingRegistry: Map<string, BuildingDefinition> = new Map();
  private assignments: Map<string, WorkerAssignment> = new Map();
  private availableWorkers: number = 0;
  private totalWorkers: number = 0;

  init(scene: Phaser.Scene): void {
    this.scene = scene;
  }

  setGrid(grid: GridCell[][]): void {
    this.grid = grid;
    this.recalculateAssignments();
  }

  registerBuilding(building: BuildingDefinition): void {
    this.buildingRegistry.set(building.id, building);
  }

  /**
   * Sets the total available workforce
   */
  setTotalWorkers(count: number): void {
    this.totalWorkers = count;
    this.recalculateAssignments();
  }

  /**
   * Main update loop
   */
  update(_delta: number): void {
    // Worker assignments are recalculated when grid or population changes
    // No per-frame updates needed
  }

  /**
   * Recalculates worker assignments based on building priorities
   */
  recalculateAssignments(): void {
    const buildings = this.findAllBuildings();
    const newAssignments = new Map<string, WorkerAssignment>();
    
    // Sort buildings by priority (lower number = higher priority)
    const sortedBuildings = buildings
      .filter(b => b.buildingId)
      .map(b => ({
        ...b,
        priority: WORKER_PRIORITIES[b.buildingId!] ?? 10,
        workersRequired: this.getWorkersRequired(b.buildingId!),
      }))
      .filter(b => b.workersRequired > 0)
      .sort((a, b) => a.priority - b.priority);

    let remainingWorkers = this.totalWorkers;

    // Assign workers in priority order
    for (const building of sortedBuildings) {
      const instanceId = `${building.buildingId}_${building.x}_${building.y}`;
      const workersToAssign = Math.min(building.workersRequired, remainingWorkers);
      
      newAssignments.set(instanceId, {
        buildingInstanceId: instanceId,
        buildingId: building.buildingId!,
        workersAssigned: workersToAssign,
        workersRequired: building.workersRequired,
        priority: building.priority,
        x: building.x,
        y: building.y,
      });

      remainingWorkers -= workersToAssign;
    }

    this.assignments = newAssignments;
    this.availableWorkers = remainingWorkers;
    
    this.emitWorkerChange();
  }

  /**
   * Gets workers required for a building type
   */
  getWorkersRequired(buildingId: string): number {
    // First check the building definition
    const definition = this.buildingRegistry.get(buildingId);
    if (definition?.workersRequired !== undefined) {
      return definition.workersRequired;
    }
    // Fall back to default lookup
    return WORKERS_REQUIRED[buildingId] ?? 0;
  }

  /**
   * Gets the efficiency multiplier for a building (based on worker assignment)
   */
  getBuildingEfficiency(buildingId: string, x: number, y: number): number {
    const instanceId = `${buildingId}_${x}_${y}`;
    const assignment = this.assignments.get(instanceId);
    
    if (!assignment) return 1; // No workers required
    if (assignment.workersRequired === 0) return 1; // Automated building
    
    // Efficiency scales with worker assignment ratio
    return assignment.workersAssigned / assignment.workersRequired;
  }

  /**
   * Checks if a building is fully staffed
   */
  isBuildingFullyStaffed(buildingId: string, x: number, y: number): boolean {
    const instanceId = `${buildingId}_${x}_${y}`;
    const assignment = this.assignments.get(instanceId);
    
    if (!assignment) return true;
    return assignment.workersAssigned >= assignment.workersRequired;
  }

  /**
   * Gets all buildings that need workers but aren't fully staffed
   */
  getUnderstaffedBuildings(): WorkerAssignment[] {
    return Array.from(this.assignments.values())
      .filter(a => a.workersAssigned < a.workersRequired);
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
        if (cell.type === TileType.Building && cell.buildingId) {
          const key = `${cell.originX ?? x},${cell.originY ?? y}`;
          if (!seen.has(key)) {
            seen.add(key);
            buildings.push({
              buildingId: cell.buildingId,
              x: cell.originX ?? x,
              y: cell.originY ?? y,
            });
          }
        }
      }
    }

    return buildings;
  }

  // Getters
  getAssignments(): WorkerAssignment[] {
    return Array.from(this.assignments.values());
  }

  getAvailableWorkers(): number {
    return this.availableWorkers;
  }

  getTotalWorkers(): number {
    return this.totalWorkers;
  }

  getTotalAssigned(): number {
    return this.totalWorkers - this.availableWorkers;
  }

  /**
   * Gets worker stats for UI display
   */
  getWorkerStats(): {
    total: number;
    assigned: number;
    available: number;
    understaffed: number;
  } {
    const understaffed = this.getUnderstaffedBuildings().length;
    return {
      total: this.totalWorkers,
      assigned: this.getTotalAssigned(),
      available: this.availableWorkers,
      understaffed,
    };
  }

  // State management
  reset(): void {
    this.assignments.clear();
    this.availableWorkers = 0;
    this.totalWorkers = 0;
  }

  private emitWorkerChange(): void {
    if (!this.scene) return;
    this.scene.events.emit('workers:changed', {
      stats: this.getWorkerStats(),
      assignments: this.getAssignments(),
    });
  }
}
