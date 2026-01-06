import { useState, useRef, useCallback, useEffect } from "react";
import { PhaserGame, PhaserGameRef } from "@/game/PhaserGame";
import { ToolButton } from "./ToolButton";
import { BuildingPanel } from "./BuildingPanel";
import { GridCell, TileType, ToolType, GRID_WIDTH, GRID_HEIGHT, BuildingDefinition, Direction } from "@/game/types";
import { getBuilding, getBuildingFootprint } from "@/game/buildings";
import {
  ROAD_SEGMENT_SIZE,
  getRoadSegmentOrigin,
  hasRoadSegment,
  getRoadConnections,
  getSegmentType,
  generateRoadPattern,
  getAffectedSegments,
  canPlaceRoadSegment,
} from "@/game/roadUtils";
import { Save, FolderOpen, ZoomIn, ZoomOut, Trash2, Home, MapPin, User, Car } from "lucide-react";
import { toast } from "sonner";

const STORAGE_KEY = "city-builder-save";

function createEmptyGrid(): GridCell[][] {
  const grid: GridCell[][] = [];
  for (let y = 0; y < GRID_HEIGHT; y++) {
    const row: GridCell[] = [];
    for (let x = 0; x < GRID_WIDTH; x++) {
      row.push({ type: TileType.Grass, x, y, isOrigin: true });
    }
    grid.push(row);
  }
  return grid;
}

export function GameUI() {
  const [grid, setGrid] = useState<GridCell[][]>(createEmptyGrid);
  const [currentTool, setCurrentTool] = useState<ToolType>(ToolType.None);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [buildingOrientation, setBuildingOrientation] = useState<Direction>(Direction.Down);
  const [showBuildingPanel, setShowBuildingPanel] = useState(false);
  const [zoom, setZoom] = useState(1);
  const gameRef = useRef<PhaserGameRef>(null);

  const handleGridChange = useCallback((newGrid: GridCell[][]) => {
    setGrid(newGrid);
  }, []);

  const handleToolChange = (tool: ToolType) => {
    setCurrentTool(tool);
    setSelectedBuildingId(null);
    setShowBuildingPanel(tool === ToolType.Building);
    gameRef.current?.setTool(tool);
    gameRef.current?.setBuilding(null);
  };

  const handleBuildingSelect = (building: BuildingDefinition) => {
    setSelectedBuildingId(building.id);
    setBuildingOrientation(Direction.Down);
    gameRef.current?.setBuilding(building.id);
    gameRef.current?.setTool(ToolType.Building);
  };

  const handleTileClick = useCallback((x: number, y: number) => {
    setGrid((prevGrid) => {
      const newGrid = prevGrid.map((row) => row.map((cell) => ({ ...cell })));

      if (currentTool === ToolType.Building && selectedBuildingId) {
        const building = getBuilding(selectedBuildingId);
        if (!building) return prevGrid;

        const footprint = getBuildingFootprint(building, buildingOrientation);

        // Check if all tiles are available
        for (let dy = 0; dy < footprint.height; dy++) {
          for (let dx = 0; dx < footprint.width; dx++) {
            const gx = x + dx;
            const gy = y + dy;
            if (gx >= GRID_WIDTH || gy >= GRID_HEIGHT) return prevGrid;
            if (newGrid[gy][gx].type !== TileType.Grass) return prevGrid;
          }
        }

        // Place building
        for (let dy = 0; dy < footprint.height; dy++) {
          for (let dx = 0; dx < footprint.width; dx++) {
            const gx = x + dx;
            const gy = y + dy;
            newGrid[gy][gx] = {
              type: TileType.Building,
              x: gx,
              y: gy,
              isOrigin: dx === 0 && dy === 0,
              originX: x,
              originY: y,
              buildingId: building.id,
              buildingOrientation,
            };
          }
        }
        gameRef.current?.shakeScreen();
      } else if (currentTool === ToolType.Eraser) {
        const cell = newGrid[y][x];
        if (cell.type === TileType.Building) {
          const originX = cell.originX ?? x;
          const originY = cell.originY ?? y;
          const building = getBuilding(cell.buildingId || "");
          if (building) {
            const footprint = getBuildingFootprint(building, cell.buildingOrientation);
            for (let dy = 0; dy < footprint.height; dy++) {
              for (let dx = 0; dx < footprint.width; dx++) {
                const gx = originX + dx;
                const gy = originY + dy;
                if (gx < GRID_WIDTH && gy < GRID_HEIGHT) {
                  newGrid[gy][gx] = { type: TileType.Grass, x: gx, y: gy, isOrigin: true };
                }
              }
            }
          }
        } else if (cell.type !== TileType.Grass) {
          newGrid[y][x] = { type: TileType.Grass, x, y, isOrigin: true };
        }
      }

      return newGrid;
    });
  }, [currentTool, selectedBuildingId, buildingOrientation]);

  const handleRoadDrag = useCallback((segments: Array<{ x: number; y: number }>) => {
    setGrid((prevGrid) => {
      const newGrid = prevGrid.map((row) => row.map((cell) => ({ ...cell })));

      for (const seg of segments) {
        const check = canPlaceRoadSegment(newGrid, seg.x, seg.y);
        if (!check.valid) continue;

        for (let dy = 0; dy < ROAD_SEGMENT_SIZE; dy++) {
          for (let dx = 0; dx < ROAD_SEGMENT_SIZE; dx++) {
            const px = seg.x + dx;
            const py = seg.y + dy;
            if (px < GRID_WIDTH && py < GRID_HEIGHT) {
              newGrid[py][px].isOrigin = dx === 0 && dy === 0;
              newGrid[py][px].originX = seg.x;
              newGrid[py][px].originY = seg.y;
              newGrid[py][px].type = TileType.Road;
            }
          }
        }
      }

      // Update road patterns
      const allAffected = new Set<string>();
      for (const seg of segments) {
        for (const affected of getAffectedSegments(seg.x, seg.y)) {
          allAffected.add(`${affected.x},${affected.y}`);
        }
      }

      for (const key of allAffected) {
        const [sx, sy] = key.split(",").map(Number);
        if (!hasRoadSegment(newGrid, sx, sy)) continue;

        const connections = getRoadConnections(newGrid, sx, sy);
        const segmentType = getSegmentType(connections);
        const pattern = generateRoadPattern(segmentType);

        for (const tile of pattern) {
          const px = sx + tile.dx;
          const py = sy + tile.dy;
          if (px < GRID_WIDTH && py < GRID_HEIGHT) {
            newGrid[py][px].type = tile.type;
          }
        }
      }

      return newGrid;
    });
  }, []);

  const handleTilesDrag = useCallback((tiles: Array<{ x: number; y: number }>) => {
    setGrid((prevGrid) => {
      const newGrid = prevGrid.map((row) => row.map((cell) => ({ ...cell })));

      for (const tile of tiles) {
        const { x, y } = tile;
        if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) continue;

        if (currentTool === ToolType.Eraser) {
          if (newGrid[y][x].type !== TileType.Grass) {
            newGrid[y][x] = { type: TileType.Grass, x, y, isOrigin: true };
          }
        } else if (currentTool === ToolType.Snow) {
          if (newGrid[y][x].type === TileType.Grass) {
            newGrid[y][x].type = TileType.Snow;
          }
        } else if (currentTool === ToolType.Tile) {
          if (newGrid[y][x].type === TileType.Grass) {
            newGrid[y][x].type = TileType.Tile;
          }
        } else if (currentTool === ToolType.Asphalt) {
          if (newGrid[y][x].type === TileType.Grass) {
            newGrid[y][x].type = TileType.Asphalt;
          }
        }
      }

      return newGrid;
    });
  }, [currentTool]);

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + 0.25, 4);
    setZoom(newZoom);
    gameRef.current?.setZoom(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 0.25, 0.25);
    setZoom(newZoom);
    gameRef.current?.setZoom(newZoom);
  };

  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(grid));
      toast.success("City saved!");
    } catch {
      toast.error("Failed to save");
    }
  };

  const handleLoad = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const loadedGrid = JSON.parse(saved);
        setGrid(loadedGrid);
        gameRef.current?.updateGrid(loadedGrid);
        toast.success("City loaded!");
      } else {
        toast.info("No saved city found");
      }
    } catch {
      toast.error("Failed to load");
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const loadedGrid = JSON.parse(saved);
        setGrid(loadedGrid);
        setTimeout(() => gameRef.current?.updateGrid(loadedGrid), 500);
      } catch {}
    }
  }, []);

  return (
    <div className="game-container">
      <PhaserGame
        ref={gameRef}
        grid={grid}
        onGridChange={handleGridChange}
        onTileClick={handleTileClick}
        onTilesDrag={handleTilesDrag}
        onRoadDrag={handleRoadDrag}
      />

      {/* Toolbar */}
      <div className="game-toolbar">
        <div className="game-panel flex gap-1 p-2">
          <ToolButton
            icon={<MapPin className="w-5 h-5" />}
            label="Road"
            isActive={currentTool === ToolType.RoadNetwork}
            onClick={() => handleToolChange(ToolType.RoadNetwork)}
          />
          <ToolButton
            icon={<Home className="w-5 h-5" />}
            label="Build"
            isActive={currentTool === ToolType.Building || showBuildingPanel}
            onClick={() => handleToolChange(ToolType.Building)}
          />
          <ToolButton
            icon={<Trash2 className="w-5 h-5" />}
            label="Bulldozer"
            isActive={currentTool === ToolType.Eraser}
            onClick={() => handleToolChange(ToolType.Eraser)}
            variant="danger"
          />
        </div>
      </div>

      <BuildingPanel
        isOpen={showBuildingPanel}
        selectedBuildingId={selectedBuildingId}
        onSelectBuilding={handleBuildingSelect}
        onClose={() => setShowBuildingPanel(false)}
      />

      {/* Spawn & Save/Load */}
      <div className="save-load-buttons">
        <div className="game-panel flex gap-1 p-2">
          <ToolButton icon={<User className="w-5 h-5" />} label="Spawn Person" onClick={() => gameRef.current?.spawnCharacter()} />
          <ToolButton icon={<Car className="w-5 h-5" />} label="Spawn Car" onClick={() => gameRef.current?.spawnCar()} />
          <ToolButton icon={<Save className="w-5 h-5" />} label="Save" onClick={handleSave} />
          <ToolButton icon={<FolderOpen className="w-5 h-5" />} label="Load" onClick={handleLoad} />
        </div>
      </div>

      {/* Zoom */}
      <div className="zoom-controls">
        <div className="game-panel flex flex-col gap-1 p-2">
          <ToolButton icon={<ZoomIn className="w-5 h-5" />} label="Zoom In" onClick={handleZoomIn} />
          <ToolButton icon={<ZoomOut className="w-5 h-5" />} label="Zoom Out" onClick={handleZoomOut} />
        </div>
      </div>

      {/* Status bar */}
      <div className="game-status-bar">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>🏙️ Pogicity Clone</span>
          <span className="text-xs">Pan: Right-click | Zoom: Scroll</span>
        </div>
        <div className="text-sm text-muted-foreground">Zoom: {Math.round(zoom * 100)}%</div>
      </div>
    </div>
  );
}
