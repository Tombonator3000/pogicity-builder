import Phaser from 'phaser';
import { Character, CharacterType, Direction, GridCell, TileType } from '../types';
import { ENTITY_CONFIG, GRID_CONFIG } from '../config';
import {
  DIRECTION_VECTORS,
  OPPOSITE_DIRECTION,
  ALL_DIRECTIONS,
  getRandomDirection
} from '../utils/DirectionUtils';
import { generateId } from '../utils/IdGenerator';
import { GameSystem } from './GameSystem';

/**
 * Character movement and spawning system
 * Handles all character-related logic including pathfinding and movement
 */
export class CharacterSystem implements GameSystem {
  private scene!: Phaser.Scene;
  private characters: Character[] = [];
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
   * Gets all active characters
   */
  getCharacters(): Character[] {
    return this.characters;
  }

  /**
   * Gets character count
   */
  getCount(): number {
    return this.characters.length;
  }

  update(delta: number): void {
    for (let i = 0; i < this.characters.length; i++) {
      this.characters[i] = this.updateSingleCharacter(this.characters[i]);
    }
  }

  /**
   * Spawns a new character on a random walkable tile
   */
  spawnCharacter(): void {
    const walkableTiles = this.findWalkableTiles();
    if (walkableTiles.length === 0) return;

    const tile = walkableTiles[Math.floor(Math.random() * walkableTiles.length)];
    const character: Character = {
      id: generateId(),
      x: tile.x + 0.5,
      y: tile.y + 0.5,
      direction: getRandomDirection(),
      speed: ENTITY_CONFIG.characterSpeed,
      characterType: Math.random() > 0.5 ? CharacterType.Banana : CharacterType.Apple,
    };

    this.characters.push(character);
  }

  /**
   * Clears all characters
   */
  clearCharacters(): void {
    this.characters = [];
  }

  destroy(): void {
    this.characters = [];
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  private findWalkableTiles(): Array<{ x: number; y: number }> {
    const walkableTiles: Array<{ x: number; y: number }> = [];
    for (let gy = 0; gy < GRID_CONFIG.height; gy++) {
      for (let gx = 0; gx < GRID_CONFIG.width; gx++) {
        const tileType = this.grid[gy]?.[gx]?.type;
        if (tileType === TileType.Road || tileType === TileType.Tile) {
          walkableTiles.push({ x: gx, y: gy });
        }
      }
    }
    return walkableTiles;
  }

  private isWalkable(x: number, y: number): boolean {
    const gx = Math.floor(x);
    const gy = Math.floor(y);
    if (gx < 0 || gx >= GRID_CONFIG.width || gy < 0 || gy >= GRID_CONFIG.height) {
      return false;
    }
    const tileType = this.grid[gy]?.[gx]?.type;
    return tileType === TileType.Road || tileType === TileType.Tile;
  }

  private getValidDirections(tileX: number, tileY: number): Direction[] {
    const valid: Direction[] = [];
    for (const dir of ALL_DIRECTIONS) {
      const vec = DIRECTION_VECTORS[dir];
      if (this.isWalkable(tileX + vec.dx, tileY + vec.dy)) {
        valid.push(dir);
      }
    }
    return valid;
  }

  private pickNewDirection(
    tileX: number,
    tileY: number,
    currentDir: Direction
  ): Direction | null {
    const validDirs = this.getValidDirections(tileX, tileY);
    if (validDirs.length === 0) return null;

    const opposite = OPPOSITE_DIRECTION[currentDir];
    const preferredDirs = validDirs.filter((d) => d !== opposite);

    // 60% chance to continue in same direction
    if (preferredDirs.includes(currentDir) && Math.random() < 0.6) {
      return currentDir;
    }

    const choices = preferredDirs.length > 0 ? preferredDirs : validDirs;
    return choices[Math.floor(Math.random() * choices.length)];
  }

  private updateSingleCharacter(char: Character): Character {
    const { x, y, direction, speed } = char;
    const vec = DIRECTION_VECTORS[direction];
    const tileX = Math.floor(x);
    const tileY = Math.floor(y);

    // Teleport if not on walkable tile
    if (!this.isWalkable(tileX, tileY)) {
      const walkableTiles = this.findWalkableTiles();
      if (walkableTiles.length > 0) {
        const newTile = walkableTiles[Math.floor(Math.random() * walkableTiles.length)];
        return {
          ...char,
          x: newTile.x + 0.5,
          y: newTile.y + 0.5,
          direction: getRandomDirection(),
        };
      }
      return char;
    }

    const inTileX = x - tileX;
    const inTileY = y - tileY;
    const threshold = speed * 3;
    const nearCenter =
      Math.abs(inTileX - 0.5) < threshold && Math.abs(inTileY - 0.5) < threshold;

    let newDirection = direction;
    let nextX = x;
    let nextY = y;

    // Check for direction change when near tile center
    if (nearCenter) {
      const nextTileX = tileX + vec.dx;
      const nextTileY = tileY + vec.dy;

      if (!this.isWalkable(nextTileX, nextTileY)) {
        const newDir = this.pickNewDirection(tileX, tileY, direction);
        if (newDir) {
          newDirection = newDir;
        }
        // Snap to center
        nextX = tileX + 0.5;
        nextY = tileY + 0.5;
      }
    }

    // Apply movement
    const moveVec = DIRECTION_VECTORS[newDirection];
    nextX += moveVec.dx * speed;
    nextY += moveVec.dy * speed;

    return { ...char, x: nextX, y: nextY, direction: newDirection };
  }
}
