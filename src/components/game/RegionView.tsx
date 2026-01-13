import { useState, useEffect } from "react";
import { RegionData, CitySlot, RegionConfig } from "@/game/types";
import { PhaserGameRef } from "@/game/PhaserGame";
import { X, Plus, MapPin, Users, Home, TrendingUp, Zap, Droplet } from "lucide-react";
import { toast } from "sonner";

interface RegionViewProps {
  gameRef: React.RefObject<PhaserGameRef>;
  onClose: () => void;
}

/**
 * RegionView - Region map UI showing all cities in the region
 *
 * Features:
 * - Grid view of all city slots
 * - Create new cities
 * - Switch between cities
 * - View city statistics
 */
export function RegionView({ gameRef, onClose }: RegionViewProps) {
  const [regionData, setRegionData] = useState<RegionData | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ x: number; y: number } | null>(null);

  // Load region data
  useEffect(() => {
    const loadData = () => {
      const scene = gameRef.current?.scene;
      if (!scene) return;

      const regionSystem = scene.getRegionSystem();
      if (!regionSystem) return;

      const data = regionSystem.getRegionData();
      setRegionData(data);
    };

    loadData();

    // Listen for region updates
    const scene = gameRef.current?.scene;
    if (scene) {
      scene.events.on("city:created", loadData);
      scene.events.on("city:switched", loadData);
      scene.events.on("region:statsUpdated", loadData);

      return () => {
        scene.events.off("city:created", loadData);
        scene.events.off("city:switched", loadData);
        scene.events.off("region:statsUpdated", loadData);
      };
    }
  }, [gameRef]);

  if (!regionData) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div
          className="w-[600px] p-6 text-center"
          style={{
            background: "linear-gradient(180deg, hsl(120 15% 8%) 0%, hsl(120 10% 5%) 100%)",
            border: "2px solid",
            borderColor: "hsl(120 35% 22%) hsl(120 20% 10%) hsl(120 20% 10%) hsl(120 35% 22%)",
            boxShadow: `
              0 0 30px hsl(120 100% 50% / 0.2),
              inset 0 0 40px hsl(120 100% 50% / 0.03),
              0 8px 16px rgba(0, 0, 0, 0.6)
            `,
          }}
        >
          <h2
            className="text-2xl font-bold mb-4 tracking-wider"
            style={{ color: "hsl(120 100% 70%)", textShadow: "0 0 10px hsl(120 100% 50% / 0.5)" }}
          >
            NO REGION FOUND
          </h2>
          <p style={{ color: "hsl(120 60% 50%)" }}>
            Create a new region to manage multiple cities.
          </p>
          <button
            onClick={onClose}
            className="mt-6 px-6 py-2 font-bold tracking-wider"
            style={{
              background: "hsl(120 20% 12%)",
              border: "2px solid hsl(120 40% 30%)",
              color: "hsl(120 100% 70%)",
              boxShadow: "0 0 10px hsl(120 100% 50% / 0.2)",
            }}
          >
            CLOSE
          </button>
        </div>
      </div>
    );
  }

  const config = regionData.config;
  const cities = regionData.cities;
  const activeCity = cities.find((c) => c.isActive);

  // Get city at grid position
  const getCityAt = (x: number, y: number): CitySlot | undefined => {
    return cities.find((c) => c.gridX === x && c.gridY === y);
  };

  // Handle city creation
  const handleCreateCity = (x: number, y: number) => {
    const scene = gameRef.current?.scene;
    if (!scene) return;

    const regionSystem = scene.getRegionSystem();
    if (!regionSystem) return;

    const name = prompt(`Enter name for new city at (${x}, ${y}):`);
    if (!name) return;

    try {
      regionSystem.createCity({
        name,
        gridX: x,
        gridY: y,
      });
      toast.success(`Created city: ${name}`);
      setSelectedSlot(null);
    } catch (error: any) {
      toast.error("Failed to create city", {
        description: error.message,
      });
    }
  };

  // Handle city switch
  const handleSwitchCity = (cityId: string) => {
    const scene = gameRef.current?.scene;
    if (!scene) return;

    const regionSystem = scene.getRegionSystem();
    if (!regionSystem) return;

    const city = regionSystem.switchCity(cityId);
    if (city) {
      toast.success(`Switched to ${city.name}`);
      onClose(); // Close region view after switching
    } else {
      toast.error("Failed to switch city");
    }
  };

  // Format numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div
        className="w-[900px] max-h-[90vh] overflow-y-auto"
        style={{
          background: "linear-gradient(180deg, hsl(120 15% 8%) 0%, hsl(120 10% 5%) 100%)",
          border: "2px solid",
          borderColor: "hsl(120 35% 22%) hsl(120 20% 10%) hsl(120 20% 10%) hsl(120 35% 22%)",
          boxShadow: `
            0 0 30px hsl(120 100% 50% / 0.2),
            inset 0 0 40px hsl(120 100% 50% / 0.03),
            0 8px 16px rgba(0, 0, 0, 0.6)
          `,
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between border-b-2"
          style={{
            borderColor: "hsl(120 30% 15%)",
            background: "hsl(120 15% 6%)",
          }}
        >
          <div>
            <h2
              className="text-2xl font-bold tracking-wider"
              style={{ color: "hsl(120 100% 70%)", textShadow: "0 0 10px hsl(120 100% 50% / 0.5)" }}
            >
              {config.name.toUpperCase()}
            </h2>
            <p className="text-sm mt-1" style={{ color: "hsl(120 60% 50%)" }}>
              {cities.length} / {config.maxCities} Cities Founded
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 transition-colors"
            style={{ color: "hsl(120 60% 50%)" }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Region Grid */}
        <div className="p-6">
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${config.gridWidth}, 1fr)`,
            }}
          >
            {Array.from({ length: config.gridHeight }).map((_, y) =>
              Array.from({ length: config.gridWidth }).map((_, x) => {
                const city = getCityAt(x, y);
                const isSelected = selectedSlot?.x === x && selectedSlot?.y === y;
                const isActive = city?.isActive;

                return (
                  <div
                    key={`${x}-${y}`}
                    className="aspect-square p-4 cursor-pointer transition-all"
                    style={{
                      background: city
                        ? isActive
                          ? "hsl(120 25% 15%)"
                          : "hsl(120 15% 10%)"
                        : isSelected
                        ? "hsl(120 15% 8%)"
                        : "hsl(120 10% 6%)",
                      border: "2px solid",
                      borderColor: isActive
                        ? "hsl(120 60% 40%)"
                        : city
                        ? "hsl(120 30% 20%)"
                        : isSelected
                        ? "hsl(120 40% 25%)"
                        : "hsl(120 20% 12%)",
                      boxShadow: isActive
                        ? "0 0 20px hsl(120 100% 50% / 0.3), inset 0 0 20px hsl(120 100% 50% / 0.05)"
                        : city
                        ? "0 0 10px hsl(120 100% 50% / 0.1)"
                        : "none",
                    }}
                    onClick={() => {
                      if (city) {
                        if (!isActive) {
                          handleSwitchCity(city.id);
                        }
                      } else {
                        setSelectedSlot({ x, y });
                      }
                    }}
                  >
                    {city ? (
                      <div className="h-full flex flex-col">
                        {/* City Header */}
                        <div className="flex items-center gap-2 mb-3">
                          <MapPin
                            size={16}
                            style={{
                              color: isActive ? "hsl(120 100% 70%)" : "hsl(120 60% 50%)",
                            }}
                          />
                          <h3
                            className="font-bold text-sm tracking-wide flex-1"
                            style={{
                              color: isActive ? "hsl(120 100% 70%)" : "hsl(120 80% 60%)",
                              textShadow: isActive ? "0 0 8px hsl(120 100% 50% / 0.4)" : "none",
                            }}
                          >
                            {city.name.toUpperCase()}
                          </h3>
                        </div>

                        {/* City Stats */}
                        <div className="flex-1 space-y-2 text-xs">
                          <div className="flex items-center gap-2">
                            <Users size={12} style={{ color: "hsl(180 60% 50%)" }} />
                            <span style={{ color: "hsl(120 60% 50%)" }}>
                              Pop: {formatNumber(city.currentState?.population || 0)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Home size={12} style={{ color: "hsl(45 70% 50%)" }} />
                            <span style={{ color: "hsl(120 60% 50%)" }}>
                              Buildings: {city.currentState?.buildingCount || 0}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <TrendingUp size={12} style={{ color: "hsl(120 70% 50%)" }} />
                            <span style={{ color: "hsl(120 60% 50%)" }}>
                              Budget: {formatNumber(city.currentState?.budget || 0)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Zap size={12} style={{ color: "hsl(50 100% 60%)" }} />
                            <Droplet size={12} style={{ color: "hsl(180 70% 50%)" }} />
                            <span style={{ color: "hsl(120 60% 50%)" }} className="text-[10px]">
                              {city.currentState?.powerProduction || 0}⚡ / {city.currentState?.waterProduction || 0}💧
                            </span>
                          </div>
                        </div>

                        {/* Active Badge */}
                        {isActive && (
                          <div
                            className="mt-2 text-center text-xs font-bold py-1"
                            style={{
                              background: "hsl(120 40% 20%)",
                              color: "hsl(120 100% 70%)",
                              border: "1px solid hsl(120 60% 35%)",
                              boxShadow: "0 0 10px hsl(120 100% 50% / 0.3)",
                            }}
                          >
                            ACTIVE
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center">
                        <Plus
                          size={32}
                          style={{ color: "hsl(120 40% 30%)", marginBottom: "8px" }}
                        />
                        <p className="text-xs text-center" style={{ color: "hsl(120 50% 40%)" }}>
                          Click to found new city
                        </p>
                        {isSelected && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCreateCity(x, y);
                            }}
                            className="mt-3 px-3 py-1 text-xs font-bold tracking-wide"
                            style={{
                              background: "hsl(120 25% 15%)",
                              border: "1px solid hsl(120 40% 30%)",
                              color: "hsl(120 100% 70%)",
                              boxShadow: "0 0 10px hsl(120 100% 50% / 0.2)",
                            }}
                          >
                            FOUND CITY
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Regional Stats */}
        {regionData.stats && (
          <div
            className="px-6 py-4 border-t-2"
            style={{
              borderColor: "hsl(120 30% 15%)",
              background: "hsl(120 15% 6%)",
            }}
          >
            <h3
              className="text-sm font-bold mb-3 tracking-wide"
              style={{ color: "hsl(120 100% 70%)" }}
            >
              REGIONAL STATISTICS
            </h3>
            <div className="grid grid-cols-4 gap-4 text-xs">
              <div>
                <p style={{ color: "hsl(120 50% 40%)" }}>Total Population</p>
                <p className="font-bold mt-1" style={{ color: "hsl(120 80% 60%)" }}>
                  {formatNumber(regionData.stats.totalPopulation)}
                </p>
              </div>
              <div>
                <p style={{ color: "hsl(120 50% 40%)" }}>Total Buildings</p>
                <p className="font-bold mt-1" style={{ color: "hsl(120 80% 60%)" }}>
                  {regionData.stats.totalBuildings}
                </p>
              </div>
              <div>
                <p style={{ color: "hsl(120 50% 40%)" }}>Avg Happiness</p>
                <p className="font-bold mt-1" style={{ color: "hsl(120 80% 60%)" }}>
                  {regionData.stats.averageHappiness.toFixed(0)}%
                </p>
              </div>
              <div>
                <p style={{ color: "hsl(120 50% 40%)" }}>Total Budget</p>
                <p className="font-bold mt-1" style={{ color: "hsl(120 80% 60%)" }}>
                  {formatNumber(regionData.stats.totalBudget)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
