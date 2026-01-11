import { GameEvent } from "@/game/types";
import { AlertTriangle, Gift, Radiation, Users, Skull, Search, ChevronUp, ChevronDown } from "lucide-react";
import { useState } from "react";

interface EventLogProps {
  events: GameEvent[];
  maxDisplay?: number;
}

/**
 * Get icon for event type (smaller version)
 */
function getEventIcon(type: string) {
  const className = "w-3 h-3";
  switch (type) {
    case 'raid':
      return <Skull className={`${className} text-destructive`} />;
    case 'caravan':
      return <Gift className={`${className} text-amber-400`} />;
    case 'radstorm':
      return <Radiation className={`${className} text-yellow-400`} />;
    case 'refugees':
      return <Users className={`${className} text-blue-400`} />;
    case 'disease':
      return <AlertTriangle className={`${className} text-red-400`} />;
    case 'discovery':
      return <Search className={`${className} text-green-400`} />;
    default:
      return <AlertTriangle className={className} />;
  }
}

/**
 * Get color class for event type
 */
function getEventColorClass(type: string): string {
  switch (type) {
    case 'raid':
    case 'disease':
      return 'text-destructive border-destructive/30';
    case 'radstorm':
      return 'text-yellow-400 border-yellow-400/30';
    case 'caravan':
    case 'discovery':
      return 'text-primary border-primary/30';
    case 'refugees':
      return 'text-blue-400 border-blue-400/30';
    default:
      return 'text-foreground border-border';
  }
}

/**
 * Format timestamp to readable time
 */
function formatTime(timestamp: number): string {
  const minutes = Math.floor(timestamp / 60);
  const seconds = Math.floor(timestamp % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function EventLog({ events, maxDisplay = 5 }: EventLogProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Show recent events (newest first)
  const recentEvents = [...events].reverse().slice(0, isExpanded ? 15 : maxDisplay);

  if (events.length === 0) {
    return null;
  }

  return (
    <div 
      className="fixed bottom-20 left-4 z-40 w-[280px]"
      style={{ fontFamily: "'VT323', monospace" }}
    >
      <div className="bg-card/95 border border-border backdrop-blur-sm">
        {/* Header */}
        <div 
          className="flex items-center justify-between px-3 py-1.5 bg-secondary/50 border-b border-border cursor-pointer select-none"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <span className="text-primary text-xs">▣</span>
            <span className="text-sm text-foreground uppercase tracking-wider">
              Event Log
            </span>
            <span className="text-xs text-muted-foreground">
              ({events.length})
            </span>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          )}
        </div>

        {/* Events list */}
        <div 
          className={`overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent ${
            isExpanded ? 'max-h-[300px]' : 'max-h-[150px]'
          }`}
        >
          {recentEvents.map((event, index) => {
            const colorClass = getEventColorClass(event.type);
            return (
              <div 
                key={event.id}
                className={`px-3 py-2 border-b border-border/50 hover:bg-secondary/30 transition-colors ${
                  index === 0 ? 'bg-secondary/20' : ''
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5">
                    {getEventIcon(event.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm truncate ${colorClass.split(' ')[0]}`}>
                        {event.name}
                      </span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatTime(event.timestamp)}
                      </span>
                    </div>
                    {/* Show effect summary on hover or for most recent */}
                    {index === 0 && event.effect && Object.keys(event.effect).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Object.entries(event.effect).map(([resource, value]) => {
                          if (value === 0 || value === undefined) return null;
                          const isPositive = Number(value) > 0;
                          return (
                            <span 
                              key={resource}
                              className={`text-xs px-1 ${
                                isPositive ? 'text-primary' : 'text-destructive'
                              }`}
                            >
                              {resource}: {isPositive ? '+' : ''}{value}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        {events.length > maxDisplay && !isExpanded && (
          <div 
            className="px-3 py-1 text-xs text-muted-foreground text-center cursor-pointer hover:text-foreground transition-colors"
            onClick={() => setIsExpanded(true)}
          >
            + {events.length - maxDisplay} more events
          </div>
        )}
      </div>
    </div>
  );
}
