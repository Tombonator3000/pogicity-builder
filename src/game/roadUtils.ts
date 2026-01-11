import { TileType, GridCell, GRID_WIDTH, GRID_HEIGHT, Direction } from "./types";

// Road segment size (4x4 grid cells)
export const ROAD_SEGMENT_SIZE = 4;

// Direction flags for road connections
export enum RoadConnection {
  None = 0,
  North = 1 << 0,
  South = 1 << 1,
  East = 1 << 2,
  West = 1 << 3,
}

// Road segment types based on connections
export enum RoadSegmentType {
  Isolated = "isolated",
  DeadEndNorth = "deadEndNorth",
  DeadEndSouth = "deadEndSouth",
  DeadEndEast = "deadEndEast",
  DeadEndWest = "deadEndWest",
  Horizontal = "horizontal",
  Vertical = "vertical",
  CornerNE = "cornerNE",
  CornerNW = "cornerNW",
  CornerSE = "cornerSE",
  CornerSW = "cornerSW",
  TeeNorth = "teeNorth",
  TeeSouth = "teeSouth",
  TeeEast = "teeEast",
  TeeWest = "teeWest",
  Intersection = "intersection",
}

// Check if placing a road segment at (segmentX, segmentY) would be valid
export function canPlaceRoadSegment(
  grid: GridCell[][],
  segmentX: number,
  segmentY: number
): { valid: boolean; reason?: string } {
  if (
    segmentX < 0 ||
    segmentY < 0 ||
    segmentX + ROAD_SEGMENT_SIZE > GRID_WIDTH ||
    segmentY + ROAD_SEGMENT_SIZE > GRID_HEIGHT
  ) {
    return { valid: false, reason: "out_of_bounds" };
  }

  for (let dy = 0; dy < ROAD_SEGMENT_SIZE; dy++) {
    for (let dx = 0; dx < ROAD_SEGMENT_SIZE; dx++) {
      const px = segmentX + dx;
      const py = segmentY + dy;
      const cell = grid[py]?.[px];

      if (!cell) continue;

      if (cell.type !== TileType.Grass) {
        return { valid: false, reason: "blocked" };
      }
    }
  }

  return { valid: true };
}

// Get the road segment origin (top-left of 4x4 block) for any grid position
export function getRoadSegmentOrigin(
  x: number,
  y: number
): { x: number; y: number } {
  return {
    x: Math.floor(x / ROAD_SEGMENT_SIZE) * ROAD_SEGMENT_SIZE,
    y: Math.floor(y / ROAD_SEGMENT_SIZE) * ROAD_SEGMENT_SIZE,
  };
}

// Check if a 4x4 area contains a road segment at exact position
export function hasRoadSegment(
  grid: GridCell[][],
  segmentX: number,
  segmentY: number
): boolean {
  if (
    segmentX < 0 ||
    segmentY < 0 ||
    segmentX >= GRID_WIDTH ||
    segmentY >= GRID_HEIGHT
  ) {
    return false;
  }

  const cell = grid[segmentY]?.[segmentX];
  return (
    cell?.isOrigin === true &&
    cell?.originX === segmentX &&
    cell?.originY === segmentY &&
    (cell?.type === TileType.Road || cell?.type === TileType.Asphalt)
  );
}

// Get connection flags for a road segment based on neighboring segments
export function getRoadConnections(
  grid: GridCell[][],
  segmentX: number,
  segmentY: number
): number {
  let connections = RoadConnection.None;

  if (hasRoadSegment(grid, segmentX, segmentY - ROAD_SEGMENT_SIZE)) {
    connections |= RoadConnection.North;
  }
  if (hasRoadSegment(grid, segmentX, segmentY + ROAD_SEGMENT_SIZE)) {
    connections |= RoadConnection.South;
  }
  if (hasRoadSegment(grid, segmentX + ROAD_SEGMENT_SIZE, segmentY)) {
    connections |= RoadConnection.East;
  }
  if (hasRoadSegment(grid, segmentX - ROAD_SEGMENT_SIZE, segmentY)) {
    connections |= RoadConnection.West;
  }

  return connections;
}

/**
 * Lookup table for road segment types based on connection patterns.
 * Connections is a 4-bit value where each bit represents a direction:
 * - Bit 0 (1): North
 * - Bit 1 (2): South
 * - Bit 2 (4): East
 * - Bit 3 (8): West
 *
 * This provides O(1) lookup instead of nested conditionals.
 */
const SEGMENT_TYPE_LOOKUP: Record<number, RoadSegmentType> = {
  // 0: No connections (0000)
  0: RoadSegmentType.Isolated,

  // 1 connection (Dead ends)
  1: RoadSegmentType.DeadEndNorth,  // N (0001)
  2: RoadSegmentType.DeadEndSouth,  // S (0010)
  4: RoadSegmentType.DeadEndEast,   // E (0100)
  8: RoadSegmentType.DeadEndWest,   // W (1000)

  // 2 connections (Straight or Corner)
  3: RoadSegmentType.Vertical,      // N+S (0011)
  12: RoadSegmentType.Horizontal,   // E+W (1100)
  5: RoadSegmentType.CornerNE,      // N+E (0101)
  9: RoadSegmentType.CornerNW,      // N+W (1001)
  6: RoadSegmentType.CornerSE,      // S+E (0110)
  10: RoadSegmentType.CornerSW,     // S+W (1010)

  // 3 connections (T-junctions)
  13: RoadSegmentType.TeeNorth,     // N+E+W (1101) - missing South
  11: RoadSegmentType.TeeWest,      // N+S+W (1011) - missing East
  7: RoadSegmentType.TeeEast,       // N+S+E (0111) - missing West
  14: RoadSegmentType.TeeSouth,     // S+E+W (1110) - missing North

  // 4 connections (Intersection)
  15: RoadSegmentType.Intersection, // N+S+E+W (1111)
};

/**
 * Determine road segment type from connections using lookup table.
 * Replaces nested if/else with O(1) table lookup for better performance and clarity.
 *
 * @param connections - Bitwise flags representing road connections (RoadConnection enum)
 * @returns The appropriate road segment type for the connection pattern
 */
export function getSegmentType(connections: number): RoadSegmentType {
  return SEGMENT_TYPE_LOOKUP[connections] ?? RoadSegmentType.Isolated;
}

/**
 * Type definition for road pattern predicate functions
 * Determines if a tile at (dx, dy) should be asphalt based on segment type
 */
type RoadPatternPredicate = (
  dx: number,
  dy: number,
  isCenterX: boolean,
  isCenterY: boolean
) => boolean;

/**
 * Road pattern definitions mapping each segment type to its asphalt predicate
 * This data-driven approach eliminates the need for a massive switch statement
 *
 * Pattern Logic:
 * - Isolated: Only center 2x2 area is asphalt
 * - Horizontal: Horizontal lanes (rows 1-2) are asphalt
 * - Vertical: Vertical lanes (columns 1-2) are asphalt
 * - Intersection: All lanes (both horizontal and vertical) are asphalt
 * - DeadEnd[Direction]: Lane extends from center towards the specified direction
 * - Corner[NE/NW/SE/SW]: L-shaped lane connecting two perpendicular directions
 * - Tee[Direction]: T-shaped intersection with three directions connected
 */
const ROAD_PATTERN_DEFINITIONS: Record<RoadSegmentType, RoadPatternPredicate> = {
  [RoadSegmentType.Isolated]: (dx, dy, isCenterX, isCenterY) =>
    isCenterX && isCenterY,

  [RoadSegmentType.Horizontal]: (dx, dy, isCenterX, isCenterY) =>
    isCenterY,

  [RoadSegmentType.Vertical]: (dx, dy, isCenterX, isCenterY) =>
    isCenterX,

  [RoadSegmentType.Intersection]: (dx, dy, isCenterX, isCenterY) =>
    isCenterX || isCenterY,

  [RoadSegmentType.DeadEndNorth]: (dx, dy, isCenterX, isCenterY) =>
    isCenterX && dy < 3,

  [RoadSegmentType.DeadEndSouth]: (dx, dy, isCenterX, isCenterY) =>
    isCenterX && dy > 0,

  [RoadSegmentType.DeadEndEast]: (dx, dy, isCenterX, isCenterY) =>
    isCenterY && dx > 0,

  [RoadSegmentType.DeadEndWest]: (dx, dy, isCenterX, isCenterY) =>
    isCenterY && dx < 3,

  [RoadSegmentType.CornerNE]: (dx, dy, isCenterX, isCenterY) =>
    (isCenterX && dy <= 2) || (isCenterY && dx >= 1),

  [RoadSegmentType.CornerNW]: (dx, dy, isCenterX, isCenterY) =>
    (isCenterX && dy <= 2) || (isCenterY && dx <= 2),

  [RoadSegmentType.CornerSE]: (dx, dy, isCenterX, isCenterY) =>
    (isCenterX && dy >= 1) || (isCenterY && dx >= 1),

  [RoadSegmentType.CornerSW]: (dx, dy, isCenterX, isCenterY) =>
    (isCenterX && dy >= 1) || (isCenterY && dx <= 2),

  [RoadSegmentType.TeeNorth]: (dx, dy, isCenterX, isCenterY) =>
    (isCenterX && dy <= 2) || isCenterY,

  [RoadSegmentType.TeeSouth]: (dx, dy, isCenterX, isCenterY) =>
    (isCenterX && dy >= 1) || isCenterY,

  [RoadSegmentType.TeeEast]: (dx, dy, isCenterX, isCenterY) =>
    (isCenterY && dx >= 1) || isCenterX,

  [RoadSegmentType.TeeWest]: (dx, dy, isCenterX, isCenterY) =>
    (isCenterY && dx <= 2) || isCenterX,
};

/**
 * Generate the 4x4 tile pattern for a road segment
 * Uses data-driven pattern definitions instead of switch statement
 *
 * @param segmentType - The type of road segment (isolated, horizontal, corner, etc.)
 * @returns Array of tile positions with their types (Road or Asphalt)
 *
 * @example
 * const pattern = generateRoadPattern(RoadSegmentType.Horizontal);
 * // Returns 16 tiles: rows 1-2 are Asphalt (driveable lanes), rest are Road (sidewalk)
 */
export function generateRoadPattern(
  segmentType: RoadSegmentType
): Array<{ dx: number; dy: number; type: TileType }> {
  const pattern: Array<{ dx: number; dy: number; type: TileType }> = [];
  const predicate = ROAD_PATTERN_DEFINITIONS[segmentType];

  for (let dy = 0; dy < ROAD_SEGMENT_SIZE; dy++) {
    for (let dx = 0; dx < ROAD_SEGMENT_SIZE; dx++) {
      const isCenterX = dx === 1 || dx === 2;
      const isCenterY = dy === 1 || dy === 2;

      // Determine tile type using the predicate for this segment type
      const type = predicate(dx, dy, isCenterX, isCenterY)
        ? TileType.Asphalt
        : TileType.Road;

      pattern.push({ dx, dy, type });
    }
  }

  return pattern;
}

// Get all segment origins that need updating when a segment changes
export function getAffectedSegments(
  segmentX: number,
  segmentY: number
): Array<{ x: number; y: number }> {
  const affected: Array<{ x: number; y: number }> = [];

  affected.push({ x: segmentX, y: segmentY });

  const neighbors = [
    { x: segmentX, y: segmentY - ROAD_SEGMENT_SIZE },
    { x: segmentX, y: segmentY + ROAD_SEGMENT_SIZE },
    { x: segmentX + ROAD_SEGMENT_SIZE, y: segmentY },
    { x: segmentX - ROAD_SEGMENT_SIZE, y: segmentY },
  ];

  for (const n of neighbors) {
    if (n.x >= 0 && n.y >= 0 && n.x < GRID_WIDTH && n.y < GRID_HEIGHT) {
      affected.push(n);
    }
  }

  return affected;
}

/**
 * Lane position helpers for determining vehicle direction.
 * In a 4x4 road segment:
 * - Lanes 1 and 2 are the center lanes (where vehicles travel)
 * - Lane 1: Down/Left direction
 * - Lane 2: Up/Right direction
 */
interface LanePosition {
  localX: number;
  localY: number;
  isHorizontalLane: boolean;
  isVerticalLane: boolean;
}

/**
 * Calculate lane position within a 4x4 road segment.
 * Extracted for better clarity and reusability.
 */
function calculateLanePosition(x: number, y: number): LanePosition {
  const tileX = Math.floor(x);
  const tileY = Math.floor(y);
  const localX = tileX % ROAD_SEGMENT_SIZE;
  const localY = tileY % ROAD_SEGMENT_SIZE;

  return {
    localX,
    localY,
    isHorizontalLane: localY === 1 || localY === 2,
    isVerticalLane: localX === 1 || localX === 2,
  };
}

/**
 * Determine direction based on lane position.
 * Vertical lanes: localX determines direction (1=Down, 2=Up)
 * Horizontal lanes: localY determines direction (1=Left, 2=Right)
 */
function getDirectionFromLanePosition(position: LanePosition): Direction | null {
  const { localX, localY, isHorizontalLane, isVerticalLane } = position;

  // Pure vertical lane (not at intersection)
  if (isVerticalLane && !isHorizontalLane) {
    return localX === 1 ? Direction.Down : Direction.Up;
  }

  // Pure horizontal lane (not at intersection)
  if (isHorizontalLane && !isVerticalLane) {
    return localY === 1 ? Direction.Left : Direction.Right;
  }

  // Not in a lane or at intersection
  return null;
}

/**
 * Get the preferred lane direction for a car at a given position.
 * Refactored for clarity by extracting position calculation and direction logic.
 *
 * @param x - World X coordinate
 * @param y - World Y coordinate
 * @param grid - Optional grid for validation (checks if tile is asphalt)
 * @returns Direction for the lane, or null if not in a valid lane
 */
export function getLaneDirection(
  x: number,
  y: number,
  grid?: GridCell[][]
): Direction | null {
  const position = calculateLanePosition(x, y);

  // If grid provided, validate the tile is asphalt
  if (grid) {
    const tileX = Math.floor(x);
    const tileY = Math.floor(y);
    const cell = grid[tileY]?.[tileX];

    if (!cell || cell.type !== TileType.Asphalt) {
      return null;
    }
  }

  return getDirectionFromLanePosition(position);
}

// Check if position is at an intersection
export function isAtIntersection(
  tileX: number,
  tileY: number,
  grid: GridCell[][]
): boolean {
  const localX = tileX % ROAD_SEGMENT_SIZE;
  const localY = tileY % ROAD_SEGMENT_SIZE;

  const isCenterX = localX === 1 || localX === 2;
  const isCenterY = localY === 1 || localY === 2;

  return isCenterX && isCenterY;
}

// Check if a car can turn at the current tile
export function canTurnAtTile(
  tileX: number,
  tileY: number,
  fromDir: Direction,
  toDir: Direction
): boolean {
  if (fromDir === toDir) return true;
  return isAtIntersection(tileX, tileY, []);
}

// Get U-turn direction if at dead end
export function getUTurnDirection(
  tileX: number,
  tileY: number,
  currentDir: Direction,
  grid: GridCell[][]
): Direction | null {
  const oppositeDir: Record<Direction, Direction> = {
    [Direction.Up]: Direction.Down,
    [Direction.Down]: Direction.Up,
    [Direction.Left]: Direction.Right,
    [Direction.Right]: Direction.Left,
  };

  return oppositeDir[currentDir];
}
