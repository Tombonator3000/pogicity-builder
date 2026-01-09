import { useState } from "react";
import { cn } from "@/lib/utils";
import { getBuildingsByCategory, BUILDINGS } from "@/game/buildings";
import { BuildingCategory, BuildingDefinition } from "@/game/types";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BuildingPanelProps {
  isOpen: boolean;
  selectedBuildingId: string | null;
  onSelectBuilding: (building: BuildingDefinition) => void;
  onClose: () => void;
}

const CATEGORIES: { id: BuildingCategory; label: string; icon: string }[] = [
  { id: "residential", label: "Shelter", icon: "🏚️" },
  { id: "resource", label: "Production", icon: "⚙️" },
  { id: "infrastructure", label: "Infrastructure", icon: "⚡" },
  { id: "defense", label: "Defense", icon: "🗼" },
  { id: "commercial", label: "Trade", icon: "🏪" },
  { id: "props", label: "Props", icon: "🌳" },
];

export function BuildingPanel({
  isOpen,
  selectedBuildingId,
  onSelectBuilding,
  onClose,
}: BuildingPanelProps) {
  const [activeCategory, setActiveCategory] = useState<BuildingCategory>("residential");
  const buildings = getBuildingsByCategory(activeCategory);

  if (!isOpen) return null;

  return (
    <div className="game-panel absolute left-4 top-20 w-72 z-30">
      {/* Category tabs */}
      <div className="flex border-b border-border overflow-x-auto">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn("category-tab flex-1 min-w-fit", activeCategory === cat.id && "active")}
          >
            <span className="mr-1">{cat.icon}</span>
            <span className="hidden sm:inline">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Building grid */}
      <ScrollArea className="h-64 scrollbar-game">
        <div className="building-grid">
          {buildings.map((building) => (
            <button
              key={building.id}
              onClick={() => onSelectBuilding(building)}
              className={cn(
                "building-item",
                selectedBuildingId === building.id && "selected"
              )}
            >
              <span className="building-item-icon">{building.icon}</span>
              <span className="building-item-name">{building.name}</span>

              {/* Cost display */}
              {building.cost && (
                <div className="flex flex-wrap gap-1 mt-1 text-[9px]">
                  {building.cost.scrap > 0 && (
                    <span className="text-gray-400">🔩{building.cost.scrap}</span>
                  )}
                  {building.cost.food > 0 && (
                    <span className="text-amber-500">🍖{building.cost.food}</span>
                  )}
                  {building.cost.water > 0 && (
                    <span className="text-blue-400">💧{building.cost.water}</span>
                  )}
                  {building.cost.power > 0 && (
                    <span className="text-yellow-400">⚡{building.cost.power}</span>
                  )}
                  {building.cost.medicine > 0 && (
                    <span className="text-red-400">💊{building.cost.medicine}</span>
                  )}
                  {building.cost.caps > 0 && (
                    <span className="text-green-400">💰{building.cost.caps}</span>
                  )}
                </div>
              )}

              {/* Production/Consumption indicators */}
              {(building.produces || building.consumes) && (
                <div className="text-[9px] text-muted-foreground mt-0.5">
                  {building.produces && <span className="text-green-400">+</span>}
                  {building.consumes && <span className="text-red-400">-</span>}
                </div>
              )}

              <span className="text-[10px] text-muted-foreground">
                {building.footprint.width}x{building.footprint.height}
              </span>
            </button>
          ))}
        </div>
      </ScrollArea>

      {/* Close button */}
      <div className="p-2 border-t border-border">
        <button
          onClick={onClose}
          className="w-full py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
