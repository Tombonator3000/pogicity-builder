import { useState, useRef, useCallback, useEffect } from "react";
import { PhaserGame, PhaserGameRef } from "@/game/PhaserGame";
import { ToolButton } from "./ToolButton";
import { BuildingPanel } from "./BuildingPanel";
import { GridCell, TileType, ToolType, GRID_SIZE, BuildingDefinition } from "@/game/types";
import { Save, FolderOpen, ZoomIn, ZoomOut, Trash2, Home, MapPin } from "lucide-react";
import { toast } from "sonner";

const STORAGE_KEY = "city-builder-save";

function createEmptyGrid(): GridCell[][] {
  const grid: GridCell[][] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    const row: GridCell[] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      row.push({ type: TileType.Grass, x, y });
    }
    grid.push(row);
  }
  return grid;
}

export function GameUI() {
  const [grid, setGrid] = useState<GridCell[][]>(createEmptyGrid);
  const [currentTool, setCurrentTool] = useState<ToolType>(ToolType.None);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
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
    gameRef.current?.setBuilding(building.id);
    gameRef.current?.setTool(ToolType.Building);
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + 0.25, 3);
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
      toast.success("City saved successfully!");
    } catch (error) {
      toast.error("Failed to save city");
    }
  };

  const handleLoad = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const loadedGrid = JSON.parse(saved);
        setGrid(loadedGrid);
        gameRef.current?.updateGrid(loadedGrid);
        toast.success("City loaded successfully!");
      } else {
        toast.info("No saved city found");
      }
    } catch (error) {
      toast.error("Failed to load city");
    }
  };

  // Auto-load saved game on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const loadedGrid = JSON.parse(saved);
        setGrid(loadedGrid);
        // Slight delay to ensure Phaser scene is ready
        setTimeout(() => {
          gameRef.current?.updateGrid(loadedGrid);
        }, 500);
      } catch (error) {
        console.error("Failed to auto-load save:", error);
      }
    }
  }, []);

  return (
    <div className="game-container">
      {/* Phaser Game Canvas */}
      <PhaserGame ref={gameRef} grid={grid} onGridChange={handleGridChange} />

      {/* Toolbar */}
      <div className="game-toolbar">
        <div className="game-panel flex gap-1 p-2">
          <ToolButton
            icon={<MapPin className="w-5 h-5" />}
            label="Road Tool"
            isActive={currentTool === ToolType.Road}
            onClick={() => handleToolChange(ToolType.Road)}
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

      {/* Building Panel */}
      <BuildingPanel
        isOpen={showBuildingPanel}
        selectedBuildingId={selectedBuildingId}
        onSelectBuilding={handleBuildingSelect}
        onClose={() => setShowBuildingPanel(false)}
      />

      {/* Save/Load buttons */}
      <div className="save-load-buttons">
        <div className="game-panel flex gap-1 p-2">
          <ToolButton
            icon={<Save className="w-5 h-5" />}
            label="Save City"
            onClick={handleSave}
          />
          <ToolButton
            icon={<FolderOpen className="w-5 h-5" />}
            label="Load City"
            onClick={handleLoad}
          />
        </div>
      </div>

      {/* Zoom controls */}
      <div className="zoom-controls">
        <div className="game-panel flex flex-col gap-1 p-2">
          <ToolButton
            icon={<ZoomIn className="w-5 h-5" />}
            label="Zoom In"
            onClick={handleZoomIn}
          />
          <ToolButton
            icon={<ZoomOut className="w-5 h-5" />}
            label="Zoom Out"
            onClick={handleZoomOut}
          />
        </div>
      </div>

      {/* Status bar */}
      <div className="game-status-bar">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>🏙️ City Builder</span>
          <span className="text-xs">Pan: Right-click drag | Zoom: Scroll wheel</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">
            Zoom: {Math.round(zoom * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}
