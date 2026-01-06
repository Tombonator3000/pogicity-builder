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

// Determine road segment type from connections
export function getSegmentType(connections: number): RoadSegmentType {
  const n = (connections & RoadConnection.North) !== 0;
  const s = (connections & RoadConnection.South) !== 0;
  const e = (connections & RoadConnection.East) !== 0;
  const w = (connections & RoadConnection.West) !== 0;

  const count = (n ? 1 : 0) + (s ? 1 : 0) + (e ? 1 : 0) + (w ? 1 : 0);

  if (count === 0) return RoadSegmentType.Isolated;
  if (count === 4) return RoadSegmentType.Intersection;

  if (count === 1) {
    if (n) return RoadSegmentType.DeadEndNorth;
    if (s) return RoadSegmentType.DeadEndSouth;
    if (e) return RoadSegmentType.DeadEndEast;
    if (w) return RoadSegmentType.DeadEndWest;
  }

  if (count === 2) {
    if (n && s) return RoadSegmentType.Vertical;
    if (e && w) return RoadSegmentType.Horizontal;
    if (n && e) return RoadSegmentType.CornerNE;
    if (n && w) return RoadSegmentType.CornerNW;
    if (s && e) return RoadSegmentType.CornerSE;
    if (s && w) return RoadSegmentType.CornerSW;
  }

  if (count === 3) {
    if (!s) return RoadSegmentType.TeeNorth;
    if (!n) return RoadSegmentType.TeeSouth;
    if (!w) return RoadSegmentType.TeeEast;
    if (!e) return RoadSegmentType.TeeWest;
  }

  return RoadSegmentType.Intersection;
}

// Generate the 4x4 tile pattern for a road segment
export function generateRoadPattern(
  segmentType: RoadSegmentType
): Array<{ dx: number; dy: number; type: TileType }> {
  const pattern: Array<{ dx: number; dy: number; type: TileType }> = [];

  for (let dy = 0; dy < ROAD_SEGMENT_SIZE; dy++) {
    for (let dx = 0; dx < ROAD_SEGMENT_SIZE; dx++) {
      const isCenterX = dx === 1 || dx === 2;
      const isCenterY = dy === 1 || dy === 2;

      let type: TileType = TileType.Road;

      switch (segmentType) {
        case RoadSegmentType.Isolated:
          if (isCenterX && isCenterY) {
            type = TileType.Asphalt;
          }
          break;

        case RoadSegmentType.Horizontal:
          if (isCenterY) {
            type = TileType.Asphalt;
          }
          break;

        case RoadSegmentType.Vertical:
          if (isCenterX) {
            type = TileType.Asphalt;
          }
          break;

        case RoadSegmentType.Intersection:
          if (isCenterX || isCenterY) {
            type = TileType.Asphalt;
          }
          break;

        case RoadSegmentType.DeadEndNorth:
          if (isCenterX && dy < 3) {
            type = TileType.Asphalt;
          }
          break;

        case RoadSegmentType.DeadEndSouth:
          if (isCenterX && dy > 0) {
            type = TileType.Asphalt;
          }
          break;

        case RoadSegmentType.DeadEndEast:
          if (isCenterY && dx > 0) {
            type = TileType.Asphalt;
          }
          break;

        case RoadSegmentType.DeadEndWest:
          if (isCenterY && dx < 3) {
            type = TileType.Asphalt;
          }
          break;

        case RoadSegmentType.CornerNE:
          if ((isCenterX && dy <= 2) || (isCenterY && dx >= 1)) {
            type = TileType.Asphalt;
          }
          break;

        case RoadSegmentType.CornerNW:
          if ((isCenterX && dy <= 2) || (isCenterY && dx <= 2)) {
            type = TileType.Asphalt;
          }
          break;

        case RoadSegmentType.CornerSE:
          if ((isCenterX && dy >= 1) || (isCenterY && dx >= 1)) {
            type = TileType.Asphalt;
          }
          break;

        case RoadSegmentType.CornerSW:
          if ((isCenterX && dy >= 1) || (isCenterY && dx <= 2)) {
            type = TileType.Asphalt;
          }
          break;

        case RoadSegmentType.TeeNorth:
          if (isCenterX && dy <= 2) {
            type = TileType.Asphalt;
          } else if (isCenterY) {
            type = TileType.Asphalt;
          }
          break;

        case RoadSegmentType.TeeSouth:
          if (isCenterX && dy >= 1) {
            type = TileType.Asphalt;
          } else if (isCenterY) {
            type = TileType.Asphalt;
          }
          break;

        case RoadSegmentType.TeeEast:
          if (isCenterY && dx >= 1) {
            type = TileType.Asphalt;
          } else if (isCenterX) {
            type = TileType.Asphalt;
          }
          break;

        case RoadSegmentType.TeeWest:
          if (isCenterY && dx <= 2) {
            type = TileType.Asphalt;
          } else if (isCenterX) {
            type = TileType.Asphalt;
          }
          break;
      }

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

// Get the preferred lane direction for a car at a given position
export function getLaneDirection(
  x: number,
  y: number,
  grid?: GridCell[][]
): Direction | null {
  const tileX = Math.floor(x);
  const tileY = Math.floor(y);
  const localX = tileX % ROAD_SEGMENT_SIZE;
  const localY = tileY % ROAD_SEGMENT_SIZE;

  const isHorizontalLane = localY === 1 || localY === 2;
  const isVerticalLane = localX === 1 || localX === 2;

  if (!grid) {
    if (isVerticalLane) {
      return localX === 1 ? Direction.Down : Direction.Up;
    }
    if (isHorizontalLane) {
      return localY === 1 ? Direction.Left : Direction.Right;
    }
    return null;
  }

  const cell = grid[tileY]?.[tileX];
  if (!cell || cell.type !== TileType.Asphalt) {
    return null;
  }

  if (isVerticalLane && !isHorizontalLane) {
    return localX === 1 ? Direction.Down : Direction.Up;
  }

  if (isHorizontalLane && !isVerticalLane) {
    return localY === 1 ? Direction.Left : Direction.Right;
  }

  return null;
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
