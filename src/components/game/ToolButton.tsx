import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick: () => void;
  variant?: "default" | "danger";
}

/**
 * Fallout-style terminal tool button
 * Features phosphor glow effect and beveled edges
 */
export function ToolButton({
  icon,
  label,
  isActive = false,
  onClick,
  variant = "default",
}: ToolButtonProps) {
  const baseStyles = {
    background: isActive 
      ? 'linear-gradient(180deg, hsl(120 30% 16%) 0%, hsl(120 25% 10%) 100%)'
      : 'linear-gradient(180deg, hsl(120 18% 12%) 0%, hsl(120 12% 8%) 100%)',
    border: '2px solid',
    borderColor: isActive
      ? 'hsl(120 50% 35%) hsl(120 25% 12%) hsl(120 25% 12%) hsl(120 50% 35%)'
      : 'hsl(120 30% 22%) hsl(120 18% 10%) hsl(120 18% 10%) hsl(120 30% 22%)',
    boxShadow: isActive 
      ? '0 0 15px hsl(120 100% 50% / 0.3), inset 0 0 10px hsl(120 100% 50% / 0.08)'
      : 'none',
    color: isActive ? 'hsl(120 100% 75%)' : 'hsl(120 70% 55%)',
    textShadow: isActive ? '0 0 8px hsl(120 100% 50% / 0.7)' : '0 0 4px hsl(120 100% 50% / 0.3)'
  };

  const dangerStyles = variant === "danger" ? {
    borderColor: isActive
      ? 'hsl(0 60% 40%) hsl(0 40% 20%) hsl(0 40% 20%) hsl(0 60% 40%)'
      : 'hsl(0 40% 25%) hsl(0 30% 15%) hsl(0 30% 15%) hsl(0 40% 25%)',
    background: isActive
      ? 'linear-gradient(180deg, hsl(0 50% 20%) 0%, hsl(0 40% 12%) 100%)'
      : 'linear-gradient(180deg, hsl(0 30% 15%) 0%, hsl(0 25% 10%) 100%)',
    boxShadow: isActive ? '0 0 15px hsl(0 80% 50% / 0.3)' : 'none',
    color: isActive ? 'hsl(0 90% 70%)' : 'hsl(0 60% 55%)',
    textShadow: isActive ? '0 0 8px hsl(0 100% 50% / 0.7)' : 'none'
  } : {};

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={cn(
            "relative flex items-center justify-center w-11 h-11 transition-all duration-150",
            "hover:scale-105 active:scale-95"
          )}
          style={{
            ...baseStyles,
            ...dangerStyles
          }}
        >
          <span 
            className="text-xl"
            style={{ 
              filter: `drop-shadow(0 0 3px currentColor)` 
            }}
          >
            {icon}
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent 
        side="bottom"
        className="px-3 py-1.5 text-xs uppercase tracking-wider font-bold"
        style={{
          background: 'hsl(120 15% 8%)',
          border: '1px solid hsl(120 40% 25%)',
          color: 'hsl(120 100% 70%)',
          textShadow: '0 0 6px hsl(120 100% 50% / 0.5)',
          boxShadow: '0 0 15px hsl(120 100% 50% / 0.15)'
        }}
      >
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}
