import React from "react";
import type { UtilityStats } from "@/game/systems/UtilitiesNetworkSystem";

interface UtilitiesPanelProps {
  utilityStats: UtilityStats;
}

/**
 * Fallout-style terminal utilities network panel
 * Shows power and water networks with CRT phosphor aesthetic
 */
export function UtilitiesPanel({ utilityStats }: UtilitiesPanelProps) {
  // Format numbers
  const formatNumber = (value: number): string => {
    return value.toLocaleString();
  };

  // Get status color based on supply/demand ratio
  const getSupplyColor = (output: number, demand: number): string => {
    if (demand === 0) return "hsl(120 80% 55%)"; // Green - No demand
    const ratio = output / demand;
    if (ratio >= 1.2) return "hsl(120 80% 55%)"; // Green - Surplus
    if (ratio >= 1.0) return "hsl(45 80% 55%)"; // Yellow - Balanced
    if (ratio >= 0.7) return "hsl(30 80% 55%)"; // Orange - Shortage
    return "hsl(0 80% 55%)"; // Red - Critical
  };

  // Get status label
  const getSupplyLabel = (output: number, demand: number): string => {
    if (demand === 0) return "NO DEMAND";
    const ratio = output / demand;
    if (ratio >= 1.2) return "SURPLUS";
    if (ratio >= 1.0) return "BALANCED";
    if (ratio >= 0.7) return "SHORTAGE";
    return "CRITICAL";
  };

  // Calculate connection percentages
  const totalBuildings =
    utilityStats.buildingsWithPower + utilityStats.buildingsWithoutPower;
  const powerConnectionRate =
    totalBuildings > 0
      ? (utilityStats.buildingsWithPower / totalBuildings) * 100
      : 100;

  const totalWaterBuildings =
    utilityStats.buildingsWithWater + utilityStats.buildingsWithoutWater;
  const waterConnectionRate =
    totalWaterBuildings > 0
      ? (utilityStats.buildingsWithWater / totalWaterBuildings) * 100
      : 100;

  // Power supply ratio
  const powerSupplyRatio =
    utilityStats.totalPowerDemand > 0
      ? utilityStats.totalPowerOutput / utilityStats.totalPowerDemand
      : 1;

  // Water supply ratio
  const waterSupplyRatio =
    utilityStats.totalWaterDemand > 0
      ? utilityStats.totalWaterOutput / utilityStats.totalWaterDemand
      : 1;

  return (
    <div
      className="absolute left-4 top-16 w-80 z-30"
      style={{
        background:
          "linear-gradient(180deg, rgba(0,20,0,0.95) 0%, rgba(0,40,10,0.95) 100%)",
        border: "2px solid hsl(120 80% 55%)",
        boxShadow: `
          0 0 20px rgba(0, 255, 0, 0.3),
          inset 0 0 40px rgba(0, 255, 0, 0.05)
        `,
        fontFamily: "Courier New, monospace",
        color: "hsl(120 80% 55%)",
        textShadow: "0 0 5px rgba(0, 255, 0, 0.8)",
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 text-center border-b-2 font-bold text-lg tracking-wider"
        style={{ borderColor: "hsl(120 80% 55%)" }}
      >
        ⚡ UTILITIES NETWORK ⚡
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
        {/* Power Network Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold border-b border-green-500/30 pb-1">
            <span>⚡</span>
            <span>POWER NETWORK</span>
          </div>

          {/* Power Supply Status */}
          <div className="pl-4 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="opacity-70">Status:</span>
              <span
                style={{
                  color: getSupplyColor(
                    utilityStats.totalPowerOutput,
                    utilityStats.totalPowerDemand
                  ),
                  fontWeight: "bold",
                }}
              >
                {getSupplyLabel(
                  utilityStats.totalPowerOutput,
                  utilityStats.totalPowerDemand
                )}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="opacity-70">Production:</span>
              <span>{formatNumber(utilityStats.totalPowerOutput)} MW</span>
            </div>

            <div className="flex justify-between">
              <span className="opacity-70">Demand:</span>
              <span>{formatNumber(utilityStats.totalPowerDemand)} MW</span>
            </div>

            <div className="flex justify-between">
              <span className="opacity-70">Surplus/Deficit:</span>
              <span
                style={{
                  color:
                    utilityStats.totalPowerOutput >=
                    utilityStats.totalPowerDemand
                      ? "hsl(120 80% 55%)"
                      : "hsl(0 80% 55%)",
                }}
              >
                {utilityStats.totalPowerOutput >= utilityStats.totalPowerDemand
                  ? "+"
                  : ""}
                {formatNumber(
                  utilityStats.totalPowerOutput - utilityStats.totalPowerDemand
                )}{" "}
                MW
              </span>
            </div>

            {/* Progress bar */}
            <div className="mt-2">
              <div className="h-2 bg-black/50 border border-green-500/30 relative overflow-hidden">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${Math.min(powerSupplyRatio * 100, 100)}%`,
                    background:
                      powerSupplyRatio >= 1
                        ? "hsl(120 80% 55%)"
                        : powerSupplyRatio >= 0.7
                        ? "hsl(30 80% 55%)"
                        : "hsl(0 80% 55%)",
                    boxShadow:
                      powerSupplyRatio >= 1
                        ? "0 0 10px rgba(0, 255, 0, 0.5)"
                        : "0 0 10px rgba(255, 100, 0, 0.5)",
                  }}
                />
              </div>
            </div>

            {/* Infrastructure */}
            <div className="mt-2 pt-2 border-t border-green-500/20">
              <div className="flex justify-between">
                <span className="opacity-70">Networks:</span>
                <span>{utilityStats.powerNetworks}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">Power Lines:</span>
                <span>{formatNumber(utilityStats.totalPowerLines)}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">Power Poles:</span>
                <span>{formatNumber(utilityStats.totalPowerPoles)}</span>
              </div>
            </div>

            {/* Connections */}
            <div className="mt-2 pt-2 border-t border-green-500/20">
              <div className="flex justify-between">
                <span className="opacity-70">Connected Buildings:</span>
                <span
                  style={{ color: "hsl(120 80% 55%)", fontWeight: "bold" }}
                >
                  {utilityStats.buildingsWithPower}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">Disconnected Buildings:</span>
                <span
                  style={{
                    color:
                      utilityStats.buildingsWithoutPower > 0
                        ? "hsl(0 80% 55%)"
                        : "hsl(120 80% 55%)",
                    fontWeight: "bold",
                  }}
                >
                  {utilityStats.buildingsWithoutPower}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">Connection Rate:</span>
                <span>{Math.floor(powerConnectionRate)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Water Network Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold border-b border-green-500/30 pb-1">
            <span>💧</span>
            <span>WATER NETWORK</span>
          </div>

          {/* Water Supply Status */}
          <div className="pl-4 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="opacity-70">Status:</span>
              <span
                style={{
                  color: getSupplyColor(
                    utilityStats.totalWaterOutput,
                    utilityStats.totalWaterDemand
                  ),
                  fontWeight: "bold",
                }}
              >
                {getSupplyLabel(
                  utilityStats.totalWaterOutput,
                  utilityStats.totalWaterDemand
                )}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="opacity-70">Production:</span>
              <span>{formatNumber(utilityStats.totalWaterOutput)} L/day</span>
            </div>

            <div className="flex justify-between">
              <span className="opacity-70">Demand:</span>
              <span>{formatNumber(utilityStats.totalWaterDemand)} L/day</span>
            </div>

            <div className="flex justify-between">
              <span className="opacity-70">Surplus/Deficit:</span>
              <span
                style={{
                  color:
                    utilityStats.totalWaterOutput >=
                    utilityStats.totalWaterDemand
                      ? "hsl(120 80% 55%)"
                      : "hsl(0 80% 55%)",
                }}
              >
                {utilityStats.totalWaterOutput >=
                utilityStats.totalWaterDemand
                  ? "+"
                  : ""}
                {formatNumber(
                  utilityStats.totalWaterOutput - utilityStats.totalWaterDemand
                )}{" "}
                L/day
              </span>
            </div>

            {/* Progress bar */}
            <div className="mt-2">
              <div className="h-2 bg-black/50 border border-green-500/30 relative overflow-hidden">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${Math.min(waterSupplyRatio * 100, 100)}%`,
                    background:
                      waterSupplyRatio >= 1
                        ? "hsl(190 80% 55%)"
                        : waterSupplyRatio >= 0.7
                        ? "hsl(30 80% 55%)"
                        : "hsl(0 80% 55%)",
                    boxShadow:
                      waterSupplyRatio >= 1
                        ? "0 0 10px rgba(0, 200, 255, 0.5)"
                        : "0 0 10px rgba(255, 100, 0, 0.5)",
                  }}
                />
              </div>
            </div>

            {/* Infrastructure */}
            <div className="mt-2 pt-2 border-t border-green-500/20">
              <div className="flex justify-between">
                <span className="opacity-70">Networks:</span>
                <span>{utilityStats.waterNetworks}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">Water Pipes:</span>
                <span>{formatNumber(utilityStats.totalWaterPipes)}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">Water Towers:</span>
                <span>{formatNumber(utilityStats.totalWaterTowers)}</span>
              </div>
            </div>

            {/* Connections */}
            <div className="mt-2 pt-2 border-t border-green-500/20">
              <div className="flex justify-between">
                <span className="opacity-70">Connected Buildings:</span>
                <span
                  style={{ color: "hsl(190 80% 55%)", fontWeight: "bold" }}
                >
                  {utilityStats.buildingsWithWater}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">Disconnected Buildings:</span>
                <span
                  style={{
                    color:
                      utilityStats.buildingsWithoutWater > 0
                        ? "hsl(0 80% 55%)"
                        : "hsl(120 80% 55%)",
                    fontWeight: "bold",
                  }}
                >
                  {utilityStats.buildingsWithoutWater}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">Connection Rate:</span>
                <span>{Math.floor(waterConnectionRate)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Infrastructure Costs */}
        <div className="space-y-2 pt-2 border-t-2 border-green-500/30">
          <div className="text-sm font-bold">💰 INFRASTRUCTURE COSTS</div>
          <div className="pl-4 space-y-1 text-xs">
            <div className="flex justify-between opacity-70">
              <span>Power Line:</span>
              <span>2 Scrap</span>
            </div>
            <div className="flex justify-between opacity-70">
              <span>Water Pipe:</span>
              <span>3 Scrap</span>
            </div>
            <div className="flex justify-between opacity-70">
              <span>Power Pole:</span>
              <span>10 Scrap, 5 Caps</span>
            </div>
            <div className="flex justify-between opacity-70">
              <span>Water Tower:</span>
              <span>15 Scrap, 10 Caps</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-2 pt-2 border-t-2 border-green-500/30">
          <div className="text-xs opacity-60 italic">
            Connect buildings to power/water sources using lines and pipes.
            Power poles and water towers extend network reach.
          </div>
        </div>
      </div>

      {/* Scanline effect */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 0, 0.1) 2px, rgba(0, 255, 0, 0.1) 4px)",
        }}
      />
    </div>
  );
}
