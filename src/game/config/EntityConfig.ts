/**
 * Entity configuration constants
 * Defines behavior parameters for characters, vehicles, and other entities
 */
export const ENTITY_CONFIG = {
  /** Character movement speed (tiles per frame) */
  characterSpeed: 0.01,

  /** Vehicle movement speed (tiles per frame) */
  vehicleSpeed: 0.02,

  /** Road segment size for road network */
  roadSegmentSize: 4,
} as const;
