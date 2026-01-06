import { GridCell, TileType, GRID_SIZE } from "./types";

// Road connection patterns for isometric display
export type RoadConnection = {
  north: boolean;
  south: boolean;
  east: boolean;
  west: boolean;
};

export function getRoadConnections(
  grid: GridCell[][],
  x: number,
  y: number
): RoadConnection {
  const isRoad = (gx: number, gy: number): boolean => {
    if (gx < 0 || gx >= GRID_SIZE || gy < 0 || gy >= GRID_SIZE) return false;
    return grid[gy]?.[gx]?.type === TileType.Road;
  };

  return {
    north: isRoad(x, y - 1),
    south: isRoad(x, y + 1),
    east: isRoad(x + 1, y),
    west: isRoad(x - 1, y),
  };
}

// Get the road sprite index based on connections
export function getRoadSpriteIndex(connections: RoadConnection): number {
  const { north, south, east, west } = connections;
  const count = [north, south, east, west].filter(Boolean).length;

  // Single tile (no connections)
  if (count === 0) return 0;

  // Dead ends
  if (count === 1) {
    if (north) return 1;
    if (south) return 2;
    if (east) return 3;
    if (west) return 4;
  }

  // Straight roads
  if (count === 2) {
    if (north && south) return 5; // Vertical
    if (east && west) return 6; // Horizontal
    // Corners
    if (north && east) return 7;
    if (north && west) return 8;
    if (south && east) return 9;
    if (south && west) return 10;
  }

  // T-intersections
  if (count === 3) {
    if (!north) return 11;
    if (!south) return 12;
    if (!east) return 13;
    if (!west) return 14;
  }

  // 4-way intersection
  return 15;
}
