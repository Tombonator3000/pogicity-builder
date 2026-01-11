import { GameEvent } from "@/game/types";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useState } from "react";
import { getEventIcon, getEventStyling, formatEventTime } from "@/utils/eventUtils";

interface EventLogProps {
  events: GameEvent[];
  maxDisplay?: number;
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
            const colorClass = getEventStyling(event.type, 'text');
            return (
              <div 
                key={event.id}
                className={`px-3 py-2 border-b border-border/50 hover:bg-secondary/30 transition-colors ${
                  index === 0 ? 'bg-secondary/20' : ''
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5">
                    {getEventIcon(event.type, 'small', false)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm truncate ${colorClass.split(' ')[0]}`}>
                        {event.name}
                      </span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatEventTime(event.timestamp)}
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
