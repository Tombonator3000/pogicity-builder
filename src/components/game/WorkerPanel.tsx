import { WorkerAssignment } from "@/game/types";

interface WorkerPanelProps {
  stats: {
    total: number;
    assigned: number;
    available: number;
    understaffed: number;
  };
  assignments: WorkerAssignment[];
}

/**
 * Fallout-style worker allocation panel
 */
export function WorkerPanel({ stats, assignments }: WorkerPanelProps) {
  const getEfficiencyColor = (assigned: number, required: number): string => {
    const ratio = assigned / required;
    if (ratio >= 1) return "hsl(120 80% 55%)";
    if (ratio >= 0.5) return "hsl(45 90% 55%)";
    return "hsl(0 80% 55%)";
  };

  const getBuildingName = (buildingId: string): string => {
    const names: Record<string, string> = {
      'scavenging-station': 'Scavenger',
      'water-purifier': 'Purifier',
      'hydroponic-farm': 'Farm',
      'generator': 'Generator',
      'solar-array': 'Solar',
      'med-tent': 'Med Tent',
      'guard-tower': 'Guard',
      'trading-post': 'Trading',
      'radio-tower': 'Radio',
    };
    return names[buildingId] || buildingId;
  };

  // Sort assignments by priority
  const sortedAssignments = [...assignments].sort((a, b) => a.priority - b.priority);

  return (
    <div 
      className="absolute left-4 top-32 w-48 z-30"
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
          WORKFORCE
        </h3>
        <span 
          className="text-xs font-mono"
          style={{ 
            color: stats.available > 0 ? 'hsl(120 80% 55%)' : 'hsl(45 90% 55%)',
            textShadow: '0 0 6px hsl(120 80% 55% / 0.5)'
          }}
        >
          {stats.assigned}/{stats.total}
        </span>
      </div>

      {/* Summary */}
      <div 
        className="p-2 border-b"
        style={{ borderColor: 'hsl(120 20% 15%)' }}
      >
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div 
            className="p-1.5 text-center"
            style={{
              background: 'hsl(120 8% 4%)',
              border: '1px solid hsl(120 20% 15%)'
            }}
          >
            <div style={{ color: 'hsl(120 40% 45%)' }}>ASSIGNED</div>
            <div 
              className="font-mono font-bold"
              style={{ 
                color: 'hsl(120 80% 55%)',
                textShadow: '0 0 6px hsl(120 80% 55%)'
              }}
            >
              {stats.assigned}
            </div>
          </div>
          <div 
            className="p-1.5 text-center"
            style={{
              background: 'hsl(120 8% 4%)',
              border: '1px solid hsl(120 20% 15%)'
            }}
          >
            <div style={{ color: 'hsl(120 40% 45%)' }}>IDLE</div>
            <div 
              className="font-mono font-bold"
              style={{ 
                color: stats.available > 0 ? 'hsl(45 90% 55%)' : 'hsl(120 80% 55%)',
                textShadow: `0 0 6px ${stats.available > 0 ? 'hsl(45 90% 55%)' : 'hsl(120 80% 55%)'}`
              }}
            >
              {stats.available}
            </div>
          </div>
        </div>

        {stats.understaffed > 0 && (
          <div 
            className="mt-2 p-1.5 text-center text-[9px]"
            style={{
              background: 'hsl(0 20% 8%)',
              border: '1px solid hsl(0 40% 25%)',
              color: 'hsl(0 80% 55%)',
              textShadow: '0 0 4px hsl(0 80% 55%)'
            }}
          >
            ⚠ {stats.understaffed} UNDERSTAFFED
          </div>
        )}
      </div>

      {/* Assignments list */}
      <div className="p-2 max-h-40 overflow-y-auto space-y-1">
        {sortedAssignments.length === 0 ? (
          <div 
            className="text-center text-[10px] py-2"
            style={{ color: 'hsl(120 30% 40%)' }}
          >
            NO ACTIVE JOBS
          </div>
        ) : (
          sortedAssignments.map((assignment) => {
            const efficiency = assignment.workersAssigned / assignment.workersRequired;
            const color = getEfficiencyColor(assignment.workersAssigned, assignment.workersRequired);
            
            return (
              <div
                key={assignment.buildingInstanceId}
                className="p-1.5 flex items-center justify-between"
                style={{
                  background: 'hsl(120 8% 4%)',
                  border: '1px solid hsl(120 20% 15%)'
                }}
              >
                <span 
                  className="text-[9px] uppercase tracking-wide"
                  style={{ color: 'hsl(120 50% 50%)' }}
                >
                  {getBuildingName(assignment.buildingId)}
                </span>
                <div className="flex items-center gap-1">
                  <span 
                    className="text-[10px] font-mono"
                    style={{ 
                      color,
                      textShadow: `0 0 4px ${color}`
                    }}
                  >
                    {assignment.workersAssigned}/{assignment.workersRequired}
                  </span>
                  {efficiency < 1 && (
                    <span 
                      className="text-[8px]"
                      style={{ color: 'hsl(0 80% 55%)' }}
                    >
                      ⚠
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
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
          LABOR ALLOCATION
        </span>
      </div>
    </div>
  );
}
