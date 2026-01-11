import Phaser from 'phaser';
import { Car, Character, CharacterType, Direction, GridCell, TileType } from '../types';
import { COLOR_PALETTE, GRID_CONFIG, RENDER_CONFIG } from '../config';
import { calculateDepth, getSnowTextureKey, gridToScreen } from '../utils/GridUtils';
import { directionToShortString, directionToString } from '../utils/DirectionUtils';
import { getBuilding, getBuildingFootprint } from '../buildings';
import { CharacterAnimationManager } from '../GifLoader';
import { GameSystem } from './GameSystem';

/**
 * Rendering system
 * Handles all visual rendering for tiles, buildings, characters, and vehicles
 */
export class RenderSystem implements GameSystem {
  private scene!: Phaser.Scene;
  private grid: GridCell[][] = [];

  // Sprite containers
  private tileSprites: Map<string, Phaser.GameObjects.Image> = new Map();
  private buildingSprites: Map<string, Phaser.GameObjects.Image> = new Map();
  private carSprites: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private characterSprites: Map<string, Phaser.GameObjects.Image> = new Map();

  // Character animation
  private characterAnimationManager: CharacterAnimationManager | null = null;
  private characterAnimationFrames: Map<
    string,
    { frameIndex: number; elapsed: number; lastDir: string }
  > = new Map();

  init(scene: Phaser.Scene): void {
    this.scene = scene;

    // Initialize character animation manager
    this.characterAnimationManager = new CharacterAnimationManager(scene);
    this.characterAnimationManager.loadCharacterAnimations().then(() => {
      console.log('Character animations loaded');
    });
  }

  /**
   * Sets the grid to render
   */
  setGrid(grid: GridCell[][]): void {
    this.grid = grid;
  }

  /**
   * Renders the entire grid (tiles and buildings)
   */
  renderGrid(): void {
    // Clear existing sprites
    this.tileSprites.forEach((sprite) => sprite.destroy());
    this.tileSprites.clear();
    this.buildingSprites.forEach((sprite) => sprite.destroy());
    this.buildingSprites.clear();

    // Render tiles
    for (let y = 0; y < GRID_CONFIG.height; y++) {
      for (let x = 0; x < GRID_CONFIG.width; x++) {
        this.renderTile(x, y);
      }
    }
  }

  /**
   * Renders characters (call every frame)
   */
  renderCharacters(characters: Character[]): void {
    const renderedIds = new Set<string>();

    for (const char of characters) {
      renderedIds.add(char.id);
      this.renderCharacter(char);
    }

    // Remove old sprites
    for (const [id, sprite] of this.characterSprites) {
      if (!renderedIds.has(id)) {
        sprite.destroy();
        this.characterSprites.delete(id);
      }
    }
  }

  /**
   * Renders vehicles (call every frame)
   */
  renderCars(cars: Car[]): void {
    const renderedIds = new Set<string>();

    for (const car of cars) {
      renderedIds.add(car.id);
      this.renderCar(car);
    }

    // Remove old sprites
    for (const [id, sprite] of this.carSprites) {
      if (!renderedIds.has(id)) {
        sprite.destroy();
        this.carSprites.delete(id);
      }
    }
  }

  destroy(): void {
    this.tileSprites.forEach((sprite) => sprite.destroy());
    this.tileSprites.clear();
    this.buildingSprites.forEach((sprite) => sprite.destroy());
    this.buildingSprites.clear();
    this.carSprites.forEach((sprite) => sprite.destroy());
    this.carSprites.clear();
    this.characterSprites.forEach((sprite) => sprite.destroy());
    this.characterSprites.clear();
    this.characterAnimationFrames.clear();
  }

  // ============================================
  // PRIVATE METHODS - TILE RENDERING
  // ============================================

  private renderTile(x: number, y: number): void {
    const cell = this.grid[y]?.[x];
    if (!cell) return;

    const screenPos = gridToScreen(x, y);
    const key = `tile_${x}_${y}`;

    // Determine texture based on tile type
    let textureKey = this.getTileTextureKey(cell, x, y);

    // Check if texture exists, fallback to drawing if not
    if (!this.scene.textures.exists(textureKey)) {
      this.drawTileFallback(x, y, cell);
      return;
    }

    // Create or update tile sprite
    let sprite = this.tileSprites.get(key);
    if (!sprite) {
      sprite = this.scene.add.image(screenPos.x, screenPos.y, textureKey);
      sprite.setOrigin(0.5, 0.5);
      this.tileSprites.set(key, sprite);
    } else {
      sprite.setTexture(textureKey);
      sprite.setPosition(screenPos.x, screenPos.y);
    }

    sprite.setDepth(calculateDepth(x, y, RENDER_CONFIG.layers.tile));

    // Render building if this is the origin
    if (cell.type === TileType.Building && cell.isOrigin && cell.buildingId) {
      this.renderBuilding(x, y, cell);
    }
  }

  private getTileTextureKey(cell: GridCell, x: number, y: number): string {
    switch (cell.type) {
      case TileType.Grass:
        return 'grass';
      case TileType.Road:
        return 'road';
      case TileType.Asphalt:
        return 'asphalt';
      case TileType.Tile:
        return 'tile';
      case TileType.Snow:
        return getSnowTextureKey(x, y);
      // Wasteland terrain types
      case TileType.Wasteland:
        return 'wasteland';
      case TileType.Radiation:
        return 'radiation';
      case TileType.Rubble:
        return 'rubble';
      case TileType.Building:
        // For buildings, render underlying tile or grass
        if (cell.underlyingTileType) {
          if (cell.underlyingTileType === TileType.Snow) {
            return getSnowTextureKey(x, y);
          }
          // Return the underlying type string directly (works for wasteland, rubble, etc.)
          return cell.underlyingTileType;
        }
        return 'grass';
      default:
        return 'grass';
    }
  }

  private drawTileFallback(x: number, y: number, cell: GridCell): void {
    const screenPos = gridToScreen(x, y);
    const graphics = this.scene.add.graphics();

    const points = [
      { x: screenPos.x, y: screenPos.y - GRID_CONFIG.tileHeight / 2 },
      { x: screenPos.x + GRID_CONFIG.tileWidth / 2, y: screenPos.y },
      { x: screenPos.x, y: screenPos.y + GRID_CONFIG.tileHeight / 2 },
      { x: screenPos.x - GRID_CONFIG.tileWidth / 2, y: screenPos.y },
    ];

    const fillColor = this.getTileFallbackColor(cell.type, x, y);

    graphics.fillStyle(fillColor, 1);
    graphics.beginPath();
    graphics.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      graphics.lineTo(points[i].x, points[i].y);
    }
    graphics.closePath();
    graphics.fillPath();

    graphics.setDepth(calculateDepth(x, y, RENDER_CONFIG.layers.tile));
  }

  private getTileFallbackColor(tileType: TileType, x: number, y: number): number {
    switch (tileType) {
      case TileType.Grass:
        return COLOR_PALETTE.tiles.grass + ((x + y) % 3) * 0x050505;
      case TileType.Road:
        return COLOR_PALETTE.tiles.road;
      case TileType.Asphalt:
        return COLOR_PALETTE.tiles.asphalt;
      case TileType.Tile:
        return COLOR_PALETTE.tiles.tile;
      case TileType.Snow:
        return COLOR_PALETTE.tiles.snow;
      case TileType.Building:
        return COLOR_PALETTE.tiles.building;
      // Wasteland fallback colors
      case TileType.Wasteland:
        return COLOR_PALETTE.tiles.wasteland ?? 0x8b7355;
      case TileType.Radiation:
        return COLOR_PALETTE.tiles.radiation ?? 0x4cff00;
      case TileType.Rubble:
        return COLOR_PALETTE.tiles.rubble ?? 0x696969;
      default:
        return COLOR_PALETTE.tiles.grass;
    }
  }

  // ============================================
  // PRIVATE METHODS - BUILDING RENDERING
  // ============================================

  private renderBuilding(x: number, y: number, cell: GridCell): void {
    const building = getBuilding(cell.buildingId || '');
    if (!building) return;

    const orientation = cell.buildingOrientation || Direction.Down;
    const dirMap: Record<Direction, 'south' | 'north' | 'east' | 'west'> = {
      [Direction.Down]: 'south',
      [Direction.Up]: 'north',
      [Direction.Right]: 'east',
      [Direction.Left]: 'west',
    };
    const spriteDir = dirMap[orientation];
    const textureKey = `${building.id}_${spriteDir}`;

    const footprint = getBuildingFootprint(building, orientation);
    const sortX = x + footprint.width - 1;
    const sortY = y + footprint.height - 1;
    const screenPos = gridToScreen(sortX, sortY);

    const key = `building_${x}_${y}`;

    if (this.scene.textures.exists(textureKey)) {
      let sprite = this.buildingSprites.get(key);
      if (!sprite) {
        sprite = this.scene.add.image(screenPos.x, screenPos.y, textureKey);
        sprite.setOrigin(0.5, 1);
        this.buildingSprites.set(key, sprite);
      } else {
        sprite.setTexture(textureKey);
        sprite.setPosition(screenPos.x, screenPos.y);
      }
      sprite.setDepth(calculateDepth(sortX, sortY, RENDER_CONFIG.layers.building));
    } else {
      // Fallback: draw colored box
      this.drawBuildingFallback(x, y, building, footprint);
    }
  }

  /**
   * Calculates dimensions for building fallback rendering
   */
  private calculateBuildingFallbackDimensions(footprint: { width: number; height: number }) {
    const config = RENDER_CONFIG.buildingFallback;
    const bWidth = footprint.width * GRID_CONFIG.tileWidth;
    const bHeight = footprint.height * GRID_CONFIG.tileHeight;
    const buildingHeight = Math.max(footprint.width, footprint.height) * config.heightMultiplier + config.baseHeight;

    return { bWidth, bHeight, buildingHeight };
  }

  /**
   * Calculates base coordinates for building fallback rendering
   */
  private calculateBuildingFallbackCoordinates(
    x: number,
    y: number,
    footprint: { width: number; height: number }
  ) {
    const screenPos = gridToScreen(x, y);
    const { width, height } = footprint;

    const baseX = screenPos.x + (width - height) * (GRID_CONFIG.tileWidth / 4);
    const baseY = screenPos.y + (width + height - 1) * (GRID_CONFIG.tileHeight / 2);

    return { baseX, baseY };
  }

  /**
   * Draws the front face of a fallback building
   */
  private drawBuildingFrontFace(
    graphics: Phaser.GameObjects.Graphics,
    baseX: number,
    baseY: number,
    bWidth: number,
    buildingHeight: number
  ): void {
    graphics.fillStyle(COLOR_PALETTE.building.base, 1);
    graphics.fillRect(
      baseX - bWidth / 4,
      baseY - buildingHeight,
      bWidth / 2,
      buildingHeight
    );
  }

  /**
   * Draws the left face of a fallback building (3D effect)
   */
  private drawBuildingLeftFace(
    graphics: Phaser.GameObjects.Graphics,
    baseX: number,
    baseY: number,
    bWidth: number,
    buildingHeight: number
  ): void {
    const config = RENDER_CONFIG.buildingFallback;

    graphics.fillStyle(COLOR_PALETTE.building.dark, 1);
    graphics.beginPath();
    graphics.moveTo(baseX - bWidth / 4, baseY - buildingHeight);
    graphics.lineTo(
      baseX - bWidth / 4 - config.faceDepthOffset,
      baseY - buildingHeight + config.faceHeightOffset
    );
    graphics.lineTo(
      baseX - bWidth / 4 - config.faceDepthOffset,
      baseY + config.faceHeightOffset
    );
    graphics.lineTo(baseX - bWidth / 4, baseY);
    graphics.closePath();
    graphics.fillPath();
  }

  /**
   * Draws the top face of a fallback building (3D effect)
   */
  private drawBuildingTopFace(
    graphics: Phaser.GameObjects.Graphics,
    baseX: number,
    baseY: number,
    bWidth: number,
    buildingHeight: number
  ): void {
    const config = RENDER_CONFIG.buildingFallback;

    graphics.fillStyle(COLOR_PALETTE.building.light, 1);
    graphics.beginPath();
    graphics.moveTo(baseX - bWidth / 4, baseY - buildingHeight);
    graphics.lineTo(
      baseX - bWidth / 4 - config.faceDepthOffset,
      baseY - buildingHeight + config.faceHeightOffset
    );
    graphics.lineTo(
      baseX + bWidth / 4 - config.faceDepthOffset,
      baseY - buildingHeight + config.faceHeightOffset
    );
    graphics.lineTo(baseX + bWidth / 4, baseY - buildingHeight);
    graphics.closePath();
    graphics.fillPath();
  }

  /**
   * Draws the icon text for a fallback building
   */
  private drawBuildingIcon(
    x: number,
    y: number,
    baseX: number,
    baseY: number,
    buildingHeight: number,
    building: { icon: string },
    footprint: { width: number; height: number }
  ): void {
    const config = RENDER_CONFIG.buildingFallback;
    const iconX = baseX - config.iconOffset;
    const iconY = baseY - buildingHeight / 2 - config.iconOffset;

    this.scene.add
      .text(iconX, iconY, building.icon, {
        fontSize: `${config.iconFontSize}px`,
        fontFamily: config.iconFontFamily,
      })
      .setDepth(
        calculateDepth(
          x + footprint.width - 1,
          y + footprint.height - 1,
          RENDER_CONFIG.layers.buildingIcon
        )
      );
  }

  /**
   * Draws a fallback building representation when texture is not available
   * Uses a simple 3D box with colored faces and an icon
   */
  private drawBuildingFallback(
    x: number,
    y: number,
    building: { id: string; name: string; icon: string; footprint: { width: number; height: number } },
    footprint: { width: number; height: number }
  ): void {
    // Calculate dimensions and coordinates
    const { bWidth, buildingHeight } = this.calculateBuildingFallbackDimensions(footprint);
    const { baseX, baseY } = this.calculateBuildingFallbackCoordinates(x, y, footprint);

    // Create graphics object for drawing
    const graphics = this.scene.add.graphics();

    // Draw the three visible faces (front, left, top)
    this.drawBuildingFrontFace(graphics, baseX, baseY, bWidth, buildingHeight);
    this.drawBuildingLeftFace(graphics, baseX, baseY, bWidth, buildingHeight);
    this.drawBuildingTopFace(graphics, baseX, baseY, bWidth, buildingHeight);

    // Set depth for proper isometric sorting
    graphics.setDepth(
      calculateDepth(
        x + footprint.width - 1,
        y + footprint.height - 1,
        RENDER_CONFIG.layers.building
      )
    );

    // Draw the building icon
    this.drawBuildingIcon(x, y, baseX, baseY, buildingHeight, building, footprint);
  }

  // ============================================
  // PRIVATE METHODS - CHARACTER RENDERING
  // ============================================

  private renderCharacter(char: Character): void {
    const screenPos = gridToScreen(char.x, char.y);
    const delta = this.scene.game.loop.delta;

    const dirStr = directionToString(char.direction);
    const charType = char.characterType === CharacterType.Banana ? 'banana' : 'apple';

    // Get or create animation state
    let animState = this.characterAnimationFrames.get(char.id);
    if (!animState) {
      animState = { frameIndex: 0, elapsed: 0, lastDir: dirStr };
      this.characterAnimationFrames.set(char.id, animState);
    }

    // Reset frame on direction change
    if (animState.lastDir !== dirStr) {
      animState.frameIndex = 0;
      animState.elapsed = 0;
      animState.lastDir = dirStr;
    }

    // Check if we have GIF animation loaded
    const animation = this.characterAnimationManager?.getAnimation(charType, dirStr);

    if (animation && animation.frameKeys.length > 0) {
      // Update animation timing
      animState.elapsed += delta;
      const frameDelay = animation.delays[animState.frameIndex] || 100;

      if (animState.elapsed >= frameDelay) {
        animState.elapsed = 0;
        animState.frameIndex = (animState.frameIndex + 1) % animation.frameKeys.length;
      }

      const frameKey = animation.frameKeys[animState.frameIndex];

      let sprite = this.characterSprites.get(char.id);
      if (!sprite) {
        sprite = this.scene.add.image(
          screenPos.x,
          screenPos.y - RENDER_CONFIG.characterYOffset,
          frameKey
        );
        sprite.setOrigin(0.5, 1);
        sprite.setScale(RENDER_CONFIG.characterScale);
        this.characterSprites.set(char.id, sprite);
      } else {
        if (this.scene.textures.exists(frameKey)) {
          sprite.setTexture(frameKey);
        }
        sprite.setPosition(screenPos.x, screenPos.y - RENDER_CONFIG.characterYOffset);
      }

      sprite.setDepth(calculateDepth(char.x, char.y, RENDER_CONFIG.layers.character));
    } else {
      // Fallback: colored circle
      this.renderCharacterFallback(char, screenPos);
    }
  }

  private renderCharacterFallback(
    char: Character,
    screenPos: { x: number; y: number }
  ): void {
    let sprite = this.characterSprites.get(char.id);
    if (!sprite) {
      const graphics = this.scene.add.graphics();
      const color =
        char.characterType === CharacterType.Banana
          ? COLOR_PALETTE.characters.banana
          : COLOR_PALETTE.characters.apple;
      graphics.fillStyle(color, 1);
      graphics.fillCircle(0, 0, RENDER_CONFIG.characterCircleRadius);
      graphics.setPosition(screenPos.x, screenPos.y - 10);
      graphics.setDepth(calculateDepth(char.x, char.y, RENDER_CONFIG.layers.character));

      const fakeSprite = graphics as unknown as Phaser.GameObjects.Image;
      this.characterSprites.set(char.id, fakeSprite);
    } else {
      sprite.setPosition(screenPos.x, screenPos.y - 10);
      sprite.setDepth(calculateDepth(char.x, char.y, RENDER_CONFIG.layers.character));
    }
  }

  // ============================================
  // PRIVATE METHODS - CAR RENDERING
  // ============================================

  private renderCar(car: Car): void {
    const screenPos = gridToScreen(car.x, car.y);
    const textureKey = `${car.carType}_${directionToShortString(car.direction)}`;

    let sprite = this.carSprites.get(car.id);
    if (!sprite) {
      if (this.scene.textures.exists(textureKey)) {
        sprite = this.scene.add.sprite(screenPos.x, screenPos.y, textureKey);
        sprite.setOrigin(0.5, 0.75);
        this.carSprites.set(car.id, sprite);
      }
    } else {
      if (this.scene.textures.exists(textureKey)) {
        sprite.setTexture(textureKey);
      }
      sprite.setPosition(screenPos.x, screenPos.y);
    }

    if (sprite) {
      sprite.setDepth(calculateDepth(car.x, car.y, RENDER_CONFIG.layers.vehicle));
    }
  }
}
