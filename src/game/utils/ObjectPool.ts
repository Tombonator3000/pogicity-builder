/**
 * Generic object pool for performance optimization
 * Reduces garbage collection pressure by reusing objects
 */

export interface Poolable {
  /** Reset the object to initial state */
  reset(): void;
}

export class ObjectPool<T extends Poolable> {
  private pool: T[] = [];
  private createFn: () => T;
  private maxSize: number;

  /**
   * Creates a new object pool
   * @param createFn - Function to create new instances
   * @param maxSize - Maximum pool size (default: 100)
   */
  constructor(createFn: () => T, maxSize: number = 100) {
    this.createFn = createFn;
    this.maxSize = maxSize;
  }

  /**
   * Acquires an object from the pool or creates a new one
   * @returns Object instance
   */
  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.createFn();
  }

  /**
   * Releases an object back to the pool
   * @param obj - Object to release
   */
  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      obj.reset();
      this.pool.push(obj);
    }
  }

  /**
   * Pre-allocates objects in the pool
   * @param count - Number of objects to pre-allocate
   */
  preallocate(count: number): void {
    for (let i = 0; i < count; i++) {
      this.pool.push(this.createFn());
    }
  }

  /**
   * Clears the pool
   */
  clear(): void {
    this.pool = [];
  }

  /**
   * Gets current pool size
   */
  getSize(): number {
    return this.pool.length;
  }
}

/**
 * Sprite pool for Phaser sprites
 * Manages a pool of reusable sprites
 */
export class SpritePool {
  private pool: Map<string, Phaser.GameObjects.Sprite[]> = new Map();
  private scene: Phaser.Scene;
  private maxPerTexture: number;

  constructor(scene: Phaser.Scene, maxPerTexture: number = 50) {
    this.scene = scene;
    this.maxPerTexture = maxPerTexture;
  }

  /**
   * Acquires a sprite from the pool or creates a new one
   * @param textureKey - Texture key
   * @returns Sprite instance
   */
  acquire(textureKey: string): Phaser.GameObjects.Sprite {
    const poolForTexture = this.pool.get(textureKey);

    if (poolForTexture && poolForTexture.length > 0) {
      const sprite = poolForTexture.pop()!;
      sprite.setActive(true);
      sprite.setVisible(true);
      return sprite;
    }

    return this.scene.add.sprite(0, 0, textureKey);
  }

  /**
   * Releases a sprite back to the pool
   * @param sprite - Sprite to release
   * @param textureKey - Texture key
   */
  release(sprite: Phaser.GameObjects.Sprite, textureKey: string): void {
    let poolForTexture = this.pool.get(textureKey);

    if (!poolForTexture) {
      poolForTexture = [];
      this.pool.set(textureKey, poolForTexture);
    }

    if (poolForTexture.length < this.maxPerTexture) {
      sprite.setActive(false);
      sprite.setVisible(false);
      poolForTexture.push(sprite);
    } else {
      sprite.destroy();
    }
  }

  /**
   * Clears all pools
   */
  clear(): void {
    for (const poolForTexture of this.pool.values()) {
      for (const sprite of poolForTexture) {
        sprite.destroy();
      }
    }
    this.pool.clear();
  }
}
