import { useState, useRef, useCallback, MouseEvent } from "react";
import { GameEvent, GameEventChoice } from "@/game/types";
import { playClickSound, playDoubleClickSound } from "@/utils/sounds";
import { AlertTriangle, Gift, Radiation, Users, Skull, Search } from "lucide-react";

interface EventModalProps {
  event: GameEvent | null;
  onChoice: (eventId: string, choiceIndex: number) => void;
  onDismiss: () => void;
}

/**
 * Get icon for event type
 */
function getEventIcon(type: string) {
  switch (type) {
    case 'raid':
      return <Skull className="w-6 h-6 text-destructive animate-pulse" />;
    case 'caravan':
      return <Gift className="w-6 h-6 text-amber-400" />;
    case 'radstorm':
      return <Radiation className="w-6 h-6 text-yellow-400 animate-pulse" />;
    case 'refugees':
      return <Users className="w-6 h-6 text-blue-400" />;
    case 'disease':
      return <AlertTriangle className="w-6 h-6 text-red-400 animate-pulse" />;
    case 'discovery':
      return <Search className="w-6 h-6 text-green-400" />;
    default:
      return <AlertTriangle className="w-6 h-6" />;
  }
}

/**
 * Get severity color based on event type
 */
function getSeverityClass(type: string): string {
  switch (type) {
    case 'raid':
    case 'disease':
      return 'border-destructive/50 shadow-[0_0_20px_hsl(var(--destructive)/0.3)]';
    case 'radstorm':
      return 'border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.3)]';
    case 'caravan':
    case 'discovery':
      return 'border-primary/50 shadow-[0_0_20px_hsl(var(--primary)/0.3)]';
    case 'refugees':
      return 'border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]';
    default:
      return 'border-border';
  }
}

export function EventModal({ event, onChoice, onDismiss }: EventModalProps) {
  const [position, setPosition] = useState({ 
    x: typeof window !== 'undefined' ? window.innerWidth / 2 - 220 : 100, 
    y: typeof window !== 'undefined' ? window.innerHeight / 2 - 150 : 100 
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      setIsDragging(true);
      dragOffset.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
    },
    [position]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.current.x,
          y: e.clientY - dragOffset.current.y,
        });
      }
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleChoiceClick = (choiceIndex: number) => {
    if (event) {
      playDoubleClickSound();
      onChoice(event.id, choiceIndex);
    }
  };

  const handleDismiss = () => {
    playClickSound();
    onDismiss();
  };

  if (!event) return null;

  const hasChoices = event.choices && event.choices.length > 0;
  const severityClass = getSeverityClass(event.type);

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-black/60 z-[2999]"
        onClick={handleDismiss}
      />
      
      {/* Modal */}
      <div
        className={`fixed z-[3000] w-[440px] bg-card border-2 ${severityClass}`}
        style={{
          left: position.x,
          top: position.y,
          fontFamily: "'VT323', monospace",
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Title bar - draggable */}
        <div 
          className="flex items-center justify-between px-3 py-2 bg-secondary border-b border-border cursor-move select-none"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2">
            {getEventIcon(event.type)}
            <span className="text-lg text-foreground tracking-wide uppercase">
              ⚠ {event.name}
            </span>
          </div>
          <button
            className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-destructive/20 transition-colors"
            onClick={handleDismiss}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Description */}
          <div 
            className="text-base text-foreground/90 leading-relaxed border-l-2 border-primary/50 pl-3"
            style={{ textShadow: '0 0 8px hsl(var(--primary) / 0.3)' }}
          >
            {event.description}
          </div>

          {/* Effect preview (if no choices) */}
          {!hasChoices && event.effect && Object.keys(event.effect).length > 0 && (
            <div className="bg-secondary/50 border border-border p-3">
              <div className="text-sm text-muted-foreground mb-2 uppercase tracking-wider">
                :: EFFECT ::
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(event.effect).map(([resource, value]) => {
                  if (value === 0 || value === undefined) return null;
                  const isPositive = value > 0;
                  return (
                    <span 
                      key={resource}
                      className={`px-2 py-1 text-sm ${
                        isPositive 
                          ? 'bg-primary/20 text-primary border border-primary/30' 
                          : 'bg-destructive/20 text-destructive border border-destructive/30'
                      }`}
                    >
                      {resource.toUpperCase()}: {isPositive ? '+' : ''}{value}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Duration indicator (for timed events) */}
          {event.duration && event.duration > 0 && (
            <div className="flex items-center gap-2 text-sm text-amber-400">
              <Radiation className="w-4 h-4 animate-spin-slow" />
              <span>Duration: {event.duration} seconds</span>
            </div>
          )}

          {/* Choices */}
          {hasChoices ? (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground uppercase tracking-wider">
                :: CHOOSE YOUR ACTION ::
              </div>
              {event.choices!.map((choice, index) => (
                <button
                  key={index}
                  className="w-full text-left p-3 bg-secondary/50 border border-border hover:border-primary hover:bg-primary/10 transition-all group"
                  onClick={() => handleChoiceClick(index)}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-primary font-bold">[{index + 1}]</span>
                    <div className="flex-1">
                      <div className="text-foreground group-hover:text-primary transition-colors">
                        {choice.label}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {choice.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            /* Acknowledge button */
            <button
              className="w-full py-3 bg-primary/20 border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all uppercase tracking-wider"
              onClick={handleDismiss}
              style={{ textShadow: '0 0 10px hsl(var(--primary))' }}
            >
              [ ACKNOWLEDGE ]
            </button>
          )}
        </div>

        {/* Terminal footer decoration */}
        <div className="px-3 py-1 bg-secondary/30 border-t border-border text-xs text-muted-foreground flex justify-between">
          <span>VAULT-TEC ALERT SYSTEM</span>
          <span className="animate-pulse">█</span>
        </div>
      </div>
    </>
  );
}
