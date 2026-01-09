import { Resources } from "@/game/types";
import { cn } from "@/lib/utils";

interface ResourcePanelProps {
  resources: Resources;
  capacity: Resources;
  netRate?: Partial<Resources>;
}

/**
 * Resource display panel for post-apocalyptic economy
 * Shows current resources, capacity, and production/consumption rates
 */
export function ResourcePanel({ resources, capacity, netRate }: ResourcePanelProps) {
  const resourceConfigs = [
    { key: "scrap" as keyof Resources, icon: "🔩", label: "Scrap", color: "text-gray-400" },
    { key: "food" as keyof Resources, icon: "🍖", label: "Food", color: "text-amber-500" },
    { key: "water" as keyof Resources, icon: "💧", label: "Water", color: "text-blue-400" },
    { key: "power" as keyof Resources, icon: "⚡", label: "Power", color: "text-yellow-400" },
    { key: "medicine" as keyof Resources, icon: "💊", label: "Medicine", color: "text-red-400" },
    { key: "caps" as keyof Resources, icon: "💰", label: "Caps", color: "text-green-400" },
  ];

  /**
   * Gets color class based on resource percentage
   */
  const getResourceColor = (current: number, max: number): string => {
    const percentage = (current / max) * 100;
    if (percentage < 20) return "text-red-500";
    if (percentage < 50) return "text-orange-500";
    return "text-foreground";
  };

  /**
   * Formats resource value for display
   */
  const formatValue = (value: number): string => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return Math.floor(value).toString();
  };

  /**
   * Formats rate with + or - prefix
   */
  const formatRate = (rate: number): string => {
    const sign = rate >= 0 ? "+" : "";
    return `${sign}${rate.toFixed(1)}/s`;
  };

  /**
   * Gets rate color class
   */
  const getRateColor = (rate: number): string => {
    if (rate > 0) return "text-green-400";
    if (rate < 0) return "text-red-400";
    return "text-muted-foreground";
  };

  return (
    <div className="game-panel absolute right-4 top-4 w-64 z-30">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Resources</h3>
      </div>

      {/* Resource list */}
      <div className="p-2 space-y-1">
        {resourceConfigs.map(({ key, icon, label, color }) => {
          const current = resources[key];
          const max = capacity[key];
          const rate = netRate?.[key] ?? 0;
          const valueColor = getResourceColor(current, max);

          return (
            <div
              key={key}
              className="flex items-center justify-between p-2 rounded hover:bg-accent/50 transition-colors"
            >
              {/* Icon and label */}
              <div className="flex items-center gap-2 flex-1">
                <span className={cn("text-lg", color)}>{icon}</span>
                <span className="text-xs font-medium text-foreground">{label}</span>
              </div>

              {/* Value and rate */}
              <div className="flex flex-col items-end gap-0.5">
                <span className={cn("text-sm font-mono", valueColor)}>
                  {formatValue(current)}/{formatValue(max)}
                </span>
                {rate !== 0 && (
                  <span className={cn("text-[10px] font-mono", getRateColor(rate))}>
                    {formatRate(rate)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Storage bar visualization (optional, for future) */}
      <div className="px-3 py-2 border-t border-border text-[10px] text-muted-foreground">
        Post-Apocalyptic Economy
      </div>
    </div>
  );
}
