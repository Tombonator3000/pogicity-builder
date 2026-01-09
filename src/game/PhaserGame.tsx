import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import Phaser from "phaser";
import { MainScene, SceneEvents } from "./MainScene";
import { GridCell, ToolType, Direction, Resources } from "./types";

interface PhaserGameProps {
  grid: GridCell[][];
  onGridChange: (grid: GridCell[][]) => void;
  onTileClick?: (x: number, y: number) => void;
  onTilesDrag?: (tiles: Array<{ x: number; y: number }>) => void;
  onRoadDrag?: (segments: Array<{ x: number; y: number }>) => void;
}

export interface PhaserGameRef {
  setTool: (tool: ToolType) => void;
  setBuilding: (buildingId: string | null) => void;
  setDirection: (direction: Direction) => void;
  setZoom: (zoom: number) => void;
  getZoom: () => number;
  updateGrid: (grid: GridCell[][]) => void;
  spawnCharacter: () => void;
  spawnCar: () => void;
  getCharacterCount: () => number;
  getCarCount: () => number;
  shakeScreen: (axis?: 'x' | 'y' | 'both', intensity?: number, duration?: number) => void;
  // Resource system methods
  canAffordBuilding: (cost?: Partial<Resources>) => boolean;
  spendResources: (cost: Partial<Resources>) => boolean;
  getScene: () => MainScene | null;
}

export const PhaserGame = forwardRef<PhaserGameRef, PhaserGameProps>(
  ({ grid, onGridChange, onTileClick, onTilesDrag, onRoadDrag }, ref) => {
    const gameRef = useRef<Phaser.Game | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<MainScene | null>(null);

    useImperativeHandle(ref, () => ({
      setTool: (tool: ToolType) => {
        sceneRef.current?.setTool(tool);
      },
      setBuilding: (buildingId: string | null) => {
        sceneRef.current?.setBuilding(buildingId);
      },
      setDirection: (direction: Direction) => {
        sceneRef.current?.setDirection(direction);
      },
      setZoom: (zoom: number) => {
        sceneRef.current?.setZoom(zoom);
      },
      getZoom: () => {
        return sceneRef.current?.getZoom() ?? 1;
      },
      updateGrid: (newGrid: GridCell[][]) => {
        sceneRef.current?.updateGrid(newGrid);
      },
      spawnCharacter: () => {
        sceneRef.current?.spawnCharacter();
      },
      spawnCar: () => {
        sceneRef.current?.spawnCar();
      },
      getCharacterCount: () => {
        return sceneRef.current?.getCharacterCount() ?? 0;
      },
      getCarCount: () => {
        return sceneRef.current?.getCarCount() ?? 0;
      },
      shakeScreen: (axis?: 'x' | 'y' | 'both', intensity?: number, duration?: number) => {
        sceneRef.current?.shakeScreen(axis, intensity, duration);
      },
      canAffordBuilding: (cost?: Partial<Resources>) => {
        if (!cost) return true;
        return sceneRef.current?.getResourceSystem()?.canAfford(cost) ?? false;
      },
      spendResources: (cost: Partial<Resources>) => {
        return sceneRef.current?.getResourceSystem()?.spendResources(cost) ?? false;
      },
      getScene: () => {
        return sceneRef.current;
      },
    }));

    useEffect(() => {
      if (!containerRef.current || gameRef.current) return;

      // Create a custom scene class that captures the grid and callback
      class GameScene extends MainScene {
        init() {
          super.init({ grid, onGridChange });
        }
      }

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        parent: containerRef.current,
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: "#5c8a6b",
        scene: GameScene,
        input: {
          mouse: {
            preventDefaultWheel: true,
          },
        },
        render: {
          antialias: true,
          pixelArt: false,
        },
      };

      gameRef.current = new Phaser.Game(config);

      // Wait for scene to be ready
      const checkScene = () => {
        const scene = gameRef.current?.scene.getScene("MainScene") as MainScene;
        if (scene && scene.scene.isActive()) {
          sceneRef.current = scene;

          // Set up event handlers
          const events: Partial<SceneEvents> = {
            onTileClick: (x, y) => onTileClick?.(x, y),
            onTilesDrag: (tiles) => onTilesDrag?.(tiles),
            onRoadDrag: (segments) => onRoadDrag?.(segments),
          };
          scene.setEvents(events);
        } else {
          setTimeout(checkScene, 100);
        }
      };
      setTimeout(checkScene, 200);

      // Handle resize
      const handleResize = () => {
        if (gameRef.current) {
          gameRef.current.scale.resize(window.innerWidth, window.innerHeight);
        }
      };

      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        if (gameRef.current) {
          gameRef.current.destroy(true);
          gameRef.current = null;
        }
      };
    }, []);

    // Update scene when grid changes from external source
    useEffect(() => {
      if (sceneRef.current) {
        sceneRef.current.updateGrid(grid);
      }
    }, [grid]);

    return (
      <div
        ref={containerRef}
        className="absolute inset-0"
        onContextMenu={(e) => e.preventDefault()}
      />
    );
  }
);

PhaserGame.displayName = "PhaserGame";
