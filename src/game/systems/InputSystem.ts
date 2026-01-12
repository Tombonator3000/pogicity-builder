import Phaser from 'phaser';
import { Direction, GridCell, ToolType } from '../types';
import { COLOR_PALETTE, GRID_CONFIG, RENDER_CONFIG } from '../config';
import { gridToScreen, screenToGrid } from '../utils/GridUtils';
import { getBuilding, getBuildingFootprint } from '../buildings';
import { getRoadSegmentOrigin } from '../roadUtils';
import { GameSystem } from './GameSystem';

/**
 * Event types for communicating with React
 */
export interface SceneEvents {
  onTileClick: (x: number, y: number) => void;
  onTileHover: (x: number | null, y: number | null) => void;
  onTilesDrag?: (tiles: Array<{ x: number; y: number }>) => void;
  onRoadDrag?: (segments: Array<{ x: number; y: number }>) => void;
  onQueryCell?: (x: number, y: number) => void;
}

/**
 * Input handling system
 * Manages mouse/pointer input, hover preview, and drag operations
 */
export class InputSystem implements GameSystem {
  private scene!: Phaser.Scene;
  private camera!: Phaser.Cameras.Scene2D.Camera;
  private grid: GridCell[][] = [];

  // Tool state
  private selectedTool: ToolType = ToolType.None;
  private selectedBuildingId: string | null = null;
  private buildingOrientation: Direction = Direction.Down;

  // Hover state
  private hoverTile: { x: number; y: number } | null = null;

  // Drag state
  private isDragging: boolean = false;
  private dragTiles: Set<string> = new Set();
  private dragStartTile: { x: number; y: number } | null = null;

  // Preview graphics
  private previewGraphics: Phaser.GameObjects.Graphics | null = null;

  // Event callbacks
  private events: SceneEvents = {
    onTileClick: () => {},
    onTileHover: () => {},
  };

  init(scene: Phaser.Scene): void {
    this.scene = scene;
    this.camera = scene.cameras.main;

    // Create preview graphics
    this.previewGraphics = scene.add.graphics();
    this.previewGraphics.setDepth(RENDER_CONFIG.layers.preview);

    // Register input handlers
    scene.input.on('pointermove', this.handlePointerMove, this);
    scene.input.on('pointerdown', this.handlePointerDown, this);
    scene.input.on('pointerup', this.handlePointerUp, this);
  }

  /**
   * Sets the grid reference
   */
  setGrid(grid: GridCell[][]): void {
    this.grid = grid;
  }

  /**
   * Sets event callbacks for React communication
   */
  setEvents(events: Partial<SceneEvents>): void {
    this.events = { ...this.events, ...events };
  }

  /**
   * Sets the selected tool
   */
  setTool(tool: ToolType): void {
    this.selectedTool = tool;
    this.updatePreview();
  }

  /**
   * Sets the selected building
   */
  setBuilding(buildingId: string | null): void {
    this.selectedBuildingId = buildingId;
    if (buildingId) {
      this.selectedTool = ToolType.Building;
    }
    this.updatePreview();
  }

  /**
   * Sets the building orientation
   */
  setDirection(direction: Direction): void {
    this.buildingOrientation = direction;
    this.updatePreview();
  }

  /**
   * Checks if currently dragging
   */
  isDraggingActive(): boolean {
    return this.isDragging;
  }

  destroy(): void {
    this.previewGraphics?.destroy();
    this.previewGraphics = null;
    this.scene.input.off('pointermove', this.handlePointerMove, this);
    this.scene.input.off('pointerdown', this.handlePointerDown, this);
    this.scene.input.off('pointerup', this.handlePointerUp, this);
  }

  // ============================================
  // PRIVATE METHODS - INPUT HANDLERS
  // ============================================

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    const worldPoint = this.camera.getWorldPoint(pointer.x, pointer.y);
    const gridPos = screenToGrid(worldPoint.x, worldPoint.y);
    const tileX = Math.floor(gridPos.x);
    const tileY = Math.floor(gridPos.y);

    if (tileX >= 0 && tileX < GRID_CONFIG.width && tileY >= 0 && tileY < GRID_CONFIG.height) {
      if (!this.hoverTile || this.hoverTile.x !== tileX || this.hoverTile.y !== tileY) {
        this.hoverTile = { x: tileX, y: tileY };
        this.events.onTileHover(tileX, tileY);

        // Handle drag for painting tools
        if (this.isDragging && this.shouldPaintOnDrag()) {
          this.dragTiles.add(`${tileX},${tileY}`);
        }

        this.updatePreview();
      }
    } else {
      if (this.hoverTile) {
        this.hoverTile = null;
        this.events.onTileHover(null, null);
        this.clearPreview();
      }
    }
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    // Only handle left button for tools
    if (!pointer.leftButtonDown()) return;
    if (this.selectedTool === ToolType.None) return;

    if (this.hoverTile) {
      // Query tool - special handling
      if (this.selectedTool === ToolType.Query) {
        this.events.onQueryCell?.(this.hoverTile.x, this.hoverTile.y);
        return;
      }

      if (this.shouldPaintOnDrag() || this.selectedTool === ToolType.RoadNetwork) {
        this.isDragging = true;
        this.dragTiles.clear();
        this.dragStartTile = { x: this.hoverTile.x, y: this.hoverTile.y };

        if (this.selectedTool === ToolType.RoadNetwork) {
          const segmentOrigin = getRoadSegmentOrigin(this.hoverTile.x, this.hoverTile.y);
          this.dragTiles.add(`${segmentOrigin.x},${segmentOrigin.y}`);
        } else {
          this.dragTiles.add(`${this.hoverTile.x},${this.hoverTile.y}`);
        }
        this.updatePreview();
      } else {
        // Single click placement
        this.events.onTileClick(this.hoverTile.x, this.hoverTile.y);
      }
    }
  }

  private handlePointerUp(_pointer: Phaser.Input.Pointer): void {
    if (this.isDragging && this.dragTiles.size > 0) {
      // Commit drag operation
      const tiles = Array.from(this.dragTiles).map((key) => {
        const [x, y] = key.split(',').map(Number);
        return { x, y };
      });

      if (this.selectedTool === ToolType.RoadNetwork) {
        this.events.onRoadDrag?.(tiles);
      } else {
        this.events.onTilesDrag?.(tiles);
      }
    }

    this.isDragging = false;
    this.dragTiles.clear();
    this.dragStartTile = null;
    this.clearPreview();
  }

  // ============================================
  // PRIVATE METHODS - PREVIEW
  // ============================================

  private shouldPaintOnDrag(): boolean {
    return [
      ToolType.Snow,
      ToolType.Tile,
      ToolType.Asphalt,
      ToolType.Eraser,
      ToolType.Wasteland,
      ToolType.Rubble,
      // Zoning tools support drag painting
      ToolType.ZoneResidential,
      ToolType.ZoneCommercial,
      ToolType.ZoneIndustrial,
      ToolType.Dezone,
    ].includes(this.selectedTool);
  }

  private updatePreview(): void {
    if (!this.previewGraphics || !this.hoverTile) return;

    this.previewGraphics.clear();

    const alpha = RENDER_CONFIG.previewAlpha;
    const color = this.getPreviewColor();

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

  private getPreviewColor(): number {
    switch (this.selectedTool) {
      case ToolType.RoadNetwork:
        return COLOR_PALETTE.preview.roadNetwork;
      case ToolType.Asphalt:
        return COLOR_PALETTE.preview.asphalt;
      case ToolType.Tile:
        return COLOR_PALETTE.preview.tile;
      case ToolType.Snow:
        return COLOR_PALETTE.preview.snow;
      case ToolType.Building:
        return COLOR_PALETTE.preview.building;
      case ToolType.Eraser:
        return COLOR_PALETTE.preview.eraser;
      // Zoning tools
      case ToolType.ZoneResidential:
        return COLOR_PALETTE.preview.zoneResidential;
      case ToolType.ZoneCommercial:
        return COLOR_PALETTE.preview.zoneCommercial;
      case ToolType.ZoneIndustrial:
        return COLOR_PALETTE.preview.zoneIndustrial;
      case ToolType.Dezone:
        return COLOR_PALETTE.preview.dezone;
      case ToolType.Wasteland:
        return COLOR_PALETTE.preview.wasteland;
      case ToolType.Rubble:
        return COLOR_PALETTE.preview.rubble;
      case ToolType.Query:
        return 0x00bcd4; // Cyan color for query tool
      default:
        return COLOR_PALETTE.preview.default;
    }
  }

  private drawPreviewTile(x: number, y: number, color: number, alpha: number): void {
    if (!this.previewGraphics) return;

    const screenPos = gridToScreen(x, y);
    const points = [
      { x: screenPos.x, y: screenPos.y - GRID_CONFIG.tileHeight / 2 },
      { x: screenPos.x + GRID_CONFIG.tileWidth / 2, y: screenPos.y },
      { x: screenPos.x, y: screenPos.y + GRID_CONFIG.tileHeight / 2 },
      { x: screenPos.x - GRID_CONFIG.tileWidth / 2, y: screenPos.y },
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
}
