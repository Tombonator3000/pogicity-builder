import Phaser from 'phaser';
import { GameSystem } from './GameSystem';
import {
  GridCell,
  TileType,
  RoadType,
  TrafficData,
  CongestionLevel,
  ROAD_CAPACITY,
  Commuter,
  CommuterState,
  GRID_WIDTH,
  GRID_HEIGHT,
} from '../types';

/**
 * Traffic System Configuration
 */
export const TRAFFIC_CONFIG = {
  updateInterval: 5000, // Update traffic every 5 seconds
  baseTrafficPerZone: 5, // Base cars generated per developed zone
  transitReductionFactor: 0.3, // 30% reduction in road traffic when using transit
  congestionGrowthPenalty: {
    [CongestionLevel.None]: 1.0, // No penalty
    [CongestionLevel.Light]: 0.95, // 5% growth penalty
    [CongestionLevel.Medium]: 0.85, // 15% growth penalty
    [CongestionLevel.Heavy]: 0.7, // 30% growth penalty
    [CongestionLevel.Gridlock]: 0.5, // 50% growth penalty
  },
  congestionPollutionMultiplier: {
    [CongestionLevel.None]: 1.0,
    [CongestionLevel.Light]: 1.2,
    [CongestionLevel.Medium]: 1.5,
    [CongestionLevel.Heavy]: 2.0,
    [CongestionLevel.Gridlock]: 3.0,
  },
} as const;

/**
 * TrafficSystem
 * Calculates real traffic congestion based on commuters and road capacity.
 *
 * Features:
 * - Traffic volume calculation from commuters
 * - Road capacity based on road type (Basic, Avenue, Highway)
 * - Congestion levels (None, Light, Medium, Heavy, Gridlock)
 * - Traffic impact on zone growth
 * - Traffic contribution to pollution
 * - Traffic overlay data generation
 */
export class TrafficSystem implements GameSystem {
  private scene!: Phaser.Scene;
  private trafficData: Map<string, TrafficData> = new Map();
  private lastUpdateTime: number = 0;

  /**
   * Initialize the traffic system
   */
  init(scene: Phaser.Scene): void {
    this.scene = scene;
    this.lastUpdateTime = Date.now();
    console.log('[TrafficSystem] Initialized');
  }

  /**
   * Update traffic calculations
   */
  update(delta: number): void {
    const now = Date.now();
    if (now - this.lastUpdateTime >= TRAFFIC_CONFIG.updateInterval) {
      this.updateTrafficData();
      this.lastUpdateTime = now;
    }
  }

  /**
   * Main traffic update logic
   * Calculates traffic volume and congestion for all road tiles
   */
  private updateTrafficData(): void {
    // Get grid from scene (MainScene has getGrid method)
    const grid = (this.scene as any).getGrid?.();
    if (!grid) return;

    // Reset all traffic data
    this.trafficData.clear();

    // Get all commuters from scene
    const commuters = (this.scene as any).getCommuters?.() as Commuter[] | undefined;
    if (!commuters || commuters.length === 0) {
      // No commuters yet, still calculate base traffic
      this.calculateBaseTraffic(grid);
      return;
    }

    // Calculate traffic from commuters
    this.calculateCommuterTraffic(grid, commuters);

    // Emit event for UI/overlay updates
    this.scene.events.emit('traffic:updated', this.trafficData);
  }

  /**
   * Calculate base traffic without commuter simulation
   * Used as fallback when commuter system is not available
   */
  private calculateBaseTraffic(grid: GridCell[][]): void {
    // Count developed zones to estimate traffic
    let residentialZones = 0;
    let commercialZones = 0;
    let industrialZones = 0;

    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const cell = grid[y][x];
        if (cell.type === TileType.Zone && cell.buildingId) {
          if (cell.zoneType === 'residential') residentialZones++;
          else if (cell.zoneType === 'commercial') commercialZones++;
          else if (cell.zoneType === 'industrial') industrialZones++;
        }
      }
    }

    // Estimate traffic volume (residential zones generate commuters)
    const totalCommuters = residentialZones * TRAFFIC_CONFIG.baseTrafficPerZone;

    // Distribute traffic across road network
    const roadTiles: { x: number; y: number }[] = [];
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const cell = grid[y][x];
        if (cell.type === TileType.Asphalt || cell.type === TileType.Road) {
          roadTiles.push({ x, y });
        }
      }
    }

    if (roadTiles.length === 0) return;

    // Simple distribution: divide traffic evenly across all roads
    const trafficPerRoad = totalCommuters / roadTiles.length;

    roadTiles.forEach(({ x, y }) => {
      const roadType = RoadType.Basic; // Default to basic road
      const capacity = ROAD_CAPACITY[roadType];
      const volume = Math.round(trafficPerRoad);
      const congestion = (volume / capacity) * 100;
      const congestionLevel = this.getCongestionLevel(congestion);

      this.trafficData.set(`${x},${y}`, {
        x,
        y,
        roadType,
        volume,
        capacity,
        congestion,
        congestionLevel,
      });
    });
  }

  /**
   * Calculate traffic from actual commuter paths
   */
  private calculateCommuterTraffic(grid: GridCell[][], commuters: Commuter[]): void {
    // Count commuters on each road tile
    const roadUsage = new Map<string, number>();

    commuters.forEach((commuter) => {
      // Only count traveling commuters
      if (
        commuter.state === CommuterState.TravelingToWork ||
        commuter.state === CommuterState.TravelingHome
      ) {
        // Skip if using transit
        if (commuter.usingTransit) return;

        // If commuter has a path, count all road tiles in the path
        if (commuter.path) {
          commuter.path.forEach((point) => {
            const key = `${point.x},${point.y}`;
            roadUsage.set(key, (roadUsage.get(key) || 0) + 1);
          });
        } else {
          // No path yet, just count current position if on road
          const x = Math.floor(commuter.currentX);
          const y = Math.floor(commuter.currentY);
          if (x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT) {
            const cell = grid[y][x];
            if (cell.type === TileType.Asphalt || cell.type === TileType.Road) {
              const key = `${x},${y}`;
              roadUsage.set(key, (roadUsage.get(key) || 0) + 1);
            }
          }
        }
      }
    });

    // Convert usage counts to traffic data
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const cell = grid[y][x];
        if (cell.type === TileType.Asphalt || cell.type === TileType.Road) {
          const key = `${x},${y}`;
          const volume = roadUsage.get(key) || 0;
          const roadType = RoadType.Basic; // TODO: Get from GridCell when road upgrades implemented
          const capacity = ROAD_CAPACITY[roadType];
          const congestion = (volume / capacity) * 100;
          const congestionLevel = this.getCongestionLevel(congestion);

          this.trafficData.set(key, {
            x,
            y,
            roadType,
            volume,
            capacity,
            congestion,
            congestionLevel,
          });
        }
      }
    }
  }

  /**
   * Determine congestion level from congestion percentage
   */
  private getCongestionLevel(congestion: number): CongestionLevel {
    if (congestion >= 100) return CongestionLevel.Gridlock;
    if (congestion >= 75) return CongestionLevel.Heavy;
    if (congestion >= 50) return CongestionLevel.Medium;
    if (congestion >= 25) return CongestionLevel.Light;
    return CongestionLevel.None;
  }

  /**
   * Get traffic data for a specific tile
   */
  getTrafficData(x: number, y: number): TrafficData | undefined {
    return this.trafficData.get(`${x},${y}`);
  }

  /**
   * Get all traffic data
   */
  getAllTrafficData(): Map<string, TrafficData> {
    return this.trafficData;
  }

  /**
   * Get traffic congestion at a specific location
   * Returns 0-100+ value for overlay system
   */
  getTrafficCongestion(x: number, y: number): number {
    const data = this.trafficData.get(`${x},${y}`);
    return data ? data.congestion : 0;
  }

  /**
   * Get average city-wide congestion
   */
  getAverageCongestion(): number {
    if (this.trafficData.size === 0) return 0;

    let totalCongestion = 0;
    this.trafficData.forEach((data) => {
      totalCongestion += data.congestion;
    });

    return totalCongestion / this.trafficData.size;
  }

  /**
   * Get growth penalty multiplier for a location based on traffic
   * Used by ZoningSystem to slow growth in congested areas
   */
  getGrowthMultiplier(x: number, y: number): number {
    // Check traffic on adjacent road tiles
    const adjacentPositions = [
      { x: x - 1, y },
      { x: x + 1, y },
      { x, y: y - 1 },
      { x, y: y + 1 },
    ];

    let worstCongestion = CongestionLevel.None;
    adjacentPositions.forEach((pos) => {
      const data = this.trafficData.get(`${pos.x},${pos.y}`);
      if (data && this.compareCongestion(data.congestionLevel, worstCongestion) > 0) {
        worstCongestion = data.congestionLevel;
      }
    });

    return TRAFFIC_CONFIG.congestionGrowthPenalty[worstCongestion];
  }

  /**
   * Get pollution multiplier based on traffic congestion
   * Used by PollutionSystem
   */
  getPollutionMultiplier(x: number, y: number): number {
    const data = this.trafficData.get(`${x},${y}`);
    if (!data) return 1.0;

    return TRAFFIC_CONFIG.congestionPollutionMultiplier[data.congestionLevel];
  }

  /**
   * Compare two congestion levels
   * Returns: -1 if a < b, 0 if equal, 1 if a > b
   */
  private compareCongestion(a: CongestionLevel, b: CongestionLevel): number {
    const order = [
      CongestionLevel.None,
      CongestionLevel.Light,
      CongestionLevel.Medium,
      CongestionLevel.Heavy,
      CongestionLevel.Gridlock,
    ];
    return order.indexOf(a) - order.indexOf(b);
  }

  /**
   * Get statistics for UI/advisors
   */
  getTrafficStats(): {
    totalRoads: number;
    averageCongestion: number;
    gridlockedRoads: number;
    heavyCongestionRoads: number;
    worstCongestionLocation: { x: number; y: number; congestion: number } | null;
  } {
    let totalRoads = 0;
    let totalCongestion = 0;
    let gridlockedRoads = 0;
    let heavyCongestionRoads = 0;
    let worstCongestion = 0;
    let worstLocation: { x: number; y: number; congestion: number } | null = null;

    this.trafficData.forEach((data) => {
      totalRoads++;
      totalCongestion += data.congestion;

      if (data.congestionLevel === CongestionLevel.Gridlock) {
        gridlockedRoads++;
      } else if (data.congestionLevel === CongestionLevel.Heavy) {
        heavyCongestionRoads++;
      }

      if (data.congestion > worstCongestion) {
        worstCongestion = data.congestion;
        worstLocation = { x: data.x, y: data.y, congestion: data.congestion };
      }
    });

    return {
      totalRoads,
      averageCongestion: totalRoads > 0 ? totalCongestion / totalRoads : 0,
      gridlockedRoads,
      heavyCongestionRoads,
      worstCongestionLocation: worstLocation,
    };
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.trafficData.clear();
    console.log('[TrafficSystem] Destroyed');
  }
}
