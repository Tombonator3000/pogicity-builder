import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick: () => void;
  variant?: "default" | "danger";
}

export function ToolButton({
  icon,
  label,
  isActive = false,
  onClick,
  variant = "default",
}: ToolButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={cn(
            "tool-button",
            isActive && "active",
            variant === "danger" && "hover:bg-destructive/20 hover:border-destructive",
            variant === "danger" && isActive && "bg-destructive border-destructive"
          )}
        >
          <span className="tool-button-icon">{icon}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}
