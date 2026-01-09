import { Direction } from '../types';

/**
 * Utilities for directional movement and navigation
 */

/** Direction vectors for grid-based movement */
export const DIRECTION_VECTORS: Record<Direction, { dx: number; dy: number }> = {
  [Direction.Up]: { dx: 0, dy: -1 },
  [Direction.Down]: { dx: 0, dy: 1 },
  [Direction.Left]: { dx: -1, dy: 0 },
  [Direction.Right]: { dx: 1, dy: 0 },
};

/** Mapping of directions to their opposites */
export const OPPOSITE_DIRECTION: Record<Direction, Direction> = {
  [Direction.Up]: Direction.Down,
  [Direction.Down]: Direction.Up,
  [Direction.Left]: Direction.Right,
  [Direction.Right]: Direction.Left,
};

/** All valid directions */
export const ALL_DIRECTIONS = [
  Direction.Up,
  Direction.Down,
  Direction.Left,
  Direction.Right,
] as const;

/**
 * Gets the opposite direction
 * @param direction - Input direction
 * @returns Opposite direction
 */
export function getOppositeDirection(direction: Direction): Direction {
  return OPPOSITE_DIRECTION[direction];
}

/**
 * Gets a random direction
 * @returns Random direction
 */
export function getRandomDirection(): Direction {
  return ALL_DIRECTIONS[Math.floor(Math.random() * ALL_DIRECTIONS.length)];
}

/**
 * Maps Direction enum to directional string
 * @param direction - Direction enum value
 * @returns Directional string ('north', 'south', 'east', 'west')
 */
export function directionToString(direction: Direction): 'north' | 'south' | 'east' | 'west' {
  const map: Record<Direction, 'north' | 'south' | 'east' | 'west'> = {
    [Direction.Up]: 'north',
    [Direction.Down]: 'south',
    [Direction.Left]: 'west',
    [Direction.Right]: 'east',
  };
  return map[direction];
}

/**
 * Maps Direction enum to short directional string
 * @param direction - Direction enum value
 * @returns Short directional string ('n', 's', 'e', 'w')
 */
export function directionToShortString(direction: Direction): 'n' | 's' | 'e' | 'w' {
  const map: Record<Direction, 'n' | 's' | 'e' | 'w'> = {
    [Direction.Up]: 'n',
    [Direction.Down]: 's',
    [Direction.Left]: 'w',
    [Direction.Right]: 'e',
  };
  return map[direction];
}
