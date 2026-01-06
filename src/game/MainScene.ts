import Phaser from "phaser";
import {
  GridCell,
  TileType,
  ToolType,
  Direction,
  TILE_WIDTH,
  TILE_HEIGHT,
  GRID_SIZE,
  gridToScreen,
  screenToGrid,
} from "./types";
import { getBuildingById } from "./buildings";
import { getRoadConnections, RoadConnection } from "./roadUtils";

interface MainSceneData {
  grid: GridCell[][];
  onGridChange: (grid: GridCell[][]) => void;
}

export class MainScene extends Phaser.Scene {
  private grid: GridCell[][] = [];
  private onGridChange!: (grid: GridCell[][]) => void;
  private currentTool: ToolType = ToolType.None;
  private currentBuildingId: string | null = null;
  private currentDirection: Direction = Direction.Down;
  private graphics!: Phaser.GameObjects.Graphics;
  private hoverGraphics!: Phaser.GameObjects.Graphics;
  private hoverX = -1;
  private hoverY = -1;
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private cameraStartX = 0;
  private cameraStartY = 0;
  private isDrawing = false;

  constructor() {
    super({ key: "MainScene" });
  }

  init(data: MainSceneData) {
    this.grid = data.grid;
    this.onGridChange = data.onGridChange;
  }

  create() {
    this.graphics = this.add.graphics();
    this.hoverGraphics = this.add.graphics();

    // Center camera on grid
    const centerScreen = gridToScreen(GRID_SIZE / 2, GRID_SIZE / 2);
    this.cameras.main.centerOn(centerScreen.x, centerScreen.y);
    this.cameras.main.setZoom(1);

    // Input handling
    this.input.on("pointermove", this.handlePointerMove, this);
    this.input.on("pointerdown", this.handlePointerDown, this);
    this.input.on("pointerup", this.handlePointerUp, this);
    this.input.on("wheel", this.handleWheel, this);

    this.drawGrid();
  }

  handlePointerMove(pointer: Phaser.Input.Pointer) {
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const gridPos = screenToGrid(worldPoint.x, worldPoint.y);

    this.hoverX = gridPos.x;
    this.hoverY = gridPos.y;

    // Pan camera while dragging with right mouse or middle mouse
    if (this.isDragging) {
      const dx = pointer.x - this.dragStartX;
      const dy = pointer.y - this.dragStartY;
      this.cameras.main.scrollX = this.cameraStartX - dx / this.cameras.main.zoom;
      this.cameras.main.scrollY = this.cameraStartY - dy / this.cameras.main.zoom;
    }

    // Draw while holding left mouse
    if (this.isDrawing && pointer.leftButtonDown()) {
      this.handleTilePlacement();
    }

    this.drawHoverPreview();
  }

  handlePointerDown(pointer: Phaser.Input.Pointer) {
    if (pointer.rightButtonDown || pointer.middleButtonDown) {
      this.isDragging = true;
      this.dragStartX = pointer.x;
      this.dragStartY = pointer.y;
      this.cameraStartX = this.cameras.main.scrollX;
      this.cameraStartY = this.cameras.main.scrollY;
    } else if (pointer.leftButtonDown) {
      this.isDrawing = true;
      this.handleTilePlacement();
    }
  }

  handlePointerUp(pointer: Phaser.Input.Pointer) {
    if (!pointer.rightButtonDown && !pointer.middleButtonDown) {
      this.isDragging = false;
    }
    if (!pointer.leftButtonDown) {
      this.isDrawing = false;
    }
  }

  handleWheel(
    pointer: Phaser.Input.Pointer,
    _gameObjects: Phaser.GameObjects.GameObject[],
    _deltaX: number,
    deltaY: number
  ) {
    const oldZoom = this.cameras.main.zoom;
    const newZoom = Phaser.Math.Clamp(oldZoom - deltaY * 0.001, 0.25, 3);
    this.cameras.main.setZoom(newZoom);
  }

  handleTilePlacement() {
    const x = this.hoverX;
    const y = this.hoverY;

    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return;

    switch (this.currentTool) {
      case ToolType.Road:
        this.placeRoad(x, y);
        break;
      case ToolType.Building:
        if (this.currentBuildingId) {
          this.placeBuilding(x, y, this.currentBuildingId);
        }
        break;
      case ToolType.Eraser:
        this.eraseTile(x, y);
        break;
    }
  }

  placeRoad(x: number, y: number) {
    if (this.grid[y][x].type !== TileType.Grass) return;

    this.grid[y][x] = {
      ...this.grid[y][x],
      type: TileType.Road,
    };

    this.onGridChange(this.grid);
    this.drawGrid();
  }

  placeBuilding(x: number, y: number, buildingId: string) {
    const building = getBuildingById(buildingId);
    if (!building) return;

    const { width, height } = building.footprint;

    // Check if all tiles are available
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        const gx = x + dx;
        const gy = y + dy;
        if (gx >= GRID_SIZE || gy >= GRID_SIZE) return;
        if (this.grid[gy][gx].type !== TileType.Grass) return;
      }
    }

    // Place building
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        const gx = x + dx;
        const gy = y + dy;
        this.grid[gy][gx] = {
          type: TileType.Building,
          x: gx,
          y: gy,
          isOrigin: dx === 0 && dy === 0,
          originX: x,
          originY: y,
          buildingId,
          buildingOrientation: this.currentDirection,
        };
      }
    }

    this.onGridChange(this.grid);
    this.drawGrid();
  }

  eraseTile(x: number, y: number) {
    const cell = this.grid[y][x];

    if (cell.type === TileType.Building) {
      // Erase entire building
      const originX = cell.originX ?? x;
      const originY = cell.originY ?? y;
      const building = getBuildingById(cell.buildingId || "");

      if (building) {
        for (let dy = 0; dy < building.footprint.height; dy++) {
          for (let dx = 0; dx < building.footprint.width; dx++) {
            const gx = originX + dx;
            const gy = originY + dy;
            if (gx < GRID_SIZE && gy < GRID_SIZE) {
              this.grid[gy][gx] = {
                type: TileType.Grass,
                x: gx,
                y: gy,
              };
            }
          }
        }
      }
    } else if (cell.type === TileType.Road) {
      this.grid[y][x] = {
        type: TileType.Grass,
        x,
        y,
      };
    }

    this.onGridChange(this.grid);
    this.drawGrid();
  }

  drawGrid() {
    this.graphics.clear();

    // Draw tiles from back to front for proper depth
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        this.drawTile(x, y);
      }
    }
  }

  drawTile(x: number, y: number) {
    const cell = this.grid[y][x];
    const screenPos = gridToScreen(x, y);

    // Tile diamond points
    const points = [
      { x: screenPos.x, y: screenPos.y - TILE_HEIGHT / 2 }, // Top
      { x: screenPos.x + TILE_WIDTH / 2, y: screenPos.y }, // Right
      { x: screenPos.x, y: screenPos.y + TILE_HEIGHT / 2 }, // Bottom
      { x: screenPos.x - TILE_WIDTH / 2, y: screenPos.y }, // Left
    ];

    // Get tile color based on type
    let fillColor = 0x4caf50; // Grass
    let strokeColor = 0x388e3c;

    switch (cell.type) {
      case TileType.Grass:
        // Vary grass color slightly
        const variation = ((x + y) % 3) * 0x050505;
        fillColor = 0x4caf50 + variation;
        strokeColor = 0x388e3c;
        break;
      case TileType.Road:
        fillColor = 0x546e7a;
        strokeColor = 0x37474f;
        // Draw road markings based on connections
        const connections = getRoadConnections(this.grid, x, y);
        this.drawRoadWithConnections(screenPos, points, connections);
        return;
      case TileType.Building:
        if (cell.isOrigin && cell.buildingId) {
          const building = getBuildingById(cell.buildingId);
          if (building) {
            this.drawBuilding(x, y, building);
          }
        }
        // Draw foundation for non-origin tiles
        fillColor = 0x9e9e9e;
        strokeColor = 0x757575;
        break;
    }

    // Draw tile
    this.graphics.fillStyle(fillColor, 1);
    this.graphics.beginPath();
    this.graphics.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      this.graphics.lineTo(points[i].x, points[i].y);
    }
    this.graphics.closePath();
    this.graphics.fillPath();

    // Draw border
    this.graphics.lineStyle(1, strokeColor, 0.5);
    this.graphics.strokePath();
  }

  drawRoadWithConnections(
    screenPos: { x: number; y: number },
    points: { x: number; y: number }[],
    connections: RoadConnection
  ) {
    // Base road tile
    this.graphics.fillStyle(0x546e7a, 1);
    this.graphics.beginPath();
    this.graphics.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      this.graphics.lineTo(points[i].x, points[i].y);
    }
    this.graphics.closePath();
    this.graphics.fillPath();

    // Road border
    this.graphics.lineStyle(1, 0x37474f, 0.8);
    this.graphics.strokePath();

    // Yellow center line
    this.graphics.lineStyle(2, 0xffc107, 0.8);
    const cx = screenPos.x;
    const cy = screenPos.y;

    if (connections.north || connections.south) {
      this.graphics.beginPath();
      this.graphics.moveTo(cx, cy - TILE_HEIGHT / 4);
      this.graphics.lineTo(cx, cy + TILE_HEIGHT / 4);
      this.graphics.strokePath();
    }

    if (connections.east || connections.west) {
      this.graphics.beginPath();
      this.graphics.moveTo(cx - TILE_WIDTH / 4, cy);
      this.graphics.lineTo(cx + TILE_WIDTH / 4, cy);
      this.graphics.strokePath();
    }
  }

  drawBuilding(x: number, y: number, building: { id: string; name: string; color: string; footprint: { width: number; height: number }; icon: string }) {
    const screenPos = gridToScreen(x, y);
    const { width, height } = building.footprint;

    // Calculate building dimensions
    const bWidth = width * TILE_WIDTH;
    const bHeight = height * TILE_HEIGHT;
    const buildingHeight = Math.max(width, height) * 30 + 20;

    // Building base position (bottom center of footprint)
    const baseX = screenPos.x + (width - height) * (TILE_WIDTH / 4);
    const baseY = screenPos.y + (width + height - 1) * (TILE_HEIGHT / 2);

    // Parse color
    const color = parseInt(building.color.replace("#", ""), 16);
    const darkColor = Phaser.Display.Color.IntegerToColor(color).darken(20).color;
    const lightColor = Phaser.Display.Color.IntegerToColor(color).lighten(10).color;

    // Draw 3D building
    // Front face
    this.graphics.fillStyle(color, 1);
    this.graphics.fillRect(
      baseX - bWidth / 4,
      baseY - buildingHeight,
      bWidth / 2,
      buildingHeight
    );

    // Left face
    this.graphics.fillStyle(darkColor, 1);
    this.graphics.beginPath();
    this.graphics.moveTo(baseX - bWidth / 4, baseY - buildingHeight);
    this.graphics.lineTo(baseX - bWidth / 4 - 10, baseY - buildingHeight + 5);
    this.graphics.lineTo(baseX - bWidth / 4 - 10, baseY + 5);
    this.graphics.lineTo(baseX - bWidth / 4, baseY);
    this.graphics.closePath();
    this.graphics.fillPath();

    // Top face
    this.graphics.fillStyle(lightColor, 1);
    this.graphics.beginPath();
    this.graphics.moveTo(baseX - bWidth / 4, baseY - buildingHeight);
    this.graphics.lineTo(baseX - bWidth / 4 - 10, baseY - buildingHeight + 5);
    this.graphics.lineTo(baseX + bWidth / 4 - 10, baseY - buildingHeight + 5);
    this.graphics.lineTo(baseX + bWidth / 4, baseY - buildingHeight);
    this.graphics.closePath();
    this.graphics.fillPath();

    // Draw building icon/emoji as text
    const style = {
      fontSize: "24px",
      fontFamily: "Arial",
    };
    this.add.text(
      baseX - 12,
      baseY - buildingHeight / 2 - 12,
      building.icon,
      style
    );
  }

  drawHoverPreview() {
    this.hoverGraphics.clear();

    if (this.hoverX < 0 || this.hoverX >= GRID_SIZE || this.hoverY < 0 || this.hoverY >= GRID_SIZE) {
      return;
    }

    const screenPos = gridToScreen(this.hoverX, this.hoverY);

    // Highlight tile
    const points = [
      { x: screenPos.x, y: screenPos.y - TILE_HEIGHT / 2 },
      { x: screenPos.x + TILE_WIDTH / 2, y: screenPos.y },
      { x: screenPos.x, y: screenPos.y + TILE_HEIGHT / 2 },
      { x: screenPos.x - TILE_WIDTH / 2, y: screenPos.y },
    ];

    let previewColor = 0xffffff;
    let alpha = 0.3;

    if (this.currentTool === ToolType.Road) {
      previewColor = 0xffc107;
    } else if (this.currentTool === ToolType.Building && this.currentBuildingId) {
      const building = getBuildingById(this.currentBuildingId);
      if (building) {
        previewColor = parseInt(building.color.replace("#", ""), 16);
        // Show full footprint
        for (let dy = 0; dy < building.footprint.height; dy++) {
          for (let dx = 0; dx < building.footprint.width; dx++) {
            const sp = gridToScreen(this.hoverX + dx, this.hoverY + dy);
            const pts = [
              { x: sp.x, y: sp.y - TILE_HEIGHT / 2 },
              { x: sp.x + TILE_WIDTH / 2, y: sp.y },
              { x: sp.x, y: sp.y + TILE_HEIGHT / 2 },
              { x: sp.x - TILE_WIDTH / 2, y: sp.y },
            ];
            this.hoverGraphics.fillStyle(previewColor, 0.4);
            this.hoverGraphics.beginPath();
            this.hoverGraphics.moveTo(pts[0].x, pts[0].y);
            for (let i = 1; i < pts.length; i++) {
              this.hoverGraphics.lineTo(pts[i].x, pts[i].y);
            }
            this.hoverGraphics.closePath();
            this.hoverGraphics.fillPath();
          }
        }
        return;
      }
    } else if (this.currentTool === ToolType.Eraser) {
      previewColor = 0xff5252;
      alpha = 0.5;
    }

    this.hoverGraphics.fillStyle(previewColor, alpha);
    this.hoverGraphics.beginPath();
    this.hoverGraphics.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      this.hoverGraphics.lineTo(points[i].x, points[i].y);
    }
    this.hoverGraphics.closePath();
    this.hoverGraphics.fillPath();
  }

  // Public methods for React integration
  setTool(tool: ToolType) {
    this.currentTool = tool;
  }

  setBuilding(buildingId: string | null) {
    this.currentBuildingId = buildingId;
    if (buildingId) {
      this.currentTool = ToolType.Building;
    }
  }

  setDirection(direction: Direction) {
    this.currentDirection = direction;
  }

  setZoom(zoom: number) {
    this.cameras.main.setZoom(zoom);
  }

  getZoom(): number {
    return this.cameras.main.zoom;
  }

  updateGrid(newGrid: GridCell[][]) {
    this.grid = newGrid;
    this.drawGrid();
  }
}
