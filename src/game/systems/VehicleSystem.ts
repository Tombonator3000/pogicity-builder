import Phaser from 'phaser';
import { Car, CarType, Direction, GridCell, TileType } from '../types';
import { ENTITY_CONFIG, GRID_CONFIG } from '../config';
import { DIRECTION_VECTORS, ALL_DIRECTIONS } from '../utils/DirectionUtils';
import { generateId } from '../utils/IdGenerator';
import { getLaneDirection } from '../roadUtils';
import { GameSystem } from './GameSystem';

/**
 * Vehicle movement and spawning system
 * Handles all vehicle-related logic including lane following
 */
export class VehicleSystem implements GameSystem {
  private scene!: Phaser.Scene;
  private cars: Car[] = [];
  private grid: GridCell[][] = [];

  init(scene: Phaser.Scene): void {
    this.scene = scene;
  }

  /**
   * Sets the grid reference for pathfinding
   */
  setGrid(grid: GridCell[][]): void {
    this.grid = grid;
  }

  /**
   * Gets all active vehicles
   */
  getCars(): Car[] {
    return this.cars;
  }

  /**
   * Gets vehicle count
   */
  getCount(): number {
    return this.cars.length;
  }

  update(delta: number): void {
    for (let i = 0; i < this.cars.length; i++) {
      this.cars[i] = this.updateSingleCar(this.cars[i]);
    }
  }

  /**
   * Spawns a new vehicle on a random asphalt tile
   */
  spawnCar(): void {
    const asphaltTiles = this.findAsphaltTiles();
    if (asphaltTiles.length === 0) return;

    const tile = asphaltTiles[Math.floor(Math.random() * asphaltTiles.length)];
    const laneDir = getLaneDirection(tile.x, tile.y, this.grid);
    const car: Car = {
      id: generateId(),
      x: tile.x + 0.5,
      y: tile.y + 0.5,
      direction: laneDir || Direction.Right,
      speed: ENTITY_CONFIG.vehicleSpeed,
      waiting: 0,
      carType: Math.random() > 0.5 ? CarType.Jeep : CarType.Taxi,
    };

    this.cars.push(car);
  }

  /**
   * Clears all vehicles
   */
  clearCars(): void {
    this.cars = [];
  }

  destroy(): void {
    this.cars = [];
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  private findAsphaltTiles(): Array<{ x: number; y: number }> {
    const asphaltTiles: Array<{ x: number; y: number }> = [];
    for (let gy = 0; gy < GRID_CONFIG.height; gy++) {
      for (let gx = 0; gx < GRID_CONFIG.width; gx++) {
        if (this.grid[gy]?.[gx]?.type === TileType.Asphalt) {
          asphaltTiles.push({ x: gx, y: gy });
        }
      }
    }
    return asphaltTiles;
  }

  private isDrivable(x: number, y: number): boolean {
    const gx = Math.floor(x);
    const gy = Math.floor(y);
    if (gx < 0 || gx >= GRID_CONFIG.width || gy < 0 || gy >= GRID_CONFIG.height) {
      return false;
    }
    return this.grid[gy]?.[gx]?.type === TileType.Asphalt;
  }

  private getValidCarDirections(tileX: number, tileY: number): Direction[] {
    const valid: Direction[] = [];
    for (const dir of ALL_DIRECTIONS) {
      const vec = DIRECTION_VECTORS[dir];
      if (this.isDrivable(tileX + vec.dx, tileY + vec.dy)) {
        valid.push(dir);
      }
    }
    return valid;
  }

  /**
   * Handles teleportation for cars that are off the road network
   * @param car - The car to check
   * @returns Teleported car or null if car is on valid road
   */
  private handleOffGridTeleport(car: Car): Car | null {
    const tileX = Math.floor(car.x);
    const tileY = Math.floor(car.y);

    if (!this.isDrivable(tileX, tileY)) {
      const asphaltTiles = this.findAsphaltTiles();
      if (asphaltTiles.length > 0) {
        const newTile = asphaltTiles[Math.floor(Math.random() * asphaltTiles.length)];
        const laneDir = getLaneDirection(newTile.x, newTile.y, this.grid);
        return {
          ...car,
          x: newTile.x + 0.5,
          y: newTile.y + 0.5,
          direction: laneDir || Direction.Right,
          waiting: 0,
        };
      }
    }
    return null;
  }

  /**
   * Calculates direction change for a car at given position
   * @param car - Current car state
   * @param tileX - Current tile X coordinate
   * @param tileY - Current tile Y coordinate
   * @param nearCenter - Whether car is near tile center
   * @returns Object with new direction and optional position snap
   */
  private calculateDirectionChange(
    car: Car,
    tileX: number,
    tileY: number,
    nearCenter: boolean
  ): { direction: Direction; snapToCenter: boolean } {
    if (!nearCenter) {
      return { direction: car.direction, snapToCenter: false };
    }

    const vec = DIRECTION_VECTORS[car.direction];
    const laneDir = getLaneDirection(tileX, tileY, this.grid);
    const nextTileX = tileX + vec.dx;
    const nextTileY = tileY + vec.dy;

    // Check if next tile is blocked - need to turn
    if (!this.isDrivable(nextTileX, nextTileY)) {
      const validDirs = this.getValidCarDirections(tileX, tileY);
      if (validDirs.length > 0) {
        const newDirection = validDirs[Math.floor(Math.random() * validDirs.length)];
        return { direction: newDirection, snapToCenter: true };
      }
    }

    // Follow lane direction if different from current
    if (laneDir && laneDir !== car.direction) {
      return { direction: laneDir, snapToCenter: false };
    }

    return { direction: car.direction, snapToCenter: false };
  }

  /**
   * Applies movement to car position based on direction and speed
   * @param car - Current car state
   * @param newDirection - Direction to move in
   * @param snapToCenter - Whether to snap to tile center
   * @returns Updated car with new position
   */
  private applyCarMovement(car: Car, newDirection: Direction, snapToCenter: boolean): Car {
    const tileX = Math.floor(car.x);
    const tileY = Math.floor(car.y);
    const moveVec = DIRECTION_VECTORS[newDirection];

    let nextX = car.x;
    let nextY = car.y;

    // Snap to center if turning at intersection
    if (snapToCenter) {
      nextX = tileX + 0.5;
      nextY = tileY + 0.5;
    }

    // Apply movement
    nextX += moveVec.dx * car.speed;
    nextY += moveVec.dy * car.speed;

    return { ...car, x: nextX, y: nextY, direction: newDirection, waiting: 0 };
  }

  private updateSingleCar(car: Car): Car {
    // Handle cars that are off the road network
    const teleportedCar = this.handleOffGridTeleport(car);
    if (teleportedCar) {
      return teleportedCar;
    }

    // Calculate position and check if near tile center
    const tileX = Math.floor(car.x);
    const tileY = Math.floor(car.y);
    const inTileX = car.x - tileX;
    const inTileY = car.y - tileY;
    const threshold = car.speed * 2;
    const nearCenter =
      Math.abs(inTileX - 0.5) < threshold && Math.abs(inTileY - 0.5) < threshold;

    // Determine direction change (lane following, obstacle avoidance)
    const { direction: newDirection, snapToCenter } = this.calculateDirectionChange(
      car,
      tileX,
      tileY,
      nearCenter
    );

    // Apply movement with new direction
    return this.applyCarMovement(car, newDirection, snapToCenter);
  }
}
