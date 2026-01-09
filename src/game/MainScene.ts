import Phaser from 'phaser';
import { GridCell, TileType, ToolType, Direction } from './types';
import { GRID_CONFIG } from './config';
import { BUILDINGS } from './buildings';
import {
  CharacterSystem,
  VehicleSystem,
  CameraSystem,
  RenderSystem,
  InputSystem,
  SceneEvents,
} from './systems';

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

  constructor() {
    super({ key: 'MainScene' });
  }

  init(data: MainSceneData): void {
    this.grid = data.grid;
    this.onGridChange = data.onGridChange;
  }

  preload(): void {
    // Load tile textures
    this.load.image('grass', '/Tiles/1x1grass.png');
    this.load.image('road', '/Tiles/1x1square_tile.png');
    this.load.image('asphalt', '/Tiles/1x1asphalt_tile.png');
    this.load.image('snow_1', '/Tiles/1x1snow_tile_1.png');
    this.load.image('snow_2', '/Tiles/1x1snow_tile_2.png');
    this.load.image('snow_3', '/Tiles/1x1snow_tile_3.png');
    this.load.image('tile', '/Tiles/1x1square_tile.png');

    // Load building textures dynamically from registry
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
        this.load.image(`${car}_${dir}`, `/cars/${car}${dir}.png`);
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

    // Render entities
    this.renderSystem.renderCharacters(this.characterSystem.getCharacters());
    this.renderSystem.renderCars(this.vehicleSystem.getCars());
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

  private initializeSystems(): void {
    // Initialize Character System
    this.characterSystem = new CharacterSystem();
    this.characterSystem.init(this);
    this.characterSystem.setGrid(this.grid);

    // Initialize Vehicle System
    this.vehicleSystem = new VehicleSystem();
    this.vehicleSystem.init(this);
    this.vehicleSystem.setGrid(this.grid);

    // Initialize Camera System
    this.cameraSystem = new CameraSystem();
    this.cameraSystem.init(this);

    // Initialize Render System
    this.renderSystem = new RenderSystem();
    this.renderSystem.init(this);
    this.renderSystem.setGrid(this.grid);

    // Initialize Input System
    this.inputSystem = new InputSystem();
    this.inputSystem.init(this);
    this.inputSystem.setGrid(this.grid);

    // Set up input event handlers for wheel zoom
    this.input.on('wheel', this.handleWheel, this);
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

  getCharacterCount(): number {
    return this.characterSystem.getCount();
  }

  getCarCount(): number {
    return this.vehicleSystem.getCount();
  }

  shakeScreen(intensity?: number, duration?: number): void {
    this.cameraSystem.shakeScreen(intensity, duration);
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
