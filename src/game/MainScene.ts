import Phaser from 'phaser';
import { GridCell, TileType, ToolType, Direction, Resources, OverlayType, QueryResult } from './types';
import { GRID_CONFIG } from './config';
import { BUILDINGS } from './buildings';
import { getAssetPath } from './utils/AssetPathUtils';
import {
  CharacterSystem,
  VehicleSystem,
  CameraSystem,
  RenderSystem,
  InputSystem,
  ResourceSystem,
  SceneEvents,
  ZoningSystem,
  OverlaySystem,
  HistorySystem,
  ScenarioSystem,
  OrdinanceSystem,
  DisasterSystem,
} from './systems';
import { PopulationSystem } from './systems/PopulationSystem';
import { EventSystem } from './systems/EventSystem';
import { WorkerSystem } from './systems/WorkerSystem';

/**
 * Main game scene - Refactored with modular systems
 * This scene now uses composition instead of inheritance
 */

interface MainSceneData {
  grid: GridCell[][];
  onGridChange: (grid: GridCell[][]) => void;
}

export class MainScene extends Phaser.Scene {
  // Game state
  private grid: GridCell[][] = [];
  private onGridChange!: (grid: GridCell[][]) => void;
  private isReady: boolean = false;

  // Systems (modular architecture)
  private characterSystem!: CharacterSystem;
  private vehicleSystem!: VehicleSystem;
  private cameraSystem!: CameraSystem;
  private renderSystem!: RenderSystem;
  private inputSystem!: InputSystem;
  private resourceSystem!: ResourceSystem;
  private populationSystem!: PopulationSystem;
  private eventSystem!: EventSystem;
  private workerSystem!: WorkerSystem;
  private zoningSystem!: ZoningSystem;
  private overlaySystem!: OverlaySystem;
  private historySystem!: HistorySystem;
  // Phase 4: Content Systems
  private scenarioSystem!: ScenarioSystem;
  private ordinanceSystem!: OrdinanceSystem;
  private disasterSystem!: DisasterSystem;

  constructor() {
    super({ key: 'MainScene' });
  }

  init(data: MainSceneData): void {
    this.grid = data.grid;
    this.onGridChange = data.onGridChange;
  }

  preload(): void {
    // Load tile textures - standard
    this.load.image('grass', getAssetPath('Tiles/1x1grass.png'));
    this.load.image('road', getAssetPath('Tiles/1x1square_tile.png'));
    this.load.image('asphalt', getAssetPath('Tiles/1x1asphalt_tile.png'));
    this.load.image('snow_1', getAssetPath('Tiles/1x1snow_tile_1.png'));
    this.load.image('snow_2', getAssetPath('Tiles/1x1snow_tile_2.png'));
    this.load.image('snow_3', getAssetPath('Tiles/1x1snow_tile_3.png'));
    this.load.image('tile', getAssetPath('Tiles/1x1square_tile.png'));
    
    // Load tile textures - wasteland
    this.load.image('wasteland', getAssetPath('Tiles/1x1wasteland_tile.png'));
    this.load.image('radiation', getAssetPath('Tiles/1x1radiation_tile.png'));
    this.load.image('rubble', getAssetPath('Tiles/1x1rubble_tile.png'));

    // Load building textures dynamically from registry
    // Building paths are already resolved via BUILDINGS proxy
    for (const building of Object.values(BUILDINGS)) {
      for (const [dir, path] of Object.entries(building.sprites)) {
        const key = `${building.id}_${dir}`;
        this.load.image(key, path);
      }
    }

    // Load car textures
    const carTypes = ['jeep', 'taxi'];
    const directions = ['n', 's', 'e', 'w'];
    for (const car of carTypes) {
      for (const dir of directions) {
        this.load.image(`${car}_${dir}`, getAssetPath(`cars/${car}${dir}.png`));
      }
    }
  }

  create(): void {
    // Initialize grid if needed
    this.initializeGrid();

    // Initialize all systems
    this.initializeSystems();

    // Mark scene as ready
    this.isReady = true;

    // Initial render
    this.renderSystem.renderGrid();
  }

  update(_time: number, delta: number): void {
    if (!this.isReady) return;

    // Update all systems
    this.characterSystem.update(delta);
    this.vehicleSystem.update(delta);
    this.cameraSystem.update(delta);
    this.populationSystem.update(delta);
    this.eventSystem.update(delta);
    this.zoningSystem.update(_time, delta);
    this.overlaySystem.update(delta);
    this.historySystem.update(delta);
    // Phase 4: Content Systems
    this.scenarioSystem.update(delta);
    this.ordinanceSystem.update(delta);
    this.disasterSystem.update(delta);

    // Update resources with population consumption
    this.updateResourcesWithPopulation(delta);

    // Update zoning system with current game state
    this.updateZoningSystem(_time);

    // Update overlay system with current game state
    this.updateOverlaySystem();

    // Record historical data
    this.recordHistoricalData(_time);

    // Render entities
    this.renderSystem.renderCharacters(this.characterSystem.getCharacters());
    this.renderSystem.renderCars(this.vehicleSystem.getCars());
  }

  /**
   * Integrates population consumption into resource updates
   */
  private updateResourcesWithPopulation(delta: number): void {
    const resources = this.resourceSystem.getResources();

    // Get population consumption
    const consumption = this.populationSystem.getPopulationConsumption();

    // Get event rate modifiers
    const eventMods = this.eventSystem.getActiveRateModifiers();

    // Apply population consumption as additional consumption
    // This is handled in the resource system update with modified rates

    // Update happiness based on resource availability
    this.populationSystem.updateHappiness(resources, delta / 1000);

    // Check for population death
    this.populationSystem.checkPopulationDeath();

    // Sync population to resources and worker system
    const popState = this.populationSystem.getState();
    const currentResources = this.resourceSystem.getResources();
    currentResources.population = popState.current;
    currentResources.maxPopulation = popState.max;
    currentResources.happiness = popState.happiness;
    this.resourceSystem.setResources(currentResources);

    // Update worker system with current population (workers = population)
    this.workerSystem.setTotalWorkers(popState.current);
    this.workerSystem.update(delta);

    // Normal resource update (now uses worker efficiency)
    this.resourceSystem.update(delta);
  }

  /**
   * Updates the zoning system with current game state
   */
  private updateZoningSystem(time: number): void {
    const resources = this.resourceSystem.getResources();
    const popState = this.populationSystem.getState();

    // Calculate zone demand periodically
    const demand = this.zoningSystem.calculateZoneDemand(
      this.grid,
      popState.current,
      popState.max,
      resources
    );

    // Check for automatic building growth in zones
    const growthLocations = this.zoningSystem.checkForGrowth(
      this.grid,
      demand,
      Object.values(BUILDINGS)
    );

    // Place buildings in zones that are ready for development
    for (const location of growthLocations) {
      if (location.building) {
        // TODO: Implement automatic building placement
        // For now, just mark the zone as developed
        console.log(
          `[ZONING] Zone at (${location.x}, ${location.y}) ready for ${location.zoneType} development`
        );
      }
    }
  }

  /**
   * Updates the overlay system with current game state
   */
  private updateOverlaySystem(): void {
    const activeOverlay = this.overlaySystem.getActiveOverlay();
    if (activeOverlay === OverlayType.None) {
      return;
    }

    const resources = this.resourceSystem.getResources();
    const zoneDemand = this.zoningSystem.getZoneDemand();

    // Calculate overlay data for all cells
    this.overlaySystem.calculateOverlayData(this.grid, resources, zoneDemand);

    // Trigger re-render with overlay
    this.renderSystem.renderGrid();
  }

  /**
   * Records historical data for graphs
   */
  private recordHistoricalData(gameTime: number): void {
    const resources = this.resourceSystem.getResources();
    const popState = this.populationSystem.getState();
    const zoneDemand = this.zoningSystem.getZoneDemand();

    this.historySystem.recordDataPoint(
      gameTime / 1000, // Convert to seconds
      popState.current,
      popState.happiness,
      resources,
      zoneDemand
      // TODO: Add income/expenses when budget system is implemented
    );
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  private initializeGrid(): void {
    if (!this.grid || this.grid.length === 0) {
      this.grid = Array.from({ length: GRID_CONFIG.height }, (_, y) =>
        Array.from({ length: GRID_CONFIG.width }, (_, x) => ({
          type: TileType.Grass,
          x,
          y,
          isOrigin: true,
        }))
      );
    }
  }

  /**
   * Helper function to initialize a system with the scene and optionally the grid.
   * Reduces boilerplate code by handling the common initialization pattern.
   *
   * @param system - The system instance to initialize
   * @param needsGrid - Whether this system needs the grid reference (default: true)
   * @returns The initialized system for method chaining
   */
  private initializeSystem<T extends { init: (scene: Phaser.Scene) => void; setGrid?: (grid: any) => void }>(
    system: T,
    needsGrid: boolean = true
  ): T {
    system.init(this);
    if (needsGrid && system.setGrid) {
      system.setGrid(this.grid);
    }
    return system;
  }

  private initializeSystems(): void {
    // Initialize all systems with reduced boilerplate
    this.characterSystem = this.initializeSystem(new CharacterSystem());
    this.vehicleSystem = this.initializeSystem(new VehicleSystem());
    this.cameraSystem = this.initializeSystem(new CameraSystem(), false);
    this.renderSystem = this.initializeSystem(new RenderSystem());
    this.inputSystem = this.initializeSystem(new InputSystem());
    this.resourceSystem = this.initializeSystem(new ResourceSystem());
    this.populationSystem = this.initializeSystem(new PopulationSystem());
    this.workerSystem = this.initializeSystem(new WorkerSystem());
    this.eventSystem = this.initializeSystem(new EventSystem(), false);
    this.zoningSystem = this.initializeSystem(new ZoningSystem(), false);
    this.overlaySystem = this.initializeSystem(new OverlaySystem(), false);
    this.historySystem = this.initializeSystem(new HistorySystem(), false);
    // Phase 4: Content Systems
    this.scenarioSystem = this.initializeSystem(new ScenarioSystem(), false);
    this.ordinanceSystem = this.initializeSystem(new OrdinanceSystem(), false);
    this.disasterSystem = this.initializeSystem(new DisasterSystem(), false);

    // Register all buildings with systems
    for (const building of Object.values(BUILDINGS)) {
      this.resourceSystem.registerBuilding(building);
      this.populationSystem.registerBuilding(building);
      this.workerSystem.registerBuilding(building);
    }

    // Connect worker system to resource system
    this.resourceSystem.setWorkerSystem(this.workerSystem);

    // Connect overlay system to render system
    this.renderSystem.setOverlaySystem(this.overlaySystem);

    // Set up event listeners
    this.setupEventListeners();

    // Set up input event handlers for wheel zoom
    this.input.on('wheel', this.handleWheel, this);
  }

  /**
   * Sets up event listeners between systems
   */
  private setupEventListeners(): void {
    // Handle event effects
    this.events.on('event:apply', (effect: Partial<Resources>) => {
      // Handle population effect separately
      if (effect.population) {
        this.populationSystem.addPopulation(effect.population);
      }
      
      // Apply resource effects
      const resourceEffect: Partial<Resources> = { ...effect };
      delete resourceEffect.population;
      delete resourceEffect.maxPopulation;
      delete resourceEffect.happiness;
      
      this.resourceSystem.addResources(resourceEffect);
    });

    // Log events
    this.events.on('event:triggered', (event: { name: string; type: string }) => {
      console.log(`[EVENT] ${event.type}: ${event.name}`);
    });

    this.events.on('population:death', (data: { deaths: number }) => {
      console.log(`[POPULATION] ${data.deaths} settler(s) died!`);
    });

    this.events.on('population:growth', (data: { population: number }) => {
      console.log(`[POPULATION] New settler arrived! Total: ${data.population}`);
    });

    // Phase 4: Scenario system event listeners
    this.events.on('objective:check', (data: { objective: any; result: { value: number } }) => {
      // Update objective progress based on game state
      const { objective, result } = data;

      switch (objective.type) {
        case 'population':
          result.value = this.populationSystem.getPopulation();
          break;
        case 'happiness':
          result.value = this.populationSystem.getHappiness();
          break;
        case 'resources':
          result.value = this.resourceSystem.getResources().scrap; // Example: scrap
          break;
        case 'budget':
          result.value = this.resourceSystem.getResources().caps;
          break;
        case 'survival':
          // Handled by scenario system's elapsed time
          break;
      }
    });

    // Phase 4: Ordinance system event listeners
    this.events.on('ordinance:checkRequirements', (data: { ordinance: any; result: { passed: boolean } }) => {
      const { ordinance, result } = data;
      const requirements = ordinance.requirements;

      if (!requirements) {
        result.passed = true;
        return;
      }

      // Check population requirement
      if (requirements.minPopulation) {
        if (this.populationSystem.getPopulation() < requirements.minPopulation) {
          result.passed = false;
          return;
        }
      }

      // Check budget requirement
      if (requirements.minBudget) {
        if (this.resourceSystem.getResources().caps < requirements.minBudget) {
          result.passed = false;
          return;
        }
      }

      // Check building requirements
      if (requirements.requiredBuildings && requirements.requiredBuildings.length > 0) {
        // TODO: Check if required buildings exist
        // For now, pass the check
      }

      result.passed = true;
    });

    this.events.on('ordinance:monthlyCosts', (data: { costs: Record<string, number>; totalCost: number }) => {
      // Apply monthly ordinance costs to budget
      this.resourceSystem.addResources({ caps: -data.totalCost });
    });

    // Phase 4: Disaster system event listeners
    this.events.on('disaster:getBuildingsInRadius', (data: { epicenter: { x: number; y: number }; radius: number; buildings: string[] }) => {
      // Find all buildings within radius of epicenter
      for (let x = 0; x < this.grid.length; x++) {
        for (let y = 0; y < this.grid[x].length; y++) {
          const cell = this.grid[x][y];
          if (cell.buildingId && cell.isOrigin) {
            // Calculate distance to epicenter
            const dx = x - data.epicenter.x;
            const dy = y - data.epicenter.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= data.radius) {
              data.buildings.push(cell.buildingId);
            }
          }
        }
      }
    });

    this.events.on('building:getPosition', (data: { buildingId: string; position: { x: number; y: number } }) => {
      // Find building position in grid
      for (let x = 0; x < this.grid.length; x++) {
        for (let y = 0; y < this.grid[x].length; y++) {
          const cell = this.grid[x][y];
          if (cell.buildingId === data.buildingId && cell.isOrigin) {
            data.position.x = x;
            data.position.y = y;
            return;
          }
        }
      }
    });

    this.events.on('disaster:getGridSize', (data: { width: number; height: number }) => {
      data.width = this.grid.length;
      data.height = this.grid[0]?.length || 0;
    });

    this.events.on('building:checkRepairCost', (data: { buildingId: string; cost: any; result: { canAfford: boolean } }) => {
      const resources = this.resourceSystem.getResources();
      const cost = data.cost;

      // Check if player can afford repair
      data.result.canAfford = true;
      if (cost.scrap && resources.scrap < cost.scrap) data.result.canAfford = false;
      if (cost.caps && resources.caps < cost.caps) data.result.canAfford = false;
    });

    this.events.on('building:applyRepairCost', (data: { buildingId: string; cost: any }) => {
      // Deduct repair cost from resources
      const cost = data.cost;
      this.resourceSystem.addResources({
        scrap: -(cost.scrap || 0),
        caps: -(cost.caps || 0),
      });
    });

    this.events.on('building:getValue', (data: { buildingId: string; value: { scrap: number; caps: number } }) => {
      // Get building base value from BUILDINGS registry
      // For now, use default values (can be enhanced later)
      data.value.scrap = 50;
      data.value.caps = 25;
    });

    // Log disaster events
    this.events.on('disaster:warning', (disaster: any) => {
      console.log(`[DISASTER WARNING] ${disaster.name}: ${disaster.warning?.message}`);
    });

    this.events.on('disaster:started', (disaster: any) => {
      console.log(`[DISASTER] ${disaster.name} has begun!`);
    });

    this.events.on('disaster:ended', (disaster: any) => {
      console.log(`[DISASTER] ${disaster.name} has ended. Damage dealt: ${disaster.damageDealt}`);
    });

    this.events.on('building:destroyed', (buildingId: string) => {
      console.log(`[DISASTER] Building ${buildingId} has been destroyed!`);
    });
  }

  // ============================================
  // PUBLIC API (called from React)
  // ============================================

  setTool(tool: ToolType): void {
    this.inputSystem.setTool(tool);
  }

  setBuilding(buildingId: string | null): void {
    this.inputSystem.setBuilding(buildingId);
  }

  setDirection(direction: Direction): void {
    this.inputSystem.setDirection(direction);
  }

  setZoom(zoom: number): void {
    this.cameraSystem.setZoom(zoom);
  }

  getZoom(): number {
    return this.cameraSystem.getZoom();
  }

  updateGrid(newGrid: GridCell[][]): void {
    this.grid = newGrid;
    this.characterSystem.setGrid(this.grid);
    this.vehicleSystem.setGrid(this.grid);
    this.renderSystem.setGrid(this.grid);
    this.inputSystem.setGrid(this.grid);
    this.renderSystem.renderGrid();
  }

  setEvents(events: Partial<SceneEvents>): void {
    this.inputSystem.setEvents(events);
  }

  spawnCharacter(): void {
    this.characterSystem.spawnCharacter();
  }

  spawnCar(): void {
    this.vehicleSystem.spawnCar();
  }

  // ============================================
  // ZONING API
  // ============================================

  getZoneDemand() {
    return this.zoningSystem.getZoneDemand();
  }

  getZoneStats() {
    return this.zoningSystem.getZoneStats();
  }

  // ============================================
  // OVERLAY API
  // ============================================

  /**
   * Set the active overlay type for data visualization
   */
  setOverlay(overlayType: OverlayType): void {
    this.overlaySystem.setActiveOverlay(overlayType);
    // Immediately update and render with new overlay
    this.updateOverlaySystem();
  }

  /**
   * Get the currently active overlay type
   */
  getActiveOverlay(): OverlayType {
    return this.overlaySystem.getActiveOverlay();
  }

  /**
   * Query information about a specific cell
   */
  queryCell(x: number, y: number): QueryResult | null {
    if (x < 0 || x >= GRID_CONFIG.width || y < 0 || y >= GRID_CONFIG.height) {
      return null;
    }

    const cell = this.grid[y][x];
    const result: QueryResult = {
      x,
      y,
      tileType: cell.type,
      overlayData: cell.overlayData,
      issues: this.overlaySystem.getIssues(cell),
    };

    // Add building info if present
    if (cell.buildingId && cell.isOrigin) {
      const building = BUILDINGS[cell.buildingId];
      if (building) {
        const workerAssignment = this.workerSystem.getWorkerAssignments().find(
          w => w.x === x && w.y === y
        );

        result.building = {
          id: building.id,
          name: building.name,
          category: building.category,
          produces: building.produces,
          consumes: building.consumes,
          workersAssigned: workerAssignment?.workersAssigned || 0,
          workersRequired: building.workersRequired || 0,
          status: this.getBuildingStatus(cell, workerAssignment),
        };
      }
    }

    // Add zone info if present
    if (cell.zoneType) {
      result.zone = {
        type: cell.zoneType,
        density: cell.zoneDensity || 'low' as any,
        developmentLevel: cell.zoneDevelopmentLevel || 0,
      };
    }

    return result;
  }

  /**
   * Get building status string for query results
   */
  private getBuildingStatus(cell: GridCell, workerAssignment?: { workersAssigned: number; workersRequired: number }): string {
    const issues: string[] = [];

    // Check worker staffing
    if (workerAssignment && workerAssignment.workersRequired > 0) {
      const efficiency = (workerAssignment.workersAssigned / workerAssignment.workersRequired) * 100;
      if (efficiency < 50) {
        issues.push('Severely understaffed');
      } else if (efficiency < 100) {
        issues.push('Understaffed');
      }
    }

    // Check overlay issues
    if (cell.overlayData) {
      if (cell.overlayData.power !== undefined && cell.overlayData.power < 50) {
        issues.push('No power');
      }
      if (cell.overlayData.water !== undefined && cell.overlayData.water < 50) {
        issues.push('No water');
      }
      if (cell.overlayData.radiation !== undefined && cell.overlayData.radiation > 50) {
        issues.push('High radiation');
      }
    }

    return issues.length > 0 ? issues.join(', ') : 'Operating normally';
  }

  // ============================================
  // HISTORY & GRAPHS API
  // ============================================

  /**
   * Get history system for graph data
   */
  getHistorySystem(): HistorySystem {
    return this.historySystem;
  }

  /**
   * Get historical data for a time range
   */
  getHistoricalData(range: '1h' | '6h' | '24h' | '7d' | 'all'): any[] {
    const gameTime = this.time.now;
    return this.historySystem.exportForCharts(range, gameTime / 1000);
  }

  getCharacterCount(): number {
    return this.characterSystem.getCount();
  }

  getCarCount(): number {
    return this.vehicleSystem.getCount();
  }

  shakeScreen(axis?: 'x' | 'y' | 'both', intensity?: number, duration?: number): void {
    this.cameraSystem.shakeScreen(axis, intensity, duration);
  }

  // Resource system getters
  getResourceSystem(): ResourceSystem {
    return this.resourceSystem;
  }

  // Event system methods
  applyEventChoice(eventId: string, choiceIndex: number): void {
    this.eventSystem.applyEventChoice(eventId, choiceIndex);
  }

  // Phase 4: Content system getters
  getScenarioSystem(): ScenarioSystem {
    return this.scenarioSystem;
  }

  getOrdinanceSystem(): OrdinanceSystem {
    return this.ordinanceSystem;
  }

  getDisasterSystem(): DisasterSystem {
    return this.disasterSystem;
  }

  // ============================================
  // INPUT HANDLERS
  // ============================================

  handlePointerMove(pointer: Phaser.Input.Pointer): void {
    // Check if camera is panning
    if (this.cameraSystem.isPanningActive() && pointer.leftButtonDown()) {
      this.cameraSystem.updatePanning(pointer.x, pointer.y);
      return;
    }
    // Input system handles the rest
  }

  handlePointerDown(pointer: Phaser.Input.Pointer): void {
    // Right/middle button = camera pan
    if (pointer.rightButtonDown || pointer.middleButtonDown) {
      this.cameraSystem.startPanning(pointer.x, pointer.y);
      return;
    }

    // Left button with no tool = camera pan
    if (pointer.leftButtonDown && !this.inputSystem.isDraggingActive()) {
      // Let input system handle tool interactions first
      // If no tool selected, camera system will pan
      const hasTool = false; // InputSystem will determine this
      if (!hasTool) {
        this.cameraSystem.startPanning(pointer.x, pointer.y);
      }
    }
  }

  handlePointerUp(_pointer: Phaser.Input.Pointer): void {
    this.cameraSystem.stopPanning();
  }

  handleWheel(
    _pointer: Phaser.Input.Pointer,
    _gameObjects: Phaser.GameObjects.GameObject[],
    _deltaX: number,
    deltaY: number
  ): void {
    this.cameraSystem.handleWheel(deltaY);
  }
}
