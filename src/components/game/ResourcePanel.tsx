import { Resources } from "@/game/types";
import { cn } from "@/lib/utils";

interface ResourcePanelProps {
  resources: Resources;
  capacity: Resources;
  netRate?: Partial<Resources>;
}

/**
 * Fallout-style terminal resource display panel
 * Shows current resources with CRT phosphor aesthetic
 */
export function ResourcePanel({ resources, capacity, netRate }: ResourcePanelProps) {
  const resourceConfigs = [
    { key: "scrap" as keyof Resources, icon: "⚙", label: "SCRAP", color: "hsl(120 40% 50%)" },
    { key: "food" as keyof Resources, icon: "◈", label: "FOOD", color: "hsl(45 80% 55%)" },
    { key: "water" as keyof Resources, icon: "◉", label: "WATER", color: "hsl(180 70% 50%)" },
    { key: "power" as keyof Resources, icon: "⚡", label: "POWER", color: "hsl(50 100% 60%)" },
    { key: "medicine" as keyof Resources, icon: "✚", label: "MEDS", color: "hsl(0 70% 55%)" },
    { key: "caps" as keyof Resources, icon: "◎", label: "CAPS", color: "hsl(120 60% 55%)" },
  ];

  /**
   * Gets color based on resource percentage
   */
  const getStatusColor = (current: number, max: number): string => {
    const percentage = (current / max) * 100;
    if (percentage < 20) return "hsl(0 80% 55%)";  // Critical - red
    if (percentage < 50) return "hsl(45 90% 55%)"; // Warning - amber
    return "hsl(120 80% 55%)"; // Good - green
  };

  /**
   * Formats resource value for display
   */
  const formatValue = (value: number): string => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return Math.floor(value).toString().padStart(3, ' ');
  };

  /**
   * Formats rate with + or - prefix
   */
  const formatRate = (rate: number): string => {
    const sign = rate >= 0 ? "+" : "";
    return `${sign}${rate.toFixed(1)}/s`;
  };

  /**
   * Gets rate color
   */
  const getRateColor = (rate: number): string => {
    if (rate > 0) return "hsl(120 80% 55%)";
    if (rate < 0) return "hsl(0 80% 55%)";
    return "hsl(120 30% 40%)";
  };

  return (
    <div 
      className="absolute right-4 top-16 w-56 z-30"
      style={{
        background: 'linear-gradient(180deg, hsl(120 15% 8%) 0%, hsl(120 10% 5%) 100%)',
        border: '2px solid',
        borderColor: 'hsl(120 35% 22%) hsl(120 20% 10%) hsl(120 20% 10%) hsl(120 35% 22%)',
        boxShadow: `
          0 0 20px hsl(120 100% 50% / 0.1),
          inset 0 0 30px hsl(120 100% 50% / 0.02),
          0 4px 12px rgba(0, 0, 0, 0.4)
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
          RESOURCES
        </h3>
        <div 
          className="w-2 h-2 rounded-full animate-pulse"
          style={{ 
            background: 'hsl(120 100% 55%)',
            boxShadow: '0 0 6px hsl(120 100% 50% / 0.6)'
          }}
        />
      </div>

      {/* Resource list */}
      <div className="p-2 space-y-1">
        {resourceConfigs.map(({ key, icon, label, color }) => {
          const current = resources[key];
          const max = capacity[key];
          const rate = netRate?.[key] ?? 0;
          const percentage = (current / max) * 100;
          const statusColor = getStatusColor(current, max);

          return (
            <div
              key={key}
              className="p-2 transition-colors"
              style={{
                background: 'hsl(120 8% 4%)',
                border: '1px solid hsl(120 20% 15%)'
              }}
            >
              {/* Icon, label and value row */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span 
                    className="text-sm"
                    style={{ 
                      color,
                      textShadow: `0 0 6px ${color}`,
                      filter: 'brightness(1.2)'
                    }}
                  >
                    {icon}
                  </span>
                  <span 
                    className="text-[10px] font-bold tracking-wider"
                    style={{ color: 'hsl(120 60% 55%)' }}
                  >
                    {label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span 
                    className="text-xs font-mono"
                    style={{ 
                      color: statusColor,
                      textShadow: `0 0 6px ${statusColor}`
                    }}
                  >
                    {formatValue(current)}/{formatValue(max)}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div 
                className="relative h-1.5 overflow-hidden"
                style={{
                  background: 'hsl(120 10% 6%)',
                  border: '1px solid hsl(120 20% 12%)'
                }}
              >
                <div 
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${Math.min(percentage, 100)}%`,
                    background: `linear-gradient(90deg, ${statusColor} 0%, ${statusColor} 100%)`,
                    boxShadow: `0 0 8px ${statusColor}`,
                    opacity: 0.9
                  }}
                />
              </div>

              {/* Rate indicator */}
              {rate !== 0 && (
                <div className="mt-1 text-right">
                  <span 
                    className="text-[9px] font-mono"
                    style={{ 
                      color: getRateColor(rate),
                      textShadow: `0 0 4px ${getRateColor(rate)}`
                    }}
                  >
                    {formatRate(rate)}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

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
          VAULT-TEC RESOURCE MONITOR
        </span>
      </div>
    </div>
  );
}
