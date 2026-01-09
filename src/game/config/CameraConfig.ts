/**
 * Camera configuration constants
 * Defines camera behavior and constraints
 */
export const CAMERA_CONFIG = {
  /** Keyboard camera movement speed */
  keyboardSpeed: 8,

  /** Minimum zoom level */
  minZoom: 0.25,

  /** Maximum zoom level */
  maxZoom: 4,

  /** Zoom sensitivity for mouse wheel */
  zoomSensitivity: 0.001,
} as const;
