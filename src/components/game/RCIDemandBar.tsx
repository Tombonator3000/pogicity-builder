import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Home, ShoppingBag, Factory } from "lucide-react";
import type { ZoneDemand } from "@/game/types";

interface RCIDemandBarProps {
  gameRef: any;
}

/**
 * RCIDemandBar - SimCity-style RCI demand indicator
 *
 * Displays demand for:
 * - Residential (R) - Housing demand
 * - Commercial (C) - Trading post demand
 * - Industrial (I) - Production facility demand
 *
 * Demand ranges from -100 (oversupply) to +100 (high demand)
 * Positive demand = Green bars (growth)
 * Negative demand = Red bars (decline)
 */
export function RCIDemandBar({ gameRef }: RCIDemandBarProps) {
  const [demand, setDemand] = useState<ZoneDemand>({
    residential: 0,
    commercial: 0,
    industrial: 0,
  });

  useEffect(() => {
    if (!gameRef?.current) return;

    // Poll demand every 2 seconds
    const interval = setInterval(() => {
      const scene = gameRef.current?.scene;
      if (scene?.getZoneDemand) {
        const newDemand = scene.getZoneDemand();
        setDemand(newDemand);
      }
    }, 2000);

    // Initial fetch
    const scene = gameRef.current?.scene;
    if (scene?.getZoneDemand) {
      const initialDemand = scene.getZoneDemand();
      setDemand(initialDemand);
    }

    return () => clearInterval(interval);
  }, [gameRef]);

  const renderDemandBar = (
    label: string,
    value: number,
    icon: React.ReactNode,
    color: string
  ) => {
    const isPositive = value >= 0;
    const barHeight = Math.abs(value); // 0-100

    return (
      <div className="flex flex-col items-center gap-1 flex-1">
        {/* Label and Icon */}
        <div className="flex items-center gap-1">
          <div
            className="w-3 h-3 flex items-center justify-center"
            style={{ color }}
          >
            {icon}
          </div>
          <span
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color }}
          >
            {label}
          </span>
        </div>

        {/* Bar Container */}
        <div
          className="relative w-full h-20 flex flex-col justify-center"
          style={{
            background: "hsl(120 10% 8%)",
            border: "1px solid hsl(120 20% 15%)",
          }}
        >
          {/* Center line */}
          <div
            className="absolute left-0 right-0"
            style={{
              top: "50%",
              height: "1px",
              background: "hsl(120 30% 25%)",
              transform: "translateY(-50%)",
            }}
          />

          {/* Demand Bar */}
          {barHeight > 0 && (
            <div
              className="absolute left-0 right-0 mx-1 transition-all duration-500"
              style={{
                height: `${Math.min(barHeight, 100) / 2}%`,
                background: isPositive
                  ? `linear-gradient(180deg, hsl(120 70% 50%) 0%, hsl(120 50% 40%) 100%)`
                  : `linear-gradient(180deg, hsl(0 70% 50%) 0%, hsl(0 50% 40%) 100%)`,
                boxShadow: isPositive
                  ? "0 0 10px hsl(120 100% 50% / 0.4)"
                  : "0 0 10px hsl(0 100% 50% / 0.4)",
                ...(isPositive
                  ? { bottom: "50%", transformOrigin: "bottom" }
                  : { top: "50%", transformOrigin: "top" }),
              }}
            />
          )}

          {/* Value Text */}
          <div
            className="absolute inset-0 flex items-center justify-center text-[10px] font-bold"
            style={{
              color: isPositive ? "hsl(120 70% 60%)" : "hsl(0 70% 60%)",
              textShadow: isPositive
                ? "0 0 6px hsl(120 100% 50% / 0.6)"
                : "0 0 6px hsl(0 100% 50% / 0.6)",
            }}
          >
            {value > 0 ? `+${value}` : value}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 px-3 py-2"
      style={{
        background:
          "linear-gradient(180deg, hsl(120 15% 8%) 0%, hsl(120 10% 5%) 100%)",
        border: "2px solid",
        borderColor:
          "hsl(120 35% 22%) hsl(120 20% 10%) hsl(120 20% 10%) hsl(120 35% 22%)",
        boxShadow: `
          0 0 25px hsl(120 100% 50% / 0.12),
          inset 0 0 40px hsl(120 100% 50% / 0.02),
          0 6px 16px rgba(0, 0, 0, 0.5)
        `,
        width: "280px",
      }}
    >
      {/* Header */}
      <div className="text-center mb-2">
        <h3
          className="text-xs font-bold uppercase tracking-widest"
          style={{
            color: "hsl(120 100% 65%)",
            textShadow: "0 0 8px hsl(120 100% 50% / 0.5)",
          }}
        >
          ZONE DEMAND
        </h3>
        <p
          className="text-[8px] uppercase tracking-wide mt-0.5"
          style={{ color: "hsl(120 50% 45%)" }}
        >
          Growth Indicators
        </p>
      </div>

      {/* Demand Bars */}
      <div className="flex gap-2">
        {renderDemandBar(
          "R",
          demand.residential,
          <Home className="w-3 h-3" />,
          "hsl(210 70% 60%)"
        )}
        {renderDemandBar(
          "C",
          demand.commercial,
          <ShoppingBag className="w-3 h-3" />,
          "hsl(270 70% 60%)"
        )}
        {renderDemandBar(
          "I",
          demand.industrial,
          <Factory className="w-3 h-3" />,
          "hsl(45 80% 60%)"
        )}
      </div>

      {/* Legend */}
      <div className="mt-2 text-center">
        <div className="flex justify-center gap-3 text-[8px]">
          <span style={{ color: "hsl(120 60% 50%)" }}>
            + DEMAND
          </span>
          <span style={{ color: "hsl(0 60% 50%)" }}>
            - OVERSUPPLY
          </span>
        </div>
      </div>
    </div>
  );
}
