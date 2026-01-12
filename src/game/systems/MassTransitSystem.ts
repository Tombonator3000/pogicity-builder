import Phaser from 'phaser';
import { GameSystem } from './GameSystem';
import {
  MassTransitType,
  TransitStop,
  TransitRoute,
  GRID_WIDTH,
  GRID_HEIGHT,
} from '../types';

/**
 * Mass Transit Configuration
 */
export const TRANSIT_CONFIG = {
  updateInterval: 5000, // Update ridership every 5 seconds

  // Transit type properties
  capacity: {
    [MassTransitType.Bus]: 200, // Commuters per day
    [MassTransitType.Subway]: 1000,
    [MassTransitType.Train]: 1500,
  },

  monthlyCost: {
    [MassTransitType.Bus]: 50, // Caps per month
    [MassTransitType.Subway]: 200,
    [MassTransitType.Train]: 300,
  },

  // Coverage radius (how far commuters will walk to stop)
  coverageRadius: {
    [MassTransitType.Bus]: 5, // Grid tiles
    [MassTransitType.Subway]: 10,
    [MassTransitType.Train]: 15,
  },

  // Construction costs
  constructionCost: {
    [MassTransitType.Bus]: 100, // Caps
    [MassTransitType.Subway]: 500,
    [MassTransitType.Train]: 800,
  },

  trafficReduction: 0.3, // 30% of commuters use transit, reducing road traffic
} as const;

/**
 * MassTransitSystem
 * Manages public transportation: buses, subways, and trains.
 *
 * Features:
 * - Transit stops (bus stops, subway stations, train stations)
 * - Transit routes connecting multiple stops
 * - Ridership calculation based on commuters and coverage
 * - Monthly maintenance costs
 * - Reduces road traffic when available
 * - Supports multiple routes per stop
 */
export class MassTransitSystem implements GameSystem {
  private scene!: Phaser.Scene;
  private transitStops: TransitStop[] = [];
  private transitRoutes: TransitRoute[] = [];
  private lastUpdateTime: number = 0;
  private stopIdCounter: number = 0;
  private routeIdCounter: number = 0;

  /**
   * Initialize the mass transit system
   */
  init(scene: Phaser.Scene): void {
    this.scene = scene;
    this.lastUpdateTime = Date.now();
    console.log('[MassTransitSystem] Initialized');
  }

  /**
   * Update transit system
   */
  update(delta: number): void {
    const now = Date.now();
    if (now - this.lastUpdateTime >= TRANSIT_CONFIG.updateInterval) {
      this.updateRidership();
      this.lastUpdateTime = now;
    }
  }

  /**
   * Add a transit stop
   */
  addStop(type: MassTransitType, x: number, y: number): TransitStop {
    const stop: TransitStop = {
      id: `stop_${this.stopIdCounter++}`,
      type,
      x,
      y,
      ridership: 0,
      routeIds: [],
    };

    this.transitStops.push(stop);
    console.log(`[MassTransitSystem] Added ${type} stop at (${x}, ${y})`);

    this.scene.events.emit('transit:stopAdded', stop);
    return stop;
  }

  /**
   * Remove a transit stop
   */
  removeStop(stopId: string): void {
    const index = this.transitStops.findIndex((s) => s.id === stopId);
    if (index === -1) return;

    const stop = this.transitStops[index];

    // Remove stop from all routes
    this.transitRoutes.forEach((route) => {
      const stopIndex = route.stops.indexOf(stopId);
      if (stopIndex !== -1) {
        route.stops.splice(stopIndex, 1);
      }
    });

    this.transitStops.splice(index, 1);
    console.log(`[MassTransitSystem] Removed stop ${stopId}`);

    this.scene.events.emit('transit:stopRemoved', stopId);
  }

  /**
   * Create a transit route connecting multiple stops
   */
  createRoute(type: MassTransitType, stopIds: string[]): TransitRoute | null {
    // Validate stops exist and are same type
    const stops = stopIds
      .map((id) => this.transitStops.find((s) => s.id === id))
      .filter((s) => s !== undefined) as TransitStop[];

    if (stops.length < 2) {
      console.warn('[MassTransitSystem] Route needs at least 2 stops');
      return null;
    }

    if (!stops.every((s) => s.type === type)) {
      console.warn('[MassTransitSystem] All stops must be same type');
      return null;
    }

    const route: TransitRoute = {
      id: `route_${this.routeIdCounter++}`,
      type,
      stops: stopIds,
      capacity: TRANSIT_CONFIG.capacity[type],
      cost: TRANSIT_CONFIG.monthlyCost[type],
      ridership: 0,
    };

    this.transitRoutes.push(route);

    // Add route to stops
    stops.forEach((stop) => {
      stop.routeIds.push(route.id);
    });

    console.log(`[MassTransitSystem] Created ${type} route with ${stopIds.length} stops`);
    this.scene.events.emit('transit:routeCreated', route);

    return route;
  }

  /**
   * Remove a transit route
   */
  removeRoute(routeId: string): void {
    const index = this.transitRoutes.findIndex((r) => r.id === routeId);
    if (index === -1) return;

    const route = this.transitRoutes[index];

    // Remove route from all stops
    route.stops.forEach((stopId) => {
      const stop = this.transitStops.find((s) => s.id === stopId);
      if (stop) {
        const routeIndex = stop.routeIds.indexOf(routeId);
        if (routeIndex !== -1) {
          stop.routeIds.splice(routeIndex, 1);
        }
      }
    });

    this.transitRoutes.splice(index, 1);
    console.log(`[MassTransitSystem] Removed route ${routeId}`);

    this.scene.events.emit('transit:routeRemoved', routeId);
  }

  /**
   * Update ridership based on commuters
   */
  private updateRidership(): void {
    // Get commuters from scene
    const commuters = (this.scene as any).getCommuters?.();
    if (!commuters || commuters.length === 0) {
      // Reset all ridership
      this.transitStops.forEach((stop) => (stop.ridership = 0));
      this.transitRoutes.forEach((route) => (route.ridership = 0));
      return;
    }

    // Count commuters using transit near each stop
    this.transitStops.forEach((stop) => {
      stop.ridership = 0;

      const coverageRadius = TRANSIT_CONFIG.coverageRadius[stop.type];

      commuters.forEach((commuter: any) => {
        if (commuter.usingTransit) {
          // Check if commuter is within coverage
          const dx = Math.abs(commuter.currentX - stop.x);
          const dy = Math.abs(commuter.currentY - stop.y);
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance <= coverageRadius) {
            stop.ridership++;
          }
        }
      });
    });

    // Update route ridership (sum of all stops on route)
    this.transitRoutes.forEach((route) => {
      route.ridership = 0;
      route.stops.forEach((stopId) => {
        const stop = this.transitStops.find((s) => s.id === stopId);
        if (stop) {
          route.ridership += stop.ridership;
        }
      });

      // Cap at route capacity
      route.ridership = Math.min(route.ridership, route.capacity);
    });

    this.scene.events.emit('transit:ridershipUpdated', {
      stops: this.transitStops,
      routes: this.transitRoutes,
    });
  }

  /**
   * Get all transit stops
   */
  getTransitStops(): TransitStop[] {
    return this.transitStops;
  }

  /**
   * Get all transit routes
   */
  getTransitRoutes(): TransitRoute[] {
    return this.transitRoutes;
  }

  /**
   * Get total monthly cost of transit system
   */
  getMonthlyTransitCost(): number {
    let totalCost = 0;
    this.transitRoutes.forEach((route) => {
      totalCost += route.cost;
    });
    return totalCost;
  }

  /**
   * Get transit statistics
   */
  getTransitStats(): {
    totalStops: number;
    totalRoutes: number;
    totalRidership: number;
    monthlyCost: number;
    stopsByType: Record<MassTransitType, number>;
    routesByType: Record<MassTransitType, number>;
  } {
    const stopsByType: Record<MassTransitType, number> = {
      [MassTransitType.Bus]: 0,
      [MassTransitType.Subway]: 0,
      [MassTransitType.Train]: 0,
    };

    const routesByType: Record<MassTransitType, number> = {
      [MassTransitType.Bus]: 0,
      [MassTransitType.Subway]: 0,
      [MassTransitType.Train]: 0,
    };

    let totalRidership = 0;

    this.transitStops.forEach((stop) => {
      stopsByType[stop.type]++;
      totalRidership += stop.ridership;
    });

    this.transitRoutes.forEach((route) => {
      routesByType[route.type]++;
    });

    return {
      totalStops: this.transitStops.length,
      totalRoutes: this.transitRoutes.length,
      totalRidership,
      monthlyCost: this.getMonthlyTransitCost(),
      stopsByType,
      routesByType,
    };
  }

  /**
   * Check if a location is covered by transit
   */
  isLocationCovered(x: number, y: number): boolean {
    return this.transitStops.some((stop) => {
      const coverageRadius = TRANSIT_CONFIG.coverageRadius[stop.type];
      const dx = Math.abs(x - stop.x);
      const dy = Math.abs(y - stop.y);
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= coverageRadius;
    });
  }

  /**
   * Get nearest transit stop to a location
   */
  getNearestStop(x: number, y: number): TransitStop | null {
    if (this.transitStops.length === 0) return null;

    let nearestStop: TransitStop | null = null;
    let minDistance = Infinity;

    this.transitStops.forEach((stop) => {
      const dx = x - stop.x;
      const dy = y - stop.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < minDistance) {
        minDistance = distance;
        nearestStop = stop;
      }
    });

    return nearestStop;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.transitStops = [];
    this.transitRoutes = [];
    console.log('[MassTransitSystem] Destroyed');
  }
}
