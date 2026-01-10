import { useState, useRef, useCallback, useEffect } from "react";
import { PhaserGame, PhaserGameRef } from "@/game/PhaserGame";
import { ToolButton } from "./ToolButton";
import { BuildingPanel } from "./BuildingPanel";
import { ResourcePanel } from "./ResourcePanel";
import { MainMenu } from "./MainMenu";
import { GridCell, TileType, ToolType, GRID_WIDTH, GRID_HEIGHT, BuildingDefinition, Direction, Resources } from "@/game/types";
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
import { Save, FolderOpen, ZoomIn, ZoomOut, Trash2, Home, MapPin, User, Car, RotateCw, Square, CircleDot, Menu } from "lucide-react";
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
  // Menu state
  const [showMenu, setShowMenu] = useState(true);
  const [isGameStarted, setIsGameStarted] = useState(false);
  
  const [grid, setGrid] = useState<GridCell[][]>(createEmptyGrid);
  const [currentTool, setCurrentTool] = useState<ToolType>(ToolType.None);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [buildingOrientation, setBuildingOrientation] = useState<Direction>(Direction.Down);
  const [showBuildingPanel, setShowBuildingPanel] = useState(false);
  const [zoom, setZoom] = useState(1);
  const gameRef = useRef<PhaserGameRef>(null);

  // Check for saved game
  const hasSavedGame = !!localStorage.getItem(STORAGE_KEY);

  // Refs to avoid stale closures in callbacks
  const currentToolRef = useRef(currentTool);
  const selectedBuildingIdRef = useRef(selectedBuildingId);
  const buildingOrientationRef = useRef(buildingOrientation);

  // Keep refs in sync with state
  useEffect(() => { currentToolRef.current = currentTool; }, [currentTool]);
  useEffect(() => { selectedBuildingIdRef.current = selectedBuildingId; }, [selectedBuildingId]);
  useEffect(() => { buildingOrientationRef.current = buildingOrientation; }, [buildingOrientation]);

  // Post-apocalyptic resources
  const [resources, setResources] = useState<Resources>({
    scrap: 100,
    food: 50,
    water: 50,
    power: 0,
    medicine: 10,
    caps: 0,
  });
  const [resourceCapacity, setResourceCapacity] = useState<Resources>({
    scrap: 500,
    food: 200,
    water: 200,
    power: 100,
    medicine: 100,
    caps: 1000,
  });
  const [resourceRates, setResourceRates] = useState<Partial<Resources>>({});

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
    setCurrentTool(ToolType.Building);
    setBuildingOrientation(Direction.Down);
    gameRef.current?.setBuilding(building.id);
    gameRef.current?.setTool(ToolType.Building);
    gameRef.current?.setDirection(Direction.Down);
  };

  const handleRotate = () => {
    const directions = [Direction.Down, Direction.Right, Direction.Up, Direction.Left];
    const currentIndex = directions.indexOf(buildingOrientation);
    const nextDirection = directions[(currentIndex + 1) % 4];
    setBuildingOrientation(nextDirection);
    gameRef.current?.setDirection(nextDirection);
  };

  const handleTileClick = useCallback((x: number, y: number) => {
    // Use refs to get current values (avoids stale closures)
    const tool = currentToolRef.current;
    const buildingId = selectedBuildingIdRef.current;
    const orientation = buildingOrientationRef.current;
    
    setGrid((prevGrid) => {
      const newGrid = prevGrid.map((row) => row.map((cell) => ({ ...cell })));

      if (tool === ToolType.Building && buildingId) {
        const building = getBuilding(buildingId);
        if (!building) return prevGrid;

        const footprint = getBuildingFootprint(building, orientation);

        // Check if player can afford the building
        if (building.cost && !gameRef.current?.canAffordBuilding(building.cost)) {
          toast.error("Not enough resources!", {
            description: "You need more materials to build this.",
          });
          return prevGrid;
        }

        // Check if all tiles are available (can build on grass, wasteland, rubble, snow)
        const buildableTiles = [TileType.Grass, TileType.Snow, TileType.Wasteland, TileType.Rubble];
        for (let dy = 0; dy < footprint.height; dy++) {
          for (let dx = 0; dx < footprint.width; dx++) {
            const gx = x + dx;
            const gy = y + dy;
            if (gx >= GRID_WIDTH || gy >= GRID_HEIGHT) return prevGrid;
            if (!buildableTiles.includes(newGrid[gy][gx].type)) return prevGrid;
          }
        }

        // Deduct resources
        if (building.cost && !gameRef.current?.spendResources(building.cost)) {
          toast.error("Failed to deduct resources!");
          return prevGrid;
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
              buildingOrientation: orientation,
              underlyingTileType: prevGrid[gy][gx].type,
            };
          }
        }
        gameRef.current?.shakeScreen();
        toast.success(`Placed ${building.name}`);
      } else if (tool === ToolType.Eraser) {
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
                  const underlying = newGrid[gy][gx].underlyingTileType || TileType.Grass;
                  newGrid[gy][gx] = { type: underlying, x: gx, y: gy, isOrigin: true };
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
  }, []); // Empty deps - uses refs instead

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
    const tool = currentToolRef.current; // Use ref for current tool
    
    setGrid((prevGrid) => {
      const newGrid = prevGrid.map((row) => row.map((cell) => ({ ...cell })));

      for (const tile of tiles) {
        const { x, y } = tile;
        if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) continue;

        if (tool === ToolType.Eraser) {
          if (newGrid[y][x].type !== TileType.Grass) {
            newGrid[y][x] = { type: TileType.Grass, x, y, isOrigin: true };
          }
        } else if (tool === ToolType.Wasteland) {
          if (newGrid[y][x].type === TileType.Grass) {
            newGrid[y][x].type = TileType.Wasteland;
          }
        } else if (tool === ToolType.Rubble) {
          if (newGrid[y][x].type === TileType.Grass || newGrid[y][x].type === TileType.Wasteland) {
            newGrid[y][x].type = TileType.Rubble;
          }
        }
      }

      return newGrid;
    });
  }, []); // Empty deps - uses refs

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

  // Auto-load is now handled by menu choices - removed auto-load on mount

  // Menu handlers
  const handleNewGame = () => {
    setGrid(createEmptyGrid());
    setShowMenu(false);
    setIsGameStarted(true);
    toast.success("Welcome to the Wasteland!");
  };

  const handleLoadGameFromMenu = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const loadedGrid = JSON.parse(saved);
        setGrid(loadedGrid);
        setShowMenu(false);
        setIsGameStarted(true);
        setTimeout(() => gameRef.current?.updateGrid(loadedGrid), 500);
        toast.success("Settlement restored!");
      } catch {
        toast.error("Failed to load saved game");
      }
    }
  };

  const handleOpenMenu = () => {
    setShowMenu(true);
  };

  // Listen to resource changes from the game scene
  useEffect(() => {
    const setupResourceListener = () => {
      const scene = gameRef.current?.getScene();
      if (!scene) return;

      const handleResourceChange = (data: { resources: Resources; capacity: Resources }) => {
        setResources(data.resources);
        setResourceCapacity(data.capacity);

        // Calculate and update rates
        const resourceSystem = scene.getResourceSystem();
        if (resourceSystem) {
          const rates = resourceSystem.getNetRate();
          setResourceRates(rates);
        }
      };

      scene.events.on('resources:changed', handleResourceChange);

      return () => {
        scene.events.off('resources:changed', handleResourceChange);
      };
    };

    // Delay setup to ensure scene is ready
    const timeoutId = setTimeout(setupResourceListener, 1000);
    return () => clearTimeout(timeoutId);
  }, []);

  // Show main menu
  if (showMenu) {
    return (
      <MainMenu
        onNewGame={handleNewGame}
        onLoadGame={handleLoadGameFromMenu}
        hasSavedGame={hasSavedGame}
      />
    );
  }

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

      {/* Main Toolbar - Wasteland Tools */}
      <div className="game-toolbar">
        <div className="game-panel flex gap-1 p-2">
          <ToolButton
            icon={<MapPin className="w-5 h-5" />}
            label="Road"
            isActive={currentTool === ToolType.RoadNetwork}
            onClick={() => handleToolChange(ToolType.RoadNetwork)}
          />
          <ToolButton
            icon={<CircleDot className="w-5 h-5" />}
            label="Wasteland"
            isActive={currentTool === ToolType.Wasteland}
            onClick={() => handleToolChange(ToolType.Wasteland)}
          />
          <ToolButton
            icon={<Square className="w-5 h-5" />}
            label="Rubble"
            isActive={currentTool === ToolType.Rubble}
            onClick={() => handleToolChange(ToolType.Rubble)}
          />
          <div className="w-px bg-border mx-1" />
          <ToolButton
            icon={<Home className="w-5 h-5" />}
            label="Build"
            isActive={currentTool === ToolType.Building || showBuildingPanel}
            onClick={() => handleToolChange(ToolType.Building)}
          />
          <ToolButton
            icon={<Trash2 className="w-5 h-5" />}
            label="Salvage"
            isActive={currentTool === ToolType.Eraser}
            onClick={() => handleToolChange(ToolType.Eraser)}
            variant="danger"
          />
        </div>
      </div>

      {/* Resource Panel */}
      <ResourcePanel
        resources={resources}
        capacity={resourceCapacity}
        netRate={resourceRates}
      />

      {/* Building Panel with Rotate button */}
      <BuildingPanel
        isOpen={showBuildingPanel}
        selectedBuildingId={selectedBuildingId}
        onSelectBuilding={handleBuildingSelect}
        onClose={() => setShowBuildingPanel(false)}
      />

      {/* Rotation control when building is selected */}
      {selectedBuildingId && (
        <div className="fixed left-4 top-1/2 -translate-y-1/2 z-50">
          <div className="game-panel flex flex-col gap-1 p-2">
            <ToolButton
              icon={<RotateCw className="w-5 h-5" />}
              label={`Rotate (${buildingOrientation})`}
              onClick={handleRotate}
            />
            <div className="text-xs text-center text-muted-foreground mt-1">
              {buildingOrientation === Direction.Down && "↓ South"}
              {buildingOrientation === Direction.Up && "↑ North"}
              {buildingOrientation === Direction.Left && "← West"}
              {buildingOrientation === Direction.Right && "→ East"}
            </div>
          </div>
        </div>
      )}

      {/* Menu button */}
      <div className="fixed top-4 left-4 z-50">
        <div className="game-panel p-1">
          <ToolButton 
            icon={<Menu className="w-5 h-5" />} 
            label="Menu" 
            onClick={handleOpenMenu}
          />
        </div>
      </div>

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
          <span>☢️ Wasteland Rebuilders</span>
          <span className="text-xs">Pan: Right-click | Zoom: Scroll</span>
        </div>
        <div className="text-sm text-muted-foreground">Zoom: {Math.round(zoom * 100)}%</div>
      </div>
    </div>
  );
}
