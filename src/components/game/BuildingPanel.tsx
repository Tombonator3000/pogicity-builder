import { useState } from "react";
import { cn } from "@/lib/utils";
import { getBuildingsByCategory } from "@/game/buildings";
import { BuildingCategory, BuildingDefinition } from "@/game/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from "lucide-react";

interface BuildingPanelProps {
  isOpen: boolean;
  selectedBuildingId: string | null;
  onSelectBuilding: (building: BuildingDefinition) => void;
  onClose: () => void;
}

const CATEGORIES: { id: BuildingCategory; label: string; icon: string }[] = [
  { id: "residential", label: "SHELTER", icon: "⌂" },
  { id: "resource", label: "PROD", icon: "⚙" },
  { id: "infrastructure", label: "INFRA", icon: "⚡" },
  { id: "defense", label: "DEF", icon: "⛊" },
  { id: "commercial", label: "TRADE", icon: "◈" },
  { id: "props", label: "MISC", icon: "✦" },
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
    <div 
      className="absolute left-4 top-32 w-72 z-30"
      style={{
        background: 'linear-gradient(180deg, hsl(120 15% 8%) 0%, hsl(120 10% 5%) 100%)',
        border: '2px solid',
        borderColor: 'hsl(120 35% 22%) hsl(120 20% 10%) hsl(120 20% 10%) hsl(120 35% 22%)',
        boxShadow: `
          0 0 25px hsl(120 100% 50% / 0.12),
          inset 0 0 40px hsl(120 100% 50% / 0.02),
          0 6px 16px rgba(0, 0, 0, 0.5)
        `
      }}
    >
      {/* Header */}
      <div 
        className="px-3 py-2 flex items-center justify-between"
        style={{
          background: 'linear-gradient(90deg, hsl(120 18% 10%) 0%, hsl(120 22% 13%) 50%, hsl(120 18% 10%) 100%)',
          borderBottom: '1px solid hsl(120 30% 18%)'
        }}
      >
        <h3 
          className="text-xs font-bold uppercase tracking-widest"
          style={{ 
            color: 'hsl(120 100% 65%)',
            textShadow: '0 0 8px hsl(120 100% 50% / 0.5)'
          }}
        >
          CONSTRUCTION MENU
        </h3>
        <button
          onClick={onClose}
          className="p-1 transition-all hover:scale-110"
          style={{ 
            color: 'hsl(120 60% 50%)',
            textShadow: '0 0 6px hsl(120 100% 50% / 0.4)'
          }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Category tabs */}
      <div 
        className="flex overflow-x-auto"
        style={{
          background: 'hsl(120 10% 6%)',
          borderBottom: '1px solid hsl(120 25% 16%)'
        }}
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              "flex-1 min-w-fit px-2 py-2 text-[10px] font-bold uppercase tracking-wider transition-all",
              "border-b-2 border-transparent"
            )}
            style={{
              color: activeCategory === cat.id ? 'hsl(120 100% 70%)' : 'hsl(120 40% 40%)',
              background: activeCategory === cat.id 
                ? 'linear-gradient(180deg, hsl(120 20% 12%) 0%, transparent 100%)' 
                : 'transparent',
              borderBottomColor: activeCategory === cat.id ? 'hsl(120 100% 50%)' : 'transparent',
              textShadow: activeCategory === cat.id ? '0 0 8px hsl(120 100% 50% / 0.6)' : 'none'
            }}
          >
            <span className="mr-1">{cat.icon}</span>
            <span className="hidden sm:inline">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Building grid */}
      <ScrollArea className="h-64 scrollbar-game">
        <div className="grid grid-cols-3 gap-2 p-3">
          {buildings.map((building) => (
            <button
              key={building.id}
              onClick={() => onSelectBuilding(building)}
              className="flex flex-col items-center gap-1 p-2 transition-all"
              style={{
                background: selectedBuildingId === building.id 
                  ? 'hsl(120 25% 12%)' 
                  : 'hsl(120 10% 6%)',
                border: '1px solid',
                borderColor: selectedBuildingId === building.id 
                  ? 'hsl(120 70% 45%)' 
                  : 'hsl(120 20% 15%)',
                boxShadow: selectedBuildingId === building.id 
                  ? '0 0 12px hsl(120 100% 50% / 0.25), inset 0 0 8px hsl(120 100% 50% / 0.08)' 
                  : 'none'
              }}
            >
              <span 
                className="text-2xl"
                style={{ 
                  filter: `drop-shadow(0 0 4px hsl(120 100% 50% / 0.4))`,
                }}
              >
                {building.icon}
              </span>
              <span 
                className="text-[9px] text-center leading-tight uppercase tracking-wide"
                style={{ color: 'hsl(120 70% 55%)' }}
              >
                {building.name}
              </span>

              {/* Cost display */}
              {building.cost && (
                <div className="flex flex-wrap justify-center gap-1 mt-1">
                  {building.cost.scrap > 0 && (
                    <span className="text-[8px]" style={{ color: 'hsl(120 40% 50%)' }}>
                      ⚙{building.cost.scrap}
                    </span>
                  )}
                  {building.cost.food > 0 && (
                    <span className="text-[8px]" style={{ color: 'hsl(45 80% 55%)' }}>
                      ◈{building.cost.food}
                    </span>
                  )}
                  {building.cost.power > 0 && (
                    <span className="text-[8px]" style={{ color: 'hsl(50 100% 60%)' }}>
                      ⚡{building.cost.power}
                    </span>
                  )}
                  {building.cost.caps > 0 && (
                    <span className="text-[8px]" style={{ color: 'hsl(120 60% 55%)' }}>
                      ◎{building.cost.caps}
                    </span>
                  )}
                </div>
              )}

              {/* Size indicator */}
              <span 
                className="text-[8px] mt-0.5"
                style={{ color: 'hsl(120 30% 40%)' }}
              >
                [{building.footprint.width}x{building.footprint.height}]
              </span>
            </button>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div 
        className="px-3 py-1.5 text-center"
        style={{
          borderTop: '1px solid hsl(120 20% 15%)',
          background: 'hsl(120 8% 4%)'
        }}
      >
        <span 
          className="text-[9px] uppercase tracking-widest"
          style={{ color: 'hsl(120 40% 35%)' }}
        >
          SELECT STRUCTURE TO BUILD
        </span>
      </div>
    </div>
  );
}
