import { useState, useEffect } from "react";
import {
  RegionData,
  CitySlot,
  RegionalProject,
  RegionalProjectStatus,
  RegionalProjectType,
  ResourceCost,
} from "@/game/types";
import { PhaserGameRef } from "@/game/PhaserGame";
import { X, Landmark, Plus, DollarSign, TrendingUp, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";

interface RegionalProjectsPanelProps {
  gameRef: React.RefObject<PhaserGameRef>;
  onClose: () => void;
}

/**
 * RegionalProjectsPanel - UI for regional infrastructure projects
 *
 * Features:
 * - View available regional projects
 * - View active projects and contributions
 * - Propose new projects
 * - Contribute resources to projects
 * - Track project completion progress
 */
export function RegionalProjectsPanel({ gameRef, onClose }: RegionalProjectsPanelProps) {
  const [regionData, setRegionData] = useState<RegionData | null>(null);
  const [activeCity, setActiveCity] = useState<CitySlot | null>(null);
  const [selectedTab, setSelectedTab] = useState<"active" | "available" | "completed">("active");
  const [contributeAmount, setContributeAmount] = useState<Record<string, number>>({});

  // Load data
  useEffect(() => {
    const loadData = () => {
      const scene = gameRef.current?.scene;
      if (!scene) return;

      const regionSystem = scene.getRegionSystem();
      if (!regionSystem) return;

      const data = regionSystem.getRegionData();
      const city = regionSystem.getActiveCity();
      setRegionData(data);
      setActiveCity(city);
    };

    loadData();

    // Listen for project updates
    const scene = gameRef.current?.scene;
    if (scene) {
      scene.events.on("project:proposed", loadData);
      scene.events.on("project:contribution", loadData);
      scene.events.on("project:completed", loadData);

      return () => {
        scene.events.off("project:proposed", loadData);
        scene.events.off("project:contribution", loadData);
        scene.events.off("project:completed", loadData);
      };
    }
  }, [gameRef]);

  if (!regionData || !activeCity) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div
          className="w-[500px] p-6 text-center"
          style={{
            background: "linear-gradient(180deg, hsl(120 15% 8%) 0%, hsl(120 10% 5%) 100%)",
            border: "2px solid hsl(120 35% 22%)",
            boxShadow: "0 0 30px hsl(120 100% 50% / 0.2)",
          }}
        >
          <p style={{ color: "hsl(120 60% 50%)" }}>No active city or region found.</p>
          <button onClick={onClose} className="mt-4 px-4 py-2" style={{ color: "hsl(120 100% 70%)" }}>
            Close
          </button>
        </div>
      </div>
    );
  }

  const projects = regionData.projects || [];
  const activeProjects = projects.filter((p) => p.status === RegionalProjectStatus.Active);
  const availableProjects = projects.filter((p) => p.status === RegionalProjectStatus.Available);
  const completedProjects = projects.filter((p) => p.status === RegionalProjectStatus.Completed);

  // Get project icon
  const getProjectIcon = (type: RegionalProjectType): JSX.Element => {
    const icons: Record<RegionalProjectType, JSX.Element> = {
      [RegionalProjectType.RegionalAirport]: <span>✈️</span>,
      [RegionalProjectType.RegionalPowerGrid]: <span>⚡</span>,
      [RegionalProjectType.RegionalWaterSystem]: <span>💧</span>,
      [RegionalProjectType.RegionalHighway]: <span>🛣️</span>,
      [RegionalProjectType.RegionalUniversity]: <span>🎓</span>,
      [RegionalProjectType.RegionalHospital]: <span>🏥</span>,
      [RegionalProjectType.RegionalRecyclingCenter]: <span>♻️</span>,
      [RegionalProjectType.RegionalDefenseGrid]: <span>🛡️</span>,
    };
    return icons[type] || <Landmark size={20} />;
  };

  // Get project tier color
  const getTierColor = (tier: string): string => {
    const colors: Record<string, string> = {
      early: "hsl(120 60% 50%)",
      mid: "hsl(45 80% 55%)",
      late: "hsl(0 70% 55%)",
    };
    return colors[tier] || "hsl(120 60% 50%)";
  };

  // Format cost
  const formatCost = (cost: ResourceCost): string => {
    const parts: string[] = [];
    if (cost.scrap) parts.push(`${cost.scrap} Scrap`);
    if (cost.food) parts.push(`${cost.food} Food`);
    if (cost.water) parts.push(`${cost.water} Water`);
    if (cost.caps) parts.push(`${cost.caps} Caps`);
    if (cost.medicine) parts.push(`${cost.medicine} Medicine`);
    return parts.join(", ");
  };

  // Format number
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Handle propose project
  const handleProposeProject = () => {
    const scene = gameRef.current?.scene;
    if (!scene) return;

    const regionSystem = scene.getRegionSystem();
    if (!regionSystem) return;

    // Get available project types from regionalProjects.ts
    const availableTypes = Object.values(RegionalProjectType);
    const typeIndex = prompt(
      `Select project type:\n${availableTypes.map((t, i) => `${i}: ${t}`).join("\n")}`
    );

    if (typeIndex === null) return;

    const type = availableTypes[parseInt(typeIndex)];
    if (!type) {
      toast.error("Invalid project type");
      return;
    }

    try {
      regionSystem.proposeRegionalProject(type);
      toast.success("Project proposed!");
    } catch (error: any) {
      toast.error("Failed to propose project", {
        description: error.message,
      });
    }
  };

  // Handle contribute
  const handleContribute = (projectId: string) => {
    const scene = gameRef.current?.scene;
    if (!scene) return;

    const regionSystem = scene.getRegionSystem();
    if (!regionSystem) return;

    const amount = contributeAmount[projectId] || 0;
    if (amount <= 0) {
      toast.error("Enter a valid contribution amount");
      return;
    }

    try {
      regionSystem.contributeToProject(projectId, activeCity.id, amount);
      toast.success(`Contributed ${amount} caps to project!`);
      setContributeAmount({ ...contributeAmount, [projectId]: 0 });
    } catch (error: any) {
      toast.error("Failed to contribute", {
        description: error.message,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div
        className="w-[900px] max-h-[90vh] overflow-hidden flex flex-col"
        style={{
          background: "linear-gradient(180deg, hsl(120 15% 8%) 0%, hsl(120 10% 5%) 100%)",
          border: "2px solid",
          borderColor: "hsl(120 35% 22%) hsl(120 20% 10%) hsl(120 20% 10%) hsl(120 35% 22%)",
          boxShadow: "0 0 30px hsl(120 100% 50% / 0.2), inset 0 0 40px hsl(120 100% 50% / 0.03)",
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
          <div className="flex items-center gap-3">
            <Landmark size={24} style={{ color: "hsl(120 100% 70%)" }} />
            <div>
              <h2
                className="text-xl font-bold tracking-wider"
                style={{ color: "hsl(120 100% 70%)", textShadow: "0 0 10px hsl(120 100% 50% / 0.5)" }}
              >
                REGIONAL PROJECTS
              </h2>
              <p className="text-xs mt-1" style={{ color: "hsl(120 60% 50%)" }}>
                Large-scale infrastructure benefiting all cities
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5" style={{ color: "hsl(120 60% 50%)" }}>
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div
          className="flex border-b-2"
          style={{
            borderColor: "hsl(120 30% 15%)",
            background: "hsl(120 12% 7%)",
          }}
        >
          {[
            { id: "active" as const, label: "Active Projects", count: activeProjects.length },
            { id: "available" as const, label: "Available", count: availableProjects.length },
            { id: "completed" as const, label: "Completed", count: completedProjects.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className="px-6 py-3 text-sm font-bold tracking-wide transition-all"
              style={{
                background: selectedTab === tab.id ? "hsl(120 20% 12%)" : "transparent",
                color: selectedTab === tab.id ? "hsl(120 100% 70%)" : "hsl(120 50% 45%)",
                borderBottom: selectedTab === tab.id ? "2px solid hsl(120 60% 40%)" : "none",
                textShadow: selectedTab === tab.id ? "0 0 8px hsl(120 100% 50% / 0.3)" : "none",
              }}
            >
              {tab.label} {tab.count > 0 && `(${tab.count})`}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Active Projects Tab */}
          {selectedTab === "active" && (
            <div className="space-y-4">
              {activeProjects.length === 0 ? (
                <div className="text-center py-12" style={{ color: "hsl(120 50% 40%)" }}>
                  <Clock size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No active regional projects.</p>
                  <p className="text-xs mt-2">Propose a project to start building regional infrastructure.</p>
                  <button
                    onClick={handleProposeProject}
                    className="mt-6 px-6 py-2 font-bold tracking-wide flex items-center gap-2 mx-auto"
                    style={{
                      background: "hsl(120 25% 15%)",
                      border: "2px solid hsl(120 50% 35%)",
                      color: "hsl(120 100% 70%)",
                      boxShadow: "0 0 15px hsl(120 100% 50% / 0.2)",
                    }}
                  >
                    <Plus size={18} />
                    PROPOSE PROJECT
                  </button>
                </div>
              ) : (
                activeProjects.map((project) => {
                  const progress = (project.totalContributed / project.totalCost) * 100;
                  return (
                    <div
                      key={project.id}
                      className="p-5"
                      style={{
                        background: "hsl(120 15% 10%)",
                        border: "2px solid hsl(120 40% 25%)",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4), 0 0 20px hsl(120 100% 50% / 0.15)",
                      }}
                    >
                      {/* Project Header */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className="text-3xl">{getProjectIcon(project.type)}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold" style={{ color: "hsl(120 100% 70%)" }}>
                              {project.name.toUpperCase()}
                            </h3>
                            <span
                              className="px-2 py-1 text-[10px] font-bold"
                              style={{
                                background: "hsl(120 20% 12%)",
                                border: `1px solid ${getTierColor(project.tier)}`,
                                color: getTierColor(project.tier),
                              }}
                            >
                              {project.tier.toUpperCase()} GAME
                            </span>
                          </div>
                          <p className="text-sm mb-3" style={{ color: "hsl(120 60% 50%)" }}>
                            {project.description}
                          </p>

                          {/* Benefits */}
                          <div className="grid grid-cols-2 gap-2 mb-4">
                            {Object.entries(project.benefits).map(([key, value]) => (
                              <div
                                key={key}
                                className="px-3 py-2 text-xs"
                                style={{
                                  background: "hsl(120 12% 8%)",
                                  border: "1px solid hsl(120 25% 18%)",
                                }}
                              >
                                <TrendingUp
                                  size={12}
                                  className="inline mr-2"
                                  style={{ color: "hsl(120 70% 50%)" }}
                                />
                                <span style={{ color: "hsl(120 70% 55%)" }}>
                                  {key}: +{typeof value === "number" ? `${value}%` : value}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs mb-2" style={{ color: "hsl(120 60% 50%)" }}>
                          <span>Progress: {progress.toFixed(1)}%</span>
                          <span>
                            {formatNumber(project.totalContributed)} / {formatNumber(project.totalCost)} caps
                          </span>
                        </div>
                        <div
                          className="h-3 relative overflow-hidden"
                          style={{
                            background: "hsl(120 20% 8%)",
                            border: "1px solid hsl(120 30% 15%)",
                          }}
                        >
                          <div
                            className="h-full transition-all"
                            style={{
                              width: `${progress}%`,
                              background: `linear-gradient(90deg, hsl(120 50% 35%), hsl(120 70% 45%))`,
                              boxShadow: "0 0 10px hsl(120 100% 50% / 0.5)",
                            }}
                          />
                        </div>
                      </div>

                      {/* Contribution Controls */}
                      <div className="flex gap-3">
                        <input
                          type="number"
                          value={contributeAmount[project.id] || ""}
                          onChange={(e) =>
                            setContributeAmount({
                              ...contributeAmount,
                              [project.id]: Number(e.target.value),
                            })
                          }
                          placeholder="Amount..."
                          min="1"
                          step="100"
                          className="flex-1 px-3 py-2 font-mono text-sm"
                          style={{
                            background: "hsl(120 15% 10%)",
                            border: "1px solid hsl(120 30% 20%)",
                            color: "hsl(120 80% 60%)",
                          }}
                        />
                        <button
                          onClick={() => handleContribute(project.id)}
                          className="px-6 py-2 font-bold text-sm tracking-wide flex items-center gap-2"
                          style={{
                            background: "hsl(120 30% 15%)",
                            border: "1px solid hsl(120 50% 35%)",
                            color: "hsl(120 100% 70%)",
                            boxShadow: "0 0 10px hsl(120 100% 50% / 0.2)",
                          }}
                        >
                          <DollarSign size={16} />
                          CONTRIBUTE
                        </button>
                      </div>

                      {/* Contributors */}
                      {project.contributors.length > 0 && (
                        <div className="mt-4 pt-4 border-t" style={{ borderColor: "hsl(120 25% 15%)" }}>
                          <p className="text-xs mb-2" style={{ color: "hsl(120 50% 40%)" }}>
                            Contributors:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {project.contributors.map((contrib) => {
                              const city = regionData.cities.find((c) => c.id === contrib.cityId);
                              return (
                                <div
                                  key={contrib.cityId}
                                  className="px-2 py-1 text-xs"
                                  style={{
                                    background: "hsl(120 12% 8%)",
                                    border: "1px solid hsl(120 25% 18%)",
                                    color: "hsl(120 70% 55%)",
                                  }}
                                >
                                  {city?.name}: {formatNumber(contrib.amountContributed)} caps
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Available Projects Tab */}
          {selectedTab === "available" && (
            <div className="space-y-3">
              <button
                onClick={handleProposeProject}
                className="w-full py-3 font-bold tracking-wider flex items-center justify-center gap-2"
                style={{
                  background: "hsl(120 25% 15%)",
                  border: "2px solid hsl(120 50% 35%)",
                  color: "hsl(120 100% 70%)",
                  boxShadow: "0 0 15px hsl(120 100% 50% / 0.2)",
                }}
              >
                <Plus size={20} />
                PROPOSE NEW PROJECT
              </button>

              {availableProjects.length === 0 ? (
                <div className="text-center py-8" style={{ color: "hsl(120 50% 40%)" }}>
                  <p>All available projects have been proposed or completed.</p>
                </div>
              ) : (
                availableProjects.map((project) => (
                  <div
                    key={project.id}
                    className="p-4"
                    style={{
                      background: "hsl(120 12% 8%)",
                      border: "1px solid hsl(120 25% 18%)",
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{getProjectIcon(project.type)}</div>
                      <div className="flex-1">
                        <h3 className="font-bold mb-1" style={{ color: "hsl(120 90% 65%)" }}>
                          {project.name}
                        </h3>
                        <p className="text-xs mb-2" style={{ color: "hsl(120 55% 45%)" }}>
                          {project.description}
                        </p>
                        <p className="text-xs" style={{ color: "hsl(120 50% 40%)" }}>
                          Cost: {formatNumber(project.totalCost)} caps
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Completed Projects Tab */}
          {selectedTab === "completed" && (
            <div className="space-y-3">
              {completedProjects.length === 0 ? (
                <div className="text-center py-12" style={{ color: "hsl(120 50% 40%)" }}>
                  <CheckCircle size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No completed regional projects yet.</p>
                  <p className="text-xs mt-2">Complete active projects to see them here.</p>
                </div>
              ) : (
                completedProjects.map((project) => (
                  <div
                    key={project.id}
                    className="p-4"
                    style={{
                      background: "hsl(120 15% 10%)",
                      border: "1px solid hsl(120 50% 30%)",
                      boxShadow: "0 0 15px hsl(120 100% 50% / 0.1)",
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{getProjectIcon(project.type)}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold" style={{ color: "hsl(120 100% 70%)" }}>
                            {project.name}
                          </h3>
                          <CheckCircle size={16} style={{ color: "hsl(120 80% 60%)" }} />
                        </div>
                        <p className="text-xs mb-2" style={{ color: "hsl(120 60% 50%)" }}>
                          {project.description}
                        </p>
                        <div className="flex gap-2 text-xs">
                          {Object.entries(project.benefits).map(([key, value]) => (
                            <span
                              key={key}
                              className="px-2 py-1"
                              style={{
                                background: "hsl(120 20% 12%)",
                                border: "1px solid hsl(120 40% 25%)",
                                color: "hsl(120 80% 60%)",
                              }}
                            >
                              {key}: +{typeof value === "number" ? `${value}%` : value}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
