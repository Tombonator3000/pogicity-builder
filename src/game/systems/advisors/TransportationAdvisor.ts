import Phaser from 'phaser';
import { Advisor } from '../AdvisorSystem';
import {
  AdvisorType,
  AdvisorSeverity,
  AdvisorMessage,
} from '../../types';

/**
 * TransportationAdvisor
 * Monitors traffic, roads, and mass transit.
 *
 * Warnings:
 * - High traffic congestion
 * - Gridlocked roads
 * - No mass transit
 * - Traffic affecting zone growth
 */
export class TransportationAdvisor implements Advisor {
  type = AdvisorType.Transportation;

  checkForIssues(scene: Phaser.Scene): AdvisorMessage[] {
    const messages: Omit<AdvisorMessage, 'id' | 'timestamp'>[] = [];

    // Get traffic system
    const trafficSystem = (scene as any).trafficSystem;
    if (!trafficSystem) return [];

    const stats = trafficSystem.getTrafficStats?.();
    if (!stats) return [];

    // Critical: Gridlock
    if (stats.gridlockedRoads > 10) {
      let message = `${stats.gridlockedRoads} roads are completely gridlocked! Traffic is strangling the settlement. `;

      if (stats.worstCongestionLocation) {
        message += `The worst area is around (${stats.worstCongestionLocation.x}, ${stats.worstCongestionLocation.y}). `;
      }

      message += "Build mass transit or expand roads immediately!";

      messages.push({
        advisorType: this.type,
        severity: AdvisorSeverity.Critical,
        title: 'Critical: Traffic Gridlock!',
        message,
        location: stats.worstCongestionLocation
          ? { x: stats.worstCongestionLocation.x, y: stats.worstCongestionLocation.y }
          : undefined,
      });
    }
    // Warning: Heavy congestion
    else if (stats.heavyCongestionRoads > 15 || stats.averageCongestion > 60) {
      messages.push({
        advisorType: this.type,
        severity: AdvisorSeverity.Warning,
        title: 'Heavy Traffic Congestion',
        message:
          "Traffic is getting bad. Consider building mass transit (buses, subway) or upgrading roads to handle the load.",
      });
    }
    // Info: Moderate congestion
    else if (stats.averageCongestion > 40) {
      messages.push({
        advisorType: this.type,
        severity: AdvisorSeverity.Info,
        title: 'Traffic Building Up',
        message:
          "Traffic is starting to build up on our roads. Keep an eye on congestion as the settlement grows.",
      });
    }

    // Check for mass transit
    const transitSystem = (scene as any).massTransitSystem;
    if (transitSystem) {
      const transitStats = transitSystem.getTransitStats?.();

      // Suggest mass transit if population is high but no transit
      const resources = (scene as any).getResources?.();
      if (
        resources &&
        resources.population > 50 &&
        transitStats &&
        transitStats.totalStops === 0
      ) {
        messages.push({
          advisorType: this.type,
          severity: AdvisorSeverity.Info,
          title: 'Consider Mass Transit',
          message:
            "With this many people, mass transit would help reduce road congestion. Consider building bus stops or a subway system.",
        });
      }

      // Info: Transit underused
      if (
        transitStats &&
        transitStats.totalStops > 0 &&
        transitStats.totalRidership < 10
      ) {
        messages.push({
          advisorType: this.type,
          severity: AdvisorSeverity.Info,
          title: 'Low Transit Ridership',
          message:
            "Our transit system isn't being used much. Make sure stops are near residential and work areas.",
        });
      }
    }

    // Warning: No roads to developed zones
    const grid = (scene as any).getGrid?.();
    if (grid) {
      let zonesWithoutRoads = 0;

      for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
          const cell = grid[y][x];
          if (cell.type === 'zone' && cell.buildingId) {
            // Check if adjacent to road
            const hasAdjacentRoad = this.hasAdjacentRoad(grid, x, y);
            if (!hasAdjacentRoad) {
              zonesWithoutRoads++;
            }
          }
        }
      }

      if (zonesWithoutRoads > 5) {
        messages.push({
          advisorType: this.type,
          severity: AdvisorSeverity.Warning,
          title: 'Zones Without Road Access',
          message:
            `${zonesWithoutRoads} developed zones lack road access! Connect them to the road network for proper traffic flow.`,
        });
      }
    }

    return messages as AdvisorMessage[];
  }

  /**
   * Check if a tile has an adjacent road
   */
  private hasAdjacentRoad(grid: any[][], x: number, y: number): boolean {
    const neighbors = [
      { x: x - 1, y },
      { x: x + 1, y },
      { x, y: y - 1 },
      { x, y: y + 1 },
    ];

    return neighbors.some((pos) => {
      if (pos.x < 0 || pos.x >= grid[0].length || pos.y < 0 || pos.y >= grid.length) {
        return false;
      }

      const cell = grid[pos.y][pos.x];
      return cell.type === 'road' || cell.type === 'asphalt';
    });
  }
}
