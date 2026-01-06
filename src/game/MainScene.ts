import Phaser from "phaser";
import {
  GridCell,
  TileType,
  ToolType,
  Direction,
  Character,
  Car,
  CharacterType,
  CarType,
  TILE_WIDTH,
  TILE_HEIGHT,
  GRID_WIDTH,
  GRID_HEIGHT,
  GRID_OFFSET_X,
  GRID_OFFSET_Y,
  CHARACTER_SPEED,
  CAR_SPEED,
} from "./types";
import { getBuilding, getBuildingFootprint, BUILDINGS } from "./buildings";
import {
  ROAD_SEGMENT_SIZE,
  getRoadSegmentOrigin,
  hasRoadSegment,
  getRoadConnections,
  getSegmentType,
  generateRoadPattern,
  getAffectedSegments,
  canPlaceRoadSegment,
  getLaneDirection,
  isAtIntersection,
  RoadConnection,
} from "./roadUtils";

// Event types for React communication
export interface SceneEvents {
  onTileClick: (x: number, y: number) => void;
  onTileHover: (x: number | null, y: number | null) => void;
  onTilesDrag?: (tiles: Array<{ x: number; y: number }>) => void;
  onRoadDrag?: (segments: Array<{ x: number; y: number }>) => void;
}

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 9);

// Direction vectors for movement
const directionVectors: Record<Direction, { dx: number; dy: number }> = {
  [Direction.Up]: { dx: 0, dy: -1 },
  [Direction.Down]: { dx: 0, dy: 1 },
  [Direction.Left]: { dx: -1, dy: 0 },
  [Direction.Right]: { dx: 1, dy: 0 },
};

// Opposite directions
const oppositeDirection: Record<Direction, Direction> = {
  [Direction.Up]: Direction.Down,
  [Direction.Down]: Direction.Up,
  [Direction.Left]: Direction.Right,
  [Direction.Right]: Direction.Left,
};

const allDirections = [Direction.Up, Direction.Down, Direction.Left, Direction.Right];

interface MainSceneData {
  grid: GridCell[][];
  onGridChange: (grid: GridCell[][]) => void;
}

export class MainScene extends Phaser.Scene {
  private readonly DEPTH_Y_MULT = 10000;

  // Sprite containers
  private tileSprites: Map<string, Phaser.GameObjects.Image> = new Map();
  private buildingSprites: Map<string, Phaser.GameObjects.Image> = new Map();
  private carSprites: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private characterSprites: Map<string, Phaser.GameObjects.Sprite> = new Map();

  // Game state
  private grid: GridCell[][] = [];
  private characters: Character[] = [];
  private cars: Car[] = [];
  private onGridChange!: (grid: GridCell[][]) => void;

  // Tool state
  private selectedTool: ToolType = ToolType.None;
  private selectedBuildingId: string | null = null;
  private buildingOrientation: Direction = Direction.Down;
  private hoverTile: { x: number; y: number } | null = null;

  // Event callbacks
  private events_: SceneEvents = {
    onTileClick: () => {},
    onTileHover: () => {},
  };

  // Scene state
  private isReady: boolean = false;

  // Drag state
  private isDragging: boolean = false;
  private dragTiles: Set<string> = new Set();
  private dragStartTile: { x: number; y: number } | null = null;
  private dragDirection: "horizontal" | "vertical" | null = null;

  // Camera panning state
  private isPanning: boolean = false;
  private panStartX: number = 0;
  private panStartY: number = 0;
  private cameraStartX: number = 0;
  private cameraStartY: number = 0;
  private baseScrollX: number = 0;
  private baseScrollY: number = 0;

  // Screen shake
  private shakeOffset: number = 0;
  private shakeDuration: number = 0;
  private shakeIntensity: number = 0;
  private shakeElapsed: number = 0;

  // Preview
  private previewGraphics: Phaser.GameObjects.Graphics | null = null;

  // Keyboard controls
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly CAMERA_SPEED = 8;

  constructor() {
    super({ key: "MainScene" });
  }

  init(data: MainSceneData) {
    this.grid = data.grid;
    this.onGridChange = data.onGridChange;
  }

  preload(): void {
    // Load tile textures
    this.load.image("grass", "/Tiles/1x1grass.png");
    this.load.image("road", "/Tiles/1x1square_tile.png");
    this.load.image("asphalt", "/Tiles/1x1asphalt_tile.png");
    this.load.image("snow_1", "/Tiles/1x1snow_tile_1.png");
    this.load.image("snow_2", "/Tiles/1x1snow_tile_2.png");
    this.load.image("snow_3", "/Tiles/1x1snow_tile_3.png");
    this.load.image("tile", "/Tiles/1x1square_tile.png");

    // Load building textures dynamically from registry
    for (const building of Object.values(BUILDINGS)) {
      for (const [dir, path] of Object.entries(building.sprites)) {
        const key = `${building.id}_${dir}`;
        this.load.image(key, path);
      }
    }

    // Load car textures
    const carTypes = ["jeep", "taxi"];
    const directions = ["n", "s", "e", "w"];
    for (const car of carTypes) {
      for (const dir of directions) {
        this.load.image(`${car}_${dir}`, `/cars/${car}${dir}.png`);
      }
    }
  }

  create(): void {
    // Set up keyboard controls
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
    }

    // Initialize grid
    this.initializeGrid();

    // Create preview graphics
    this.previewGraphics = this.add.graphics();
    this.previewGraphics.setDepth(999999);

    // Mark scene as ready
    this.isReady = true;

    // Enable input
    this.input.on("pointermove", this.handlePointerMove, this);
    this.input.on("pointerdown", this.handlePointerDown, this);
    this.input.on("pointerup", this.handlePointerUp, this);
    this.input.on("wheel", this.handleWheel, this);

    // Initial render
    this.renderGrid();

    // Center camera
    const centerScreen = this.gridToScreen(GRID_WIDTH / 2, GRID_HEIGHT / 2);
    this.baseScrollX = centerScreen.x - this.cameras.main.width / 2;
    this.baseScrollY = centerScreen.y - this.cameras.main.height / 2;
    this.cameras.main.setScroll(this.baseScrollX, this.baseScrollY);
  }

  private initializeGrid(): void {
    if (!this.grid || this.grid.length === 0) {
      this.grid = Array.from({ length: GRID_HEIGHT }, (_, y) =>
        Array.from({ length: GRID_WIDTH }, (_, x) => ({
          type: TileType.Grass,
          x,
          y,
          isOrigin: true,
        }))
      );
    }
  }

  update(_time: number, delta: number): void {
    if (!this.isReady) return;

    // Update entities
    this.updateCharacters();
    this.updateCars();

    // Handle camera movement
    this.updateCamera(delta);

    // Render entities
    this.renderCars();
    this.renderCharacters();
  }

  private updateCamera(delta: number): void {
    if (!this.cursors) return;

    const camera = this.cameras.main;

    // Update screen shake
    if (this.shakeElapsed < this.shakeDuration) {
      this.shakeElapsed += delta;
      const t = Math.min(this.shakeElapsed / this.shakeDuration, 1);
      const envelope = (1 - t) * (1 - t);
      this.shakeOffset = Math.sin(t * 3 * Math.PI * 2) * this.shakeIntensity * envelope;
    } else {
      this.shakeOffset = 0;
    }

    // Manual camera movement
    const speed = this.CAMERA_SPEED / camera.zoom;
    if (this.cursors.left.isDown) {
      this.baseScrollX -= speed;
    }
    if (this.cursors.right.isDown) {
      this.baseScrollX += speed;
    }
    if (this.cursors.up.isDown) {
      this.baseScrollY -= speed;
    }
    if (this.cursors.down.isDown) {
      this.baseScrollY += speed;
    }

    camera.setScroll(
      Math.round(this.baseScrollX),
      Math.round(this.baseScrollY + this.shakeOffset)
    );
  }

  shakeScreen(intensity: number = 2, duration: number = 150): void {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeElapsed = 0;
  }

  // ============================================
  // CHARACTER LOGIC
  // ============================================

  private updateCharacters(): void {
    for (let i = 0; i < this.characters.length; i++) {
      this.characters[i] = this.updateSingleCharacter(this.characters[i]);
    }
  }

  private isWalkable(x: number, y: number): boolean {
    const gx = Math.floor(x);
    const gy = Math.floor(y);
    if (gx < 0 || gx >= GRID_WIDTH || gy < 0 || gy >= GRID_HEIGHT) return false;
    const tileType = this.grid[gy][gx].type;
    return tileType === TileType.Road || tileType === TileType.Tile;
  }

  private getValidDirections(tileX: number, tileY: number): Direction[] {
    const valid: Direction[] = [];
    for (const dir of allDirections) {
      const vec = directionVectors[dir];
      if (this.isWalkable(tileX + vec.dx, tileY + vec.dy)) {
        valid.push(dir);
      }
    }
    return valid;
  }

  private pickNewDirection(tileX: number, tileY: number, currentDir: Direction): Direction | null {
    const validDirs = this.getValidDirections(tileX, tileY);
    if (validDirs.length === 0) return null;

    const opposite = oppositeDirection[currentDir];
    const preferredDirs = validDirs.filter((d) => d !== opposite);

    if (preferredDirs.includes(currentDir) && Math.random() < 0.6) {
      return currentDir;
    }

    const choices = preferredDirs.length > 0 ? preferredDirs : validDirs;
    return choices[Math.floor(Math.random() * choices.length)];
  }

  private updateSingleCharacter(char: Character): Character {
    const { x, y, direction, speed } = char;
    const vec = directionVectors[direction];
    const tileX = Math.floor(x);
    const tileY = Math.floor(y);

    if (!this.isWalkable(tileX, tileY)) {
      const walkableTiles: { x: number; y: number }[] = [];
      for (let gy = 0; gy < GRID_HEIGHT; gy++) {
        for (let gx = 0; gx < GRID_WIDTH; gx++) {
          const tileType = this.grid[gy][gx].type;
          if (tileType === TileType.Road || tileType === TileType.Tile) {
            walkableTiles.push({ x: gx, y: gy });
          }
        }
      }
      if (walkableTiles.length > 0) {
        const newTile = walkableTiles[Math.floor(Math.random() * walkableTiles.length)];
        return {
          ...char,
          x: newTile.x + 0.5,
          y: newTile.y + 0.5,
          direction: allDirections[Math.floor(Math.random() * allDirections.length)],
        };
      }
      return char;
    }

    const inTileX = x - tileX;
    const inTileY = y - tileY;
    const threshold = speed * 3;
    const nearCenter = Math.abs(inTileX - 0.5) < threshold && Math.abs(inTileY - 0.5) < threshold;

    let newDirection = direction;
    let nextX = x;
    let nextY = y;

    if (nearCenter) {
      const nextTileX = tileX + vec.dx;
      const nextTileY = tileY + vec.dy;

      if (!this.isWalkable(nextTileX, nextTileY)) {
        const newDir = this.pickNewDirection(tileX, tileY, direction);
        if (newDir) {
          newDirection = newDir;
        }
        nextX = tileX + 0.5;
        nextY = tileY + 0.5;
      }
    }

    const moveVec = directionVectors[newDirection];
    nextX += moveVec.dx * speed;
    nextY += moveVec.dy * speed;

    return { ...char, x: nextX, y: nextY, direction: newDirection };
  }

  // ============================================
  // CAR LOGIC
  // ============================================

  private updateCars(): void {
    for (let i = 0; i < this.cars.length; i++) {
      this.cars[i] = this.updateSingleCar(this.cars[i]);
    }
  }

  private isDrivable(x: number, y: number): boolean {
    const gx = Math.floor(x);
    const gy = Math.floor(y);
    if (gx < 0 || gx >= GRID_WIDTH || gy < 0 || gy >= GRID_HEIGHT) return false;
    return this.grid[gy][gx].type === TileType.Asphalt;
  }

  private getValidCarDirections(tileX: number, tileY: number): Direction[] {
    const valid: Direction[] = [];
    for (const dir of allDirections) {
      const vec = directionVectors[dir];
      if (this.isDrivable(tileX + vec.dx, tileY + vec.dy)) {
        valid.push(dir);
      }
    }
    return valid;
  }

  private updateSingleCar(car: Car): Car {
    const { x, y, direction, speed } = car;
    const vec = directionVectors[direction];
    const tileX = Math.floor(x);
    const tileY = Math.floor(y);

    if (!this.isDrivable(tileX, tileY)) {
      const asphaltTiles: { x: number; y: number }[] = [];
      for (let gy = 0; gy < GRID_HEIGHT; gy++) {
        for (let gx = 0; gx < GRID_WIDTH; gx++) {
          if (this.grid[gy][gx].type === TileType.Asphalt) {
            asphaltTiles.push({ x: gx, y: gy });
          }
        }
      }
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
      return car;
    }

    let newDirection = direction;
    let nextX = x;
    let nextY = y;

    const inTileX = x - tileX;
    const inTileY = y - tileY;
    const threshold = speed * 2;
    const nearCenter = Math.abs(inTileX - 0.5) < threshold && Math.abs(inTileY - 0.5) < threshold;

    if (nearCenter) {
      const laneDir = getLaneDirection(tileX, tileY, this.grid);
      const nextTileX = tileX + vec.dx;
      const nextTileY = tileY + vec.dy;

      if (!this.isDrivable(nextTileX, nextTileY)) {
        const validDirs = this.getValidCarDirections(tileX, tileY);
        if (validDirs.length > 0) {
          newDirection = validDirs[Math.floor(Math.random() * validDirs.length)];
        }
        nextX = tileX + 0.5;
        nextY = tileY + 0.5;
      } else if (laneDir && laneDir !== direction) {
        newDirection = laneDir;
      }
    }

    const moveVec = directionVectors[newDirection];
    nextX += moveVec.dx * speed;
    nextY += moveVec.dy * speed;

    return { ...car, x: nextX, y: nextY, direction: newDirection, waiting: 0 };
  }

  // ============================================
  // RENDERING
  // ============================================

  gridToScreen(gridX: number, gridY: number): { x: number; y: number } {
    return {
      x: GRID_OFFSET_X + (gridX - gridY) * (TILE_WIDTH / 2),
      y: GRID_OFFSET_Y + (gridX + gridY) * (TILE_HEIGHT / 2),
    };
  }

  screenToGrid(screenX: number, screenY: number): { x: number; y: number } {
    const relX = screenX - GRID_OFFSET_X;
    const relY = screenY - GRID_OFFSET_Y;

    return {
      x: (relX / (TILE_WIDTH / 2) + relY / (TILE_HEIGHT / 2)) / 2,
      y: (relY / (TILE_HEIGHT / 2) - relX / (TILE_WIDTH / 2)) / 2,
    };
  }

  private depthFromSortPoint(sortX: number, sortY: number, layerOffset: number = 0): number {
    return sortY * this.DEPTH_Y_MULT + sortX + layerOffset;
  }

  private getSnowTextureKey(x: number, y: number): string {
    const variant = ((x * 7 + y * 13) % 3) + 1;
    return `snow_${variant}`;
  }

  renderGrid(): void {
    // Clear existing sprites
    this.tileSprites.forEach((sprite) => sprite.destroy());
    this.tileSprites.clear();
    this.buildingSprites.forEach((sprite) => sprite.destroy());
    this.buildingSprites.clear();

    // Render tiles
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        this.renderTile(x, y);
      }
    }
  }

  private renderTile(x: number, y: number): void {
    const cell = this.grid[y]?.[x];
    if (!cell) return;

    const screenPos = this.gridToScreen(x, y);
    const key = `tile_${x}_${y}`;

    // Determine texture based on tile type
    let textureKey = "grass";
    switch (cell.type) {
      case TileType.Grass:
        textureKey = "grass";
        break;
      case TileType.Road:
        textureKey = "road";
        break;
      case TileType.Asphalt:
        textureKey = "asphalt";
        break;
      case TileType.Tile:
        textureKey = "tile";
        break;
      case TileType.Snow:
        textureKey = this.getSnowTextureKey(x, y);
        break;
      case TileType.Building:
        // For buildings, render underlying tile or grass
        if (cell.underlyingTileType) {
          textureKey = cell.underlyingTileType === TileType.Snow ? this.getSnowTextureKey(x, y) : cell.underlyingTileType;
        } else {
          textureKey = "grass";
        }
        break;
    }

    // Check if texture exists, fallback to drawing if not
    if (!this.textures.exists(textureKey)) {
      this.drawTileFallback(x, y, cell);
      return;
    }

    // Create or update tile sprite
    let sprite = this.tileSprites.get(key);
    if (!sprite) {
      sprite = this.add.image(screenPos.x, screenPos.y, textureKey);
      sprite.setOrigin(0.5, 0.5);
      this.tileSprites.set(key, sprite);
    } else {
      sprite.setTexture(textureKey);
      sprite.setPosition(screenPos.x, screenPos.y);
    }

    sprite.setDepth(this.depthFromSortPoint(x, y, 0));

    // Render building if this is the origin
    if (cell.type === TileType.Building && cell.isOrigin && cell.buildingId) {
      this.renderBuilding(x, y, cell);
    }
  }

  private drawTileFallback(x: number, y: number, cell: GridCell): void {
    const screenPos = this.gridToScreen(x, y);
    const graphics = this.add.graphics();

    const points = [
      { x: screenPos.x, y: screenPos.y - TILE_HEIGHT / 2 },
      { x: screenPos.x + TILE_WIDTH / 2, y: screenPos.y },
      { x: screenPos.x, y: screenPos.y + TILE_HEIGHT / 2 },
      { x: screenPos.x - TILE_WIDTH / 2, y: screenPos.y },
    ];

    let fillColor = 0x4caf50;
    switch (cell.type) {
      case TileType.Grass:
        fillColor = 0x4caf50 + ((x + y) % 3) * 0x050505;
        break;
      case TileType.Road:
        fillColor = 0x9e9e9e;
        break;
      case TileType.Asphalt:
        fillColor = 0x424242;
        break;
      case TileType.Tile:
        fillColor = 0xbdbdbd;
        break;
      case TileType.Snow:
        fillColor = 0xeceff1;
        break;
      case TileType.Building:
        fillColor = 0x757575;
        break;
    }

    graphics.fillStyle(fillColor, 1);
    graphics.beginPath();
    graphics.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      graphics.lineTo(points[i].x, points[i].y);
    }
    graphics.closePath();
    graphics.fillPath();

    graphics.setDepth(this.depthFromSortPoint(x, y, 0));
  }

  private renderBuilding(x: number, y: number, cell: GridCell): void {
    const building = getBuilding(cell.buildingId || "");
    if (!building) return;

    const orientation = cell.buildingOrientation || Direction.Down;
    const dirMap: Record<Direction, "south" | "north" | "east" | "west"> = {
      [Direction.Down]: "south",
      [Direction.Up]: "north",
      [Direction.Right]: "east",
      [Direction.Left]: "west",
    };
    const spriteDir = dirMap[orientation];
    const spritePath = building.sprites[spriteDir] || building.sprites.south;
    const textureKey = `${building.id}_${spriteDir}`;

    const footprint = getBuildingFootprint(building, orientation);
    const sortX = x + footprint.width - 1;
    const sortY = y + footprint.height - 1;
    const screenPos = this.gridToScreen(sortX, sortY);

    const key = `building_${x}_${y}`;

    if (this.textures.exists(textureKey)) {
      let sprite = this.buildingSprites.get(key);
      if (!sprite) {
        sprite = this.add.image(screenPos.x, screenPos.y, textureKey);
        sprite.setOrigin(0.5, 1);
        this.buildingSprites.set(key, sprite);
      } else {
        sprite.setTexture(textureKey);
        sprite.setPosition(screenPos.x, screenPos.y);
      }
      sprite.setDepth(this.depthFromSortPoint(sortX, sortY, 0.05));
    } else {
      // Fallback: draw colored box
      this.drawBuildingFallback(x, y, building, footprint);
    }
  }

  private drawBuildingFallback(
    x: number,
    y: number,
    building: { id: string; name: string; icon: string; footprint: { width: number; height: number } },
    footprint: { width: number; height: number }
  ): void {
    const screenPos = this.gridToScreen(x, y);
    const { width, height } = footprint;

    const bWidth = width * TILE_WIDTH;
    const bHeight = height * TILE_HEIGHT;
    const buildingHeight = Math.max(width, height) * 15 + 10;

    const baseX = screenPos.x + (width - height) * (TILE_WIDTH / 4);
    const baseY = screenPos.y + (width + height - 1) * (TILE_HEIGHT / 2);

    const graphics = this.add.graphics();
    const color = 0x78909c;
    const darkColor = 0x546e7a;
    const lightColor = 0x90a4ae;

    // Front face
    graphics.fillStyle(color, 1);
    graphics.fillRect(baseX - bWidth / 4, baseY - buildingHeight, bWidth / 2, buildingHeight);

    // Left face
    graphics.fillStyle(darkColor, 1);
    graphics.beginPath();
    graphics.moveTo(baseX - bWidth / 4, baseY - buildingHeight);
    graphics.lineTo(baseX - bWidth / 4 - 10, baseY - buildingHeight + 5);
    graphics.lineTo(baseX - bWidth / 4 - 10, baseY + 5);
    graphics.lineTo(baseX - bWidth / 4, baseY);
    graphics.closePath();
    graphics.fillPath();

    // Top face
    graphics.fillStyle(lightColor, 1);
    graphics.beginPath();
    graphics.moveTo(baseX - bWidth / 4, baseY - buildingHeight);
    graphics.lineTo(baseX - bWidth / 4 - 10, baseY - buildingHeight + 5);
    graphics.lineTo(baseX + bWidth / 4 - 10, baseY - buildingHeight + 5);
    graphics.lineTo(baseX + bWidth / 4, baseY - buildingHeight);
    graphics.closePath();
    graphics.fillPath();

    graphics.setDepth(this.depthFromSortPoint(x + width - 1, y + height - 1, 0.05));

    // Icon
    this.add.text(baseX - 12, baseY - buildingHeight / 2 - 12, building.icon, {
      fontSize: "24px",
      fontFamily: "Arial",
    }).setDepth(this.depthFromSortPoint(x + width - 1, y + height - 1, 0.06));
  }

  private renderCars(): void {
    const renderedIds = new Set<string>();

    for (const car of this.cars) {
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

  private renderCar(car: Car): void {
    const screenPos = this.gridToScreen(car.x, car.y);
    const dirMap: Record<Direction, string> = {
      [Direction.Up]: "n",
      [Direction.Down]: "s",
      [Direction.Left]: "w",
      [Direction.Right]: "e",
    };
    const textureKey = `${car.carType}_${dirMap[car.direction]}`;

    let sprite = this.carSprites.get(car.id);
    if (!sprite) {
      if (this.textures.exists(textureKey)) {
        sprite = this.add.sprite(screenPos.x, screenPos.y, textureKey);
        sprite.setOrigin(0.5, 0.75);
        this.carSprites.set(car.id, sprite);
      }
    } else {
      if (this.textures.exists(textureKey)) {
        sprite.setTexture(textureKey);
      }
      sprite.setPosition(screenPos.x, screenPos.y);
    }

    if (sprite) {
      sprite.setDepth(this.depthFromSortPoint(car.x, car.y, 0.1));
    }
  }

  private renderCharacters(): void {
    const renderedIds = new Set<string>();

    for (const char of this.characters) {
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

  private renderCharacter(char: Character): void {
    const screenPos = this.gridToScreen(char.x, char.y);

    let sprite = this.characterSprites.get(char.id);
    if (!sprite) {
      // Create simple colored circle as fallback
      const graphics = this.add.graphics();
      const color = char.characterType === CharacterType.Banana ? 0xffeb3b : 0xef5350;
      graphics.fillStyle(color, 1);
      graphics.fillCircle(0, 0, 8);
      graphics.setPosition(screenPos.x, screenPos.y - 10);
      graphics.setDepth(this.depthFromSortPoint(char.x, char.y, 0.2));
      
      // Store as any since we're using graphics
      const fakeSprite = graphics as unknown as Phaser.GameObjects.Sprite;
      this.characterSprites.set(char.id, fakeSprite);
    } else {
      sprite.setPosition(screenPos.x, screenPos.y - 10);
      sprite.setDepth(this.depthFromSortPoint(char.x, char.y, 0.2));
    }
  }

  // ============================================
  // INPUT HANDLING
  // ============================================

  handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this.isReady) return;

    // Handle camera panning
    if (this.isPanning && pointer.leftButtonDown()) {
      const camera = this.cameras.main;
      const dx = (this.panStartX - pointer.x) / camera.zoom;
      const dy = (this.panStartY - pointer.y) / camera.zoom;
      this.baseScrollX = this.cameraStartX + dx;
      this.baseScrollY = this.cameraStartY + dy;
      camera.setScroll(this.baseScrollX, this.baseScrollY);
      return;
    }

    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const gridPos = this.screenToGrid(worldPoint.x, worldPoint.y);
    const tileX = Math.floor(gridPos.x);
    const tileY = Math.floor(gridPos.y);

    if (tileX >= 0 && tileX < GRID_WIDTH && tileY >= 0 && tileY < GRID_HEIGHT) {
      if (!this.hoverTile || this.hoverTile.x !== tileX || this.hoverTile.y !== tileY) {
        this.hoverTile = { x: tileX, y: tileY };
        this.events_.onTileHover(tileX, tileY);

        // Handle drag for painting tools
        if (this.isDragging && this.shouldPaintOnDrag()) {
          this.dragTiles.add(`${tileX},${tileY}`);
        }

        this.updatePreview();
      }
    } else {
      if (this.hoverTile) {
        this.hoverTile = null;
        this.events_.onTileHover(null, null);
        this.clearPreview();
      }
    }
  }

  private shouldPaintOnDrag(): boolean {
    return [ToolType.Snow, ToolType.Tile, ToolType.Asphalt, ToolType.Eraser].includes(this.selectedTool);
  }

  handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (!this.isReady) return;

    if (pointer.rightButtonDown || pointer.middleButtonDown) {
      this.isPanning = true;
      this.panStartX = pointer.x;
      this.panStartY = pointer.y;
      this.cameraStartX = this.baseScrollX;
      this.cameraStartY = this.baseScrollY;
      return;
    }

    if (pointer.leftButtonDown) {
      if (this.selectedTool === ToolType.None) {
        // Start panning with left button if no tool selected
        this.isPanning = true;
        this.panStartX = pointer.x;
        this.panStartY = pointer.y;
        this.cameraStartX = this.baseScrollX;
        this.cameraStartY = this.baseScrollY;
        return;
      }

      if (this.hoverTile) {
        if (this.shouldPaintOnDrag() || this.selectedTool === ToolType.RoadNetwork) {
          this.isDragging = true;
          this.dragTiles.clear();
          this.dragStartTile = { x: this.hoverTile.x, y: this.hoverTile.y };
          this.dragDirection = null;

          if (this.selectedTool === ToolType.RoadNetwork) {
            const segmentOrigin = getRoadSegmentOrigin(this.hoverTile.x, this.hoverTile.y);
            this.dragTiles.add(`${segmentOrigin.x},${segmentOrigin.y}`);
          } else {
            this.dragTiles.add(`${this.hoverTile.x},${this.hoverTile.y}`);
          }
          this.updatePreview();
        } else {
          // Single click placement
          this.events_.onTileClick(this.hoverTile.x, this.hoverTile.y);
        }
      }
    }
  }

  handlePointerUp(_pointer: Phaser.Input.Pointer): void {
    if (!this.isReady) return;

    this.isPanning = false;

    if (this.isDragging && this.dragTiles.size > 0) {
      // Commit drag operation
      const tiles = Array.from(this.dragTiles).map((key) => {
        const [x, y] = key.split(",").map(Number);
        return { x, y };
      });

      if (this.selectedTool === ToolType.RoadNetwork) {
        this.events_.onRoadDrag?.(tiles);
      } else {
        this.events_.onTilesDrag?.(tiles);
      }
    }

    this.isDragging = false;
    this.dragTiles.clear();
    this.dragStartTile = null;
    this.dragDirection = null;
    this.clearPreview();
  }

  handleWheel(
    pointer: Phaser.Input.Pointer,
    _gameObjects: Phaser.GameObjects.GameObject[],
    _deltaX: number,
    deltaY: number
  ): void {
    const oldZoom = this.cameras.main.zoom;
    const newZoom = Phaser.Math.Clamp(oldZoom - deltaY * 0.001, 0.25, 4);
    this.cameras.main.setZoom(newZoom);
  }

  private updatePreview(): void {
    if (!this.previewGraphics || !this.hoverTile) return;

    this.previewGraphics.clear();

    const alpha = 0.4;
    let color = 0xffffff;

    switch (this.selectedTool) {
      case ToolType.RoadNetwork:
        color = 0xffc107;
        break;
      case ToolType.Asphalt:
        color = 0x424242;
        break;
      case ToolType.Tile:
        color = 0xbdbdbd;
        break;
      case ToolType.Snow:
        color = 0xeceff1;
        break;
      case ToolType.Building:
        color = 0x4caf50;
        break;
      case ToolType.Eraser:
        color = 0xff5252;
        break;
    }

    if (this.selectedTool === ToolType.Building && this.selectedBuildingId) {
      const building = getBuilding(this.selectedBuildingId);
      if (building) {
        const footprint = getBuildingFootprint(building, this.buildingOrientation);
        for (let dy = 0; dy < footprint.height; dy++) {
          for (let dx = 0; dx < footprint.width; dx++) {
            this.drawPreviewTile(this.hoverTile.x + dx, this.hoverTile.y + dy, color, alpha);
          }
        }
        return;
      }
    }

    // Draw single tile preview
    this.drawPreviewTile(this.hoverTile.x, this.hoverTile.y, color, alpha);
  }

  private drawPreviewTile(x: number, y: number, color: number, alpha: number): void {
    if (!this.previewGraphics) return;

    const screenPos = this.gridToScreen(x, y);
    const points = [
      { x: screenPos.x, y: screenPos.y - TILE_HEIGHT / 2 },
      { x: screenPos.x + TILE_WIDTH / 2, y: screenPos.y },
      { x: screenPos.x, y: screenPos.y + TILE_HEIGHT / 2 },
      { x: screenPos.x - TILE_WIDTH / 2, y: screenPos.y },
    ];

    this.previewGraphics.fillStyle(color, alpha);
    this.previewGraphics.beginPath();
    this.previewGraphics.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      this.previewGraphics.lineTo(points[i].x, points[i].y);
    }
    this.previewGraphics.closePath();
    this.previewGraphics.fillPath();
  }

  private clearPreview(): void {
    this.previewGraphics?.clear();
  }

  // ============================================
  // PUBLIC METHODS (called from React)
  // ============================================

  setTool(tool: ToolType): void {
    this.selectedTool = tool;
  }

  setBuilding(buildingId: string | null): void {
    this.selectedBuildingId = buildingId;
    if (buildingId) {
      this.selectedTool = ToolType.Building;
    }
  }

  setDirection(direction: Direction): void {
    this.buildingOrientation = direction;
  }

  setZoom(zoom: number): void {
    this.cameras.main.setZoom(zoom);
  }

  getZoom(): number {
    return this.cameras.main.zoom;
  }

  updateGrid(newGrid: GridCell[][]): void {
    this.grid = newGrid;
    this.renderGrid();
  }

  setEvents(events: Partial<SceneEvents>): void {
    this.events_ = { ...this.events_, ...events };
  }

  spawnCharacter(): void {
    const walkableTiles: { x: number; y: number }[] = [];
    for (let gy = 0; gy < GRID_HEIGHT; gy++) {
      for (let gx = 0; gx < GRID_WIDTH; gx++) {
        const tileType = this.grid[gy][gx].type;
        if (tileType === TileType.Road || tileType === TileType.Tile) {
          walkableTiles.push({ x: gx, y: gy });
        }
      }
    }

    if (walkableTiles.length === 0) return;

    const tile = walkableTiles[Math.floor(Math.random() * walkableTiles.length)];
    const character: Character = {
      id: generateId(),
      x: tile.x + 0.5,
      y: tile.y + 0.5,
      direction: allDirections[Math.floor(Math.random() * allDirections.length)],
      speed: CHARACTER_SPEED,
      characterType: Math.random() > 0.5 ? CharacterType.Banana : CharacterType.Apple,
    };

    this.characters.push(character);
  }

  spawnCar(): void {
    const asphaltTiles: { x: number; y: number }[] = [];
    for (let gy = 0; gy < GRID_HEIGHT; gy++) {
      for (let gx = 0; gx < GRID_WIDTH; gx++) {
        if (this.grid[gy][gx].type === TileType.Asphalt) {
          asphaltTiles.push({ x: gx, y: gy });
        }
      }
    }

    if (asphaltTiles.length === 0) return;

    const tile = asphaltTiles[Math.floor(Math.random() * asphaltTiles.length)];
    const laneDir = getLaneDirection(tile.x, tile.y, this.grid);
    const car: Car = {
      id: generateId(),
      x: tile.x + 0.5,
      y: tile.y + 0.5,
      direction: laneDir || Direction.Right,
      speed: CAR_SPEED,
      waiting: 0,
      carType: Math.random() > 0.5 ? CarType.Jeep : CarType.Taxi,
    };

    this.cars.push(car);
  }

  getCharacterCount(): number {
    return this.characters.length;
  }

  getCarCount(): number {
    return this.cars.length;
  }
}
