import React from "react";
import type { ServiceStats, ServiceCoverage } from "@/game/systems/ServiceCoverageSystem";

interface ServicePanelProps {
  serviceStats: ServiceStats;
}

/**
 * Fallout-style terminal service coverage panel
 * Shows city services and their coverage with CRT phosphor aesthetic
 */
export function ServicePanel({ serviceStats }: ServicePanelProps) {
  // Format percentage
  const formatPercent = (value: number): string => {
    return `${Math.floor(value)}%`;
  };

  // Get status color based on coverage percentage
  const getCoverageColor = (coverage: number): string => {
    if (coverage >= 80) return "hsl(120 80% 55%)"; // Green - Excellent
    if (coverage >= 60) return "hsl(45 80% 55%)"; // Yellow - Good
    if (coverage >= 40) return "hsl(30 80% 55%)"; // Orange - Fair
    return "hsl(0 80% 55%)"; // Red - Poor
  };

  // Get status label
  const getCoverageLabel = (coverage: number): string => {
    if (coverage >= 80) return "EXCELLENT";
    if (coverage >= 60) return "GOOD";
    if (coverage >= 40) return "FAIR";
    if (coverage > 0) return "POOR";
    return "NONE";
  };

  // Service configurations
  const services = [
    {
      name: "MILITIA",
      icon: "🗼",
      count: serviceStats.totalPoliceStations,
      coverage: serviceStats.averageCoverage.police,
      description: "Security & Crime Prevention",
    },
    {
      name: "FIRE BRIGADE",
      icon: "🔥",
      count: serviceStats.totalFireStations,
      coverage: serviceStats.averageCoverage.fire,
      description: "Fire Protection & Response",
    },
    {
      name: "MEDICS",
      icon: "🏥",
      count: serviceStats.totalHealthFacilities,
      coverage: serviceStats.averageCoverage.health,
      description: "Healthcare & Treatment",
    },
    {
      name: "EDUCATION",
      icon: "📚",
      count: serviceStats.totalSchools,
      coverage: serviceStats.averageCoverage.education,
      description: "Learning & Skills",
    },
    {
      name: "RECREATION",
      icon: "🌳",
      count: serviceStats.totalParks,
      coverage: serviceStats.averageCoverage.landValue,
      description: "Parks & Green Spaces",
    },
  ];

  // Calculate overall coverage
  const totalServices =
    serviceStats.totalPoliceStations +
    serviceStats.totalFireStations +
    serviceStats.totalHealthFacilities +
    serviceStats.totalSchools +
    serviceStats.totalParks;

  const overallCoverage =
    (serviceStats.averageCoverage.police +
      serviceStats.averageCoverage.fire +
      serviceStats.averageCoverage.health +
      serviceStats.averageCoverage.education) /
    4;

  const coverageRatio =
    serviceStats.coveredTiles + serviceStats.uncoveredTiles > 0
      ? (serviceStats.coveredTiles /
          (serviceStats.coveredTiles + serviceStats.uncoveredTiles)) *
        100
      : 0;

  return (
    <div
      className="absolute left-4 top-16 w-72 z-30"
      style={{
        background:
          "linear-gradient(180deg, hsl(120 15% 8%) 0%, hsl(120 10% 5%) 100%)",
        border: "2px solid",
        borderColor:
          "hsl(120 35% 22%) hsl(120 20% 10%) hsl(120 20% 10%) hsl(120 35% 22%)",
        boxShadow: `
          0 0 20px hsl(120 100% 50% / 0.1),
          inset 0 0 30px hsl(120 100% 50% / 0.02),
          0 4px 12px rgba(0, 0, 0, 0.4)
        `,
        maxHeight: "calc(100vh - 8rem)",
        overflowY: "auto",
      }}
    >
      {/* Header */}
      <div
        className="px-3 py-2 flex items-center justify-between"
        style={{
          background:
            "linear-gradient(90deg, hsl(120 18% 10%) 0%, hsl(120 22% 13%) 50%, hsl(120 18% 10%) 100%)",
          borderBottom: "1px solid hsl(120 30% 18%)",
        }}
      >
        <h3
          className="text-xs font-bold uppercase tracking-widest"
          style={{
            color: "hsl(120 100% 65%)",
            textShadow: "0 0 8px hsl(120 100% 50% / 0.5)",
          }}
        >
          SERVICE COVERAGE
        </h3>
        <div
          className="w-2 h-2 rounded-full animate-pulse"
          style={{
            background: "hsl(120 100% 55%)",
            boxShadow: "0 0 6px hsl(120 100% 50% / 0.6)",
          }}
        />
      </div>

      {/* Overall Status */}
      <div className="p-3 border-b" style={{ borderColor: "hsl(120 20% 15%)" }}>
        <div
          className="p-3"
          style={{
            background: "hsl(120 8% 4%)",
            border: "1px solid hsl(120 20% 15%)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span
                style={{
                  color: "hsl(120 80% 55%)",
                  textShadow: "0 0 6px hsl(120 80% 55%)",
                  fontSize: "16px",
                }}
              >
                ⚡
              </span>
              <span
                className="text-xs font-bold tracking-wider"
                style={{ color: "hsl(120 60% 55%)" }}
              >
                OVERALL
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="text-[9px] uppercase"
                style={{ color: getCoverageColor(overallCoverage) }}
              >
                {getCoverageLabel(overallCoverage)}
              </span>
              <span
                className="text-sm font-mono font-bold"
                style={{
                  color: getCoverageColor(overallCoverage),
                  textShadow: `0 0 6px ${getCoverageColor(overallCoverage)}`,
                }}
              >
                {formatPercent(overallCoverage)}
              </span>
            </div>
          </div>

          {/* Coverage bar */}
          <div
            className="relative h-2 overflow-hidden mb-2"
            style={{
              background: "hsl(120 10% 6%)",
              border: "1px solid hsl(120 20% 12%)",
            }}
          >
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${Math.min(overallCoverage, 100)}%`,
                background: `linear-gradient(90deg, ${getCoverageColor(
                  overallCoverage
                )} 0%, ${getCoverageColor(overallCoverage)} 100%)`,
                boxShadow: `0 0 8px ${getCoverageColor(overallCoverage)}`,
              }}
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div>
              <span style={{ color: "hsl(120 40% 40%)" }}>Total Services</span>
              <div
                className="font-mono font-bold"
                style={{
                  color: "hsl(120 80% 55%)",
                  textShadow: "0 0 6px hsl(120 80% 55%)",
                }}
              >
                {totalServices}
              </div>
            </div>
            <div>
              <span style={{ color: "hsl(120 40% 40%)" }}>Area Coverage</span>
              <div
                className="font-mono font-bold"
                style={{
                  color: getCoverageColor(coverageRatio),
                  textShadow: `0 0 6px ${getCoverageColor(coverageRatio)}`,
                }}
              >
                {formatPercent(coverageRatio)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Individual Services */}
      <div className="p-3 space-y-2">
        {services.map((service) => (
          <div
            key={service.name}
            className="p-2"
            style={{
              background: "hsl(120 8% 4%)",
              border: "1px solid hsl(120 20% 15%)",
            }}
          >
            {/* Service header */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span
                  style={{
                    fontSize: "14px",
                    filter: `drop-shadow(0 0 4px ${getCoverageColor(
                      service.coverage
                    )})`,
                  }}
                >
                  {service.icon}
                </span>
                <div>
                  <div
                    className="text-[10px] font-bold tracking-wider"
                    style={{ color: "hsl(120 60% 55%)" }}
                  >
                    {service.name}
                  </div>
                  <div
                    className="text-[8px]"
                    style={{ color: "hsl(120 30% 35%)" }}
                  >
                    {service.description}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div
                  className="text-[9px] uppercase mb-0.5"
                  style={{ color: getCoverageColor(service.coverage) }}
                >
                  {getCoverageLabel(service.coverage)}
                </div>
                <div
                  className="text-xs font-mono font-bold"
                  style={{
                    color: getCoverageColor(service.coverage),
                    textShadow: `0 0 6px ${getCoverageColor(service.coverage)}`,
                  }}
                >
                  {formatPercent(service.coverage)}
                </div>
              </div>
            </div>

            {/* Coverage bar */}
            <div
              className="relative h-1.5 overflow-hidden mb-1"
              style={{
                background: "hsl(120 10% 6%)",
                border: "1px solid hsl(120 20% 12%)",
              }}
            >
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${Math.min(service.coverage, 100)}%`,
                  background: `linear-gradient(90deg, ${getCoverageColor(
                    service.coverage
                  )} 0%, ${getCoverageColor(service.coverage)} 100%)`,
                  boxShadow: `0 0 8px ${getCoverageColor(service.coverage)}`,
                }}
              />
            </div>

            {/* Building count */}
            <div className="flex justify-between items-center text-[9px]">
              <span style={{ color: "hsl(120 30% 35%)" }}>Buildings</span>
              <span
                className="font-mono font-bold"
                style={{
                  color: "hsl(120 60% 55%)",
                  textShadow: "0 0 4px hsl(120 60% 55%)",
                }}
              >
                {service.count}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        className="px-3 py-1.5 text-center"
        style={{
          borderTop: "1px solid hsl(120 20% 15%)",
          background: "hsl(120 8% 4%)",
        }}
      >
        <span
          className="text-[9px] uppercase tracking-widest"
          style={{ color: "hsl(120 40% 35%)" }}
        >
          WASTELAND SERVICE MONITOR v2.0
        </span>
      </div>
    </div>
  );
}
