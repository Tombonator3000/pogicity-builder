import Phaser from 'phaser';

/**
 * Base interface for all game systems
 * Systems implement specific game logic in a modular way
 */
export interface GameSystem {
  /**
   * Initializes the system with a reference to the scene
   * @param scene - The Phaser scene this system operates in
   */
  init(scene: Phaser.Scene): void;

  /**
   * Updates the system logic (called every frame)
   * @param delta - Time elapsed since last frame in milliseconds
   */
  update?(delta: number): void;

  /**
   * Cleans up system resources
   */
  destroy?(): void;
}
