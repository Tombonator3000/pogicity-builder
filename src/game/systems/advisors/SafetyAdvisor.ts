import Phaser from 'phaser';
import { Advisor } from '../AdvisorSystem';
import {
  AdvisorType,
  AdvisorSeverity,
  AdvisorMessage,
} from '../../types';

/**
 * SafetyAdvisor
 * Monitors security, crime, fire hazards, and disaster preparedness.
 *
 * Warnings:
 * - High crime/raider threat
 * - No security buildings
 * - High fire hazard areas
 * - Low happiness (leads to crime)
 */
export class SafetyAdvisor implements Advisor {
  type = AdvisorType.Safety;

  checkForIssues(scene: Phaser.Scene): AdvisorMessage[] {
    const messages: Omit<AdvisorMessage, 'id' | 'timestamp'>[] = [];

    // Get overlay system for crime/fire data
    const overlaySystem = (scene as any).overlaySystem;
    if (!overlaySystem) return [];

    // Check for high crime areas
    const grid = (scene as any).getGrid?.();
    if (grid) {
      let highCrimeTiles = 0;
      let highFireTiles = 0;

      for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
          const cell = grid[y][x];
          if (cell.overlayData) {
            if (cell.overlayData.crime && cell.overlayData.crime > 70) {
              highCrimeTiles++;
            }
            if (cell.overlayData.fire && cell.overlayData.fire > 70) {
              highFireTiles++;
            }
          }
        }
      }

      // Critical: High crime
      if (highCrimeTiles > 50) {
        messages.push({
          advisorType: this.type,
          severity: AdvisorSeverity.Critical,
          title: 'Critical: High Raider Threat!',
          message:
            "Raider activity is at dangerous levels! We need more guard towers and militia immediately, or we'll lose settlers.",
        });
      } else if (highCrimeTiles > 20) {
        messages.push({
          advisorType: this.type,
          severity: AdvisorSeverity.Warning,
          title: 'Rising Raider Threat',
          message:
            "Raider activity is increasing in several areas. Build more guard towers to protect our settlement.",
        });
      }

      // Warning: High fire hazard
      if (highFireTiles > 30) {
        messages.push({
          advisorType: this.type,
          severity: AdvisorSeverity.Warning,
          title: 'Fire Hazard',
          message:
            "Several areas have high fire risk! Build fire stations to protect against catastrophic fires.",
        });
      }
    }

    // Check happiness (low happiness leads to unrest)
    const resources = (scene as any).getResources?.();
    if (resources && resources.happiness < 40) {
      messages.push({
        advisorType: this.type,
        severity: AdvisorSeverity.Warning,
        title: 'Low Morale',
        message:
          "Settler morale is dangerously low. Unhappy people are more likely to cause trouble or leave. Improve living conditions!",
      });
    }

    // Check population without security
    if (resources && resources.population > 20) {
      // Count security buildings
      let securityBuildings = 0;
      if (grid) {
        for (let y = 0; y < grid.length; y++) {
          for (let x = 0; x < grid[y].length; x++) {
            const cell = grid[y][x];
            if (cell.buildingId) {
              const building = (scene as any).getBuildingDefinition?.(cell.buildingId);
              if (building?.category === 'defense') {
                securityBuildings++;
              }
            }
          }
        }
      }

      if (securityBuildings === 0) {
        messages.push({
          advisorType: this.type,
          severity: AdvisorSeverity.Warning,
          title: 'No Security',
          message:
            "With this many settlers, we need security! Build guard towers to protect against raiders and keep order.",
        });
      }
    }

    return messages as AdvisorMessage[];
  }
}
