import { AlertTriangle, Gift, Radiation, Users, Skull, Search } from "lucide-react";

/**
 * Event type to color mapping
 * Centralized color scheme for all event-related UI
 */
export const EVENT_COLORS = {
  raid: {
    text: 'text-destructive',
    border: 'border-destructive/50',
    shadow: 'shadow-[0_0_20px_hsl(var(--destructive)/0.3)]',
    borderLight: 'border-destructive/30',
  },
  disease: {
    text: 'text-red-400',
    border: 'border-destructive/50',
    shadow: 'shadow-[0_0_20px_hsl(var(--destructive)/0.3)]',
    borderLight: 'border-destructive/30',
  },
  radstorm: {
    text: 'text-yellow-400',
    border: 'border-yellow-500/50',
    shadow: 'shadow-[0_0_20px_rgba(234,179,8,0.3)]',
    borderLight: 'border-yellow-400/30',
  },
  caravan: {
    text: 'text-amber-400',
    border: 'border-primary/50',
    shadow: 'shadow-[0_0_20px_hsl(var(--primary)/0.3)]',
    borderLight: 'border-primary/30',
  },
  discovery: {
    text: 'text-green-400',
    border: 'border-primary/50',
    shadow: 'shadow-[0_0_20px_hsl(var(--primary)/0.3)]',
    borderLight: 'border-primary/30',
  },
  refugees: {
    text: 'text-blue-400',
    border: 'border-blue-500/50',
    shadow: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]',
    borderLight: 'border-blue-400/30',
  },
} as const;

/**
 * Get the appropriate icon component for an event type
 *
 * @param type - The event type
 * @param size - Icon size variant ('small' = 3x3, 'large' = 6x6)
 * @param animated - Whether to add animation classes (pulse for danger, none for neutral)
 * @returns React icon component with appropriate styling
 */
export function getEventIcon(
  type: string,
  size: 'small' | 'large' = 'large',
  animated: boolean = true
) {
  const sizeClass = size === 'small' ? 'w-3 h-3' : 'w-6 h-6';
  const color = EVENT_COLORS[type as keyof typeof EVENT_COLORS];
  const textColor = color?.text || 'text-foreground';

  // Animation for high-severity events
  const animationClass = animated && ['raid', 'radstorm', 'disease'].includes(type)
    ? 'animate-pulse'
    : '';

  const className = `${sizeClass} ${textColor} ${animationClass}`.trim();

  switch (type) {
    case 'raid':
      return <Skull className={className} />;
    case 'caravan':
      return <Gift className={className} />;
    case 'radstorm':
      return <Radiation className={className} />;
    case 'refugees':
      return <Users className={className} />;
    case 'disease':
      return <AlertTriangle className={className} />;
    case 'discovery':
      return <Search className={className} />;
    default:
      return <AlertTriangle className={sizeClass} />;
  }
}

/**
 * Get styling classes for event type
 *
 * @param type - The event type
 * @param variant - Styling variant:
 *   - 'modal': Full modal styling with shadow glow
 *   - 'text': Text and border colors only (for inline display)
 * @returns CSS class string for event styling
 */
export function getEventStyling(
  type: string,
  variant: 'modal' | 'text' = 'modal'
): string {
  const color = EVENT_COLORS[type as keyof typeof EVENT_COLORS];

  if (!color) {
    return variant === 'modal' ? 'border-border' : 'text-foreground border-border';
  }

  if (variant === 'modal') {
    return `${color.border} ${color.shadow}`;
  } else {
    return `${color.text} ${color.borderLight}`;
  }
}

/**
 * Format timestamp to MM:SS format
 *
 * @param timestamp - Timestamp in seconds
 * @returns Formatted time string (e.g., "02:45")
 */
export function formatEventTime(timestamp: number): string {
  const minutes = Math.floor(timestamp / 60);
  const seconds = Math.floor(timestamp % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
