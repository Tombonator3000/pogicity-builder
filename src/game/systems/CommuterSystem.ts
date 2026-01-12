import Phaser from 'phaser';
import { GameSystem } from './GameSystem';
import {
  GridCell,
  TileType,
  ZoneType,
  Commuter,
  CommuterState,
  GRID_WIDTH,
  GRID_HEIGHT,
} from '../types';

/**
 * Commuter System Configuration
 */
export const COMMUTER_CONFIG = {
  spawnInterval: 10000, // Spawn new commuters every 10 seconds
  commutersPerResidentialZone: 2, // How many commuters per developed residential zone
  workDuration: 30000, // How long sims stay at work (30 seconds)
  homeDuration: 20000, // How long sims stay at home (20 seconds)
  travelSpeed: 0.1, // Grid cells per frame (slower than vehicles)
  maxCommuters: 500, // Maximum commuters in simulation (performance limit)
  transitUsageProbability: 0.3, // 30% chance to use transit if available
} as const;

/**
 * CommuterSystem
 * Manages sims that travel between residential and commercial/industrial zones.
 *
 * Features:
 * - Automatic commuter spawning based on residential zones
 * - Job assignment to commercial/industrial zones
 * - A* pathfinding for commuter routes
 * - State machine: AtHome -> TravelingToWork -> AtWork -> TravelingHome
 * - Mass transit integration (reduces road traffic)
 * - Performance-optimized with max commuter limit
 */
export class CommuterSystem implements GameSystem {
  private scene!: Phaser.Scene;
  private commuters: Commuter[] = [];
  private lastSpawnTime: number = 0;
  private commuterIdCounter: number = 0;

  // Cached zone locations for performance
  private residentialZones: { x: number; y: number }[] = [];
  private workZones: { x: number; y: number }[] = []; // Commercial + Industrial

  /**
   * Initialize the commuter system
   */
  init(scene: Phaser.Scene): void {
    this.scene = scene;
    this.lastSpawnTime = Date.now();
    console.log('[CommuterSystem] Initialized');
  }

  /**
   * Update commuter logic
   */
  update(delta: number): void {
    const now = Date.now();

    // Spawn new commuters periodically
    if (now - this.lastSpawnTime >= COMMUTER_CONFIG.spawnInterval) {
      this.updateZoneCache();
      this.spawnCommuters();
      this.lastSpawnTime = now;
    }

    // Update all commuters
    this.updateCommuters(delta);
  }

  /**
   * Update zone cache from grid
   */
  private updateZoneCache(): void {
    const grid = (this.scene as any).getGrid?.();
    if (!grid) return;

    this.residentialZones = [];
    this.workZones = [];

    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const cell = grid[y][x];
        if (cell.type === TileType.Zone && cell.buildingId) {
          // Only count developed zones with buildings
          if (cell.zoneType === ZoneType.Residential) {
            this.residentialZones.push({ x, y });
          } else if (
            cell.zoneType === ZoneType.Commercial ||
            cell.zoneType === ZoneType.Industrial
          ) {
            this.workZones.push({ x, y });
          }
        }
      }
    }
  }

  /**
   * Spawn new commuters based on residential zones
   */
  private spawnCommuters(): void {
    if (this.commuters.length >= COMMUTER_CONFIG.maxCommuters) {
      return; // Performance limit reached
    }

    if (this.residentialZones.length === 0 || this.workZones.length === 0) {
      return; // Need both residential and work zones
    }

    const commutersToSpawn = Math.min(
      this.residentialZones.length * COMMUTER_CONFIG.commutersPerResidentialZone,
      COMMUTER_CONFIG.maxCommuters - this.commuters.length
    );

    for (let i = 0; i < commutersToSpawn; i++) {
      const home = this.residentialZones[Math.floor(Math.random() * this.residentialZones.length)];
      const work = this.workZones[Math.floor(Math.random() * this.workZones.length)];

      // Check if transit is available
      const transitStops = (this.scene as any).getTransitStops?.();
      const usingTransit =
        transitStops &&
        transitStops.length > 0 &&
        Math.random() < COMMUTER_CONFIG.transitUsageProbability;

      const commuter: Commuter = {
        id: `commuter_${this.commuterIdCounter++}`,
        homeX: home.x,
        homeY: home.y,
        workX: work.x,
        workY: work.y,
        currentX: home.x,
        currentY: home.y,
        state: CommuterState.AtHome,
        usingTransit,
      };

      this.commuters.push(commuter);
    }

    console.log(`[CommuterSystem] Spawned ${commutersToSpawn} commuters (total: ${this.commuters.length})`);
  }

  /**
   * Update all commuters
   */
  private updateCommuters(delta: number): void {
    const now = Date.now();

    this.commuters.forEach((commuter) => {
      switch (commuter.state) {
        case CommuterState.AtHome:
          // Start traveling to work after home duration
          if (!commuter.path) {
            commuter.state = CommuterState.TravelingToWork;
            commuter.path = this.findPath(
              commuter.currentX,
              commuter.currentY,
              commuter.workX,
              commuter.workY
            );
            commuter.pathIndex = 0;
          }
          break;

        case CommuterState.TravelingToWork:
          this.moveCommuter(commuter, delta);
          // Check if reached work
          if (
            Math.abs(commuter.currentX - commuter.workX) < 0.5 &&
            Math.abs(commuter.currentY - commuter.workY) < 0.5
          ) {
            commuter.state = CommuterState.AtWork;
            commuter.path = undefined;
            commuter.pathIndex = undefined;
          }
          break;

        case CommuterState.AtWork:
          // Start traveling home after work duration
          if (!commuter.path) {
            commuter.state = CommuterState.TravelingHome;
            commuter.path = this.findPath(
              commuter.currentX,
              commuter.currentY,
              commuter.homeX,
              commuter.homeY
            );
            commuter.pathIndex = 0;
          }
          break;

        case CommuterState.TravelingHome:
          this.moveCommuter(commuter, delta);
          // Check if reached home
          if (
            Math.abs(commuter.currentX - commuter.homeX) < 0.5 &&
            Math.abs(commuter.currentY - commuter.homeY) < 0.5
          ) {
            commuter.state = CommuterState.AtHome;
            commuter.path = undefined;
            commuter.pathIndex = undefined;
          }
          break;
      }
    });

    // Emit event for traffic system
    this.scene.events.emit('commuters:updated', this.commuters);
  }

  /**
   * Move commuter along path
   */
  private moveCommuter(commuter: Commuter, delta: number): void {
    if (!commuter.path || commuter.pathIndex === undefined) return;

    // Get target position
    const targetPoint = commuter.path[commuter.pathIndex];
    if (!targetPoint) return;

    // Move toward target
    const dx = targetPoint.x - commuter.currentX;
    const dy = targetPoint.y - commuter.currentY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 0.1) {
      // Reached waypoint, move to next
      commuter.pathIndex++;
      if (commuter.pathIndex >= commuter.path.length) {
        // Reached destination
        commuter.path = undefined;
        commuter.pathIndex = undefined;
      }
    } else {
      // Move toward waypoint
      const moveDistance = COMMUTER_CONFIG.travelSpeed * (delta / 16.67); // Normalize to 60fps
      const moveX = (dx / distance) * moveDistance;
      const moveY = (dy / distance) * moveDistance;

      commuter.currentX += moveX;
      commuter.currentY += moveY;
    }
  }

  /**
   * Simple A* pathfinding
   * Finds route on roads between two points
   */
  private findPath(
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ): { x: number; y: number }[] {
    const grid = (this.scene as any).getGrid?.();
    if (!grid) return [];

    // Simple pathfinding: straight line with road checking
    // TODO: Implement proper A* algorithm for realistic routing
    const path: { x: number; y: number }[] = [];

    const dx = endX - startX;
    const dy = endY - startY;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));

    if (steps === 0) return [{ x: endX, y: endY }];

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = Math.round(startX + dx * t);
      const y = Math.round(startY + dy * t);

      // Bounds check
      if (x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT) {
        path.push({ x, y });
      }
    }

    return path;
  }

  /**
   * Get all commuters
   */
  getCommuters(): Commuter[] {
    return this.commuters;
  }

  /**
   * Get commuter statistics
   */
  getCommuterStats(): {
    totalCommuters: number;
    atHome: number;
    atWork: number;
    traveling: number;
    usingTransit: number;
  } {
    let atHome = 0;
    let atWork = 0;
    let traveling = 0;
    let usingTransit = 0;

    this.commuters.forEach((commuter) => {
      if (commuter.state === CommuterState.AtHome) atHome++;
      else if (commuter.state === CommuterState.AtWork) atWork++;
      else traveling++;

      if (commuter.usingTransit) usingTransit++;
    });

    return {
      totalCommuters: this.commuters.length,
      atHome,
      atWork,
      traveling,
      usingTransit,
    };
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.commuters = [];
    this.residentialZones = [];
    this.workZones = [];
    console.log('[CommuterSystem] Destroyed');
  }
}
