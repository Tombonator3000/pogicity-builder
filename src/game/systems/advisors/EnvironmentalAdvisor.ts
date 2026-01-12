import Phaser from 'phaser';
import { Advisor } from '../AdvisorSystem';
import {
  AdvisorType,
  AdvisorSeverity,
  AdvisorMessage,
} from '../../types';

/**
 * EnvironmentalAdvisor
 * Monitors pollution and environmental health.
 *
 * Warnings:
 * - High pollution levels
 * - Pollution affecting health
 * - No parks or green spaces
 * - Radiation hotspots
 */
export class EnvironmentalAdvisor implements Advisor {
  type = AdvisorType.Environmental;

  checkForIssues(scene: Phaser.Scene): AdvisorMessage[] {
    const messages: Omit<AdvisorMessage, 'id' | 'timestamp'>[] = [];

    // Get pollution system
    const pollutionSystem = (scene as any).pollutionSystem;
    if (!pollutionSystem) return [];

    const stats = pollutionSystem.getPollutionStats?.();
    if (!stats) return [];

    // Critical: Very high pollution
    if (stats.criticalPollutionTiles > 20) {
      let message = `${stats.criticalPollutionTiles} areas have critical pollution levels! `;

      if (stats.worstPollutionLocation) {
        message += `The worst area is around (${stats.worstPollutionLocation.x}, ${stats.worstPollutionLocation.y}). `;
      }

      message += "People are getting sick! We need to clean this up or reduce industrial output immediately.";

      messages.push({
        advisorType: this.type,
        severity: AdvisorSeverity.Critical,
        title: 'Critical: Severe Pollution!',
        message,
        location: stats.worstPollutionLocation
          ? { x: stats.worstPollutionLocation.x, y: stats.worstPollutionLocation.y }
          : undefined,
      });
    }
    // Warning: High pollution
    else if (stats.highPollutionTiles > 30 || stats.averageAirPollution > 50) {
      messages.push({
        advisorType: this.type,
        severity: AdvisorSeverity.Warning,
        title: 'High Pollution Levels',
        message:
          "Pollution is getting dangerously high. Build parks to absorb pollution, or implement pollution controls on industry.",
      });
    }
    // Info: Moderate pollution
    else if (stats.averageAirPollution > 30) {
      messages.push({
        advisorType: this.type,
        severity: AdvisorSeverity.Info,
        title: 'Pollution Rising',
        message:
          "Pollution levels are starting to rise. Consider building parks or reducing industrial output.",
      });
    }

    // Check for industrial zones without pollution control
    const grid = (scene as any).getGrid?.();
    if (grid) {
      let industrialZones = 0;
      let parksNearIndustry = 0;

      // Count industrial zones
      for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
          const cell = grid[y][x];
          if (cell.type === 'zone' && cell.zoneType === 'industrial' && cell.buildingId) {
            industrialZones++;

            // Check for nearby parks
            if (this.hasNearbyPark(grid, x, y)) {
              parksNearIndustry++;
            }
          }
        }
      }

      // Warning: Industrial without mitigation
      if (industrialZones > 5 && parksNearIndustry < industrialZones * 0.3) {
        messages.push({
          advisorType: this.type,
          severity: AdvisorSeverity.Warning,
          title: 'Industrial Pollution Uncontrolled',
          message:
            "Our industrial areas are polluting heavily without mitigation. Build parks nearby to absorb some of the pollution.",
        });
      }
    }

    // Check for radiation hotspots (wasteland theme)
    if (stats.averageAirPollution > 40) {
      const resources = (scene as any).getResources?.();
      if (resources && resources.happiness < 60) {
        messages.push({
          advisorType: this.type,
          severity: AdvisorSeverity.Warning,
          title: 'Pollution Affecting Morale',
          message:
            "High pollution is making people unhappy and sick. We need to clean up the environment or people will leave.",
        });
      }
    }

    // Info: Suggest parks
    const resources = (scene as any).getResources?.();
    if (resources && resources.population > 30) {
      let parkCount = 0;

      if (grid) {
        for (let y = 0; y < grid.length; y++) {
          for (let x = 0; x < grid[y].length; x++) {
            const cell = grid[y][x];
            if (cell.buildingId) {
              const building = (scene as any).getBuildingDefinition?.(cell.buildingId);
              if (building?.category === 'landmark' || building?.isDecoration) {
                parkCount++;
              }
            }
          }
        }
      }

      if (parkCount === 0) {
        messages.push({
          advisorType: this.type,
          severity: AdvisorSeverity.Info,
          title: 'No Green Spaces',
          message:
            "We don't have any parks or green spaces. Parks reduce pollution, increase happiness, and improve land value.",
        });
      }
    }

    return messages as AdvisorMessage[];
  }

  /**
   * Check if a tile has a nearby park (within 5 tiles)
   */
  private hasNearbyPark(grid: any[][], x: number, y: number): boolean {
    const radius = 5;

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const checkX = x + dx;
        const checkY = y + dy;

        if (
          checkX < 0 ||
          checkX >= grid[0].length ||
          checkY < 0 ||
          checkY >= grid.length
        ) {
          continue;
        }

        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > radius) continue;

        const cell = grid[checkY][checkX];
        if (cell.buildingId) {
          // Simple check: landmarks and decorations are "parks"
          const building = (this as any).scene?.getBuildingDefinition?.(cell.buildingId);
          if (building?.category === 'landmark' || building?.isDecoration) {
            return true;
          }
        }
      }
    }

    return false;
  }
}
