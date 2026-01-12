import Phaser from 'phaser';
import { Advisor } from '../AdvisorSystem';
import {
  AdvisorType,
  AdvisorSeverity,
  AdvisorMessage,
} from '../../types';

/**
 * UtilitiesAdvisor
 * Monitors power and water infrastructure.
 *
 * Warnings:
 * - Power demand exceeds supply
 * - Water demand exceeds supply
 * - Buildings without power
 * - Buildings without water
 */
export class UtilitiesAdvisor implements Advisor {
  type = AdvisorType.Utilities;

  checkForIssues(scene: Phaser.Scene): AdvisorMessage[] {
    const messages: Omit<AdvisorMessage, 'id' | 'timestamp'>[] = [];

    // Get resource system
    const resourceSystem = (scene as any).resourceSystem;
    if (!resourceSystem) return [];

    const rates = resourceSystem.getNetProductionRates?.();
    if (!rates) return [];

    // Critical: Negative power production
    if (rates.power < -5) {
      messages.push({
        advisorType: this.type,
        severity: AdvisorSeverity.Critical,
        title: 'Critical: Power Shortage!',
        message:
          "We're using far more power than we produce! Build more generators immediately, or buildings will shut down.",
      });
    } else if (rates.power < 0) {
      messages.push({
        advisorType: this.type,
        severity: AdvisorSeverity.Warning,
        title: 'Power Demand High',
        message:
          "Power consumption is exceeding production. Build another generator before we run out.",
      });
    }

    // Critical: Negative water production
    if (rates.water < -5) {
      messages.push({
        advisorType: this.type,
        severity: AdvisorSeverity.Critical,
        title: 'Critical: Water Shortage!',
        message:
          "Water consumption is dangerously high! Build more water pumps immediately, or people will die of thirst.",
      });
    } else if (rates.water < 0) {
      messages.push({
        advisorType: this.type,
        severity: AdvisorSeverity.Warning,
        title: 'Water Demand High',
        message:
          "We're using more water than we produce. Build more pumps or purifiers soon.",
      });
    }

    // Check coverage
    const overlaySystem = (scene as any).overlaySystem;
    if (overlaySystem) {
      const grid = (scene as any).getGrid?.();
      if (grid) {
        let noPowerTiles = 0;
        let noWaterTiles = 0;
        let totalBuildings = 0;

        for (let y = 0; y < grid.length; y++) {
          for (let x = 0; x < grid[y].length; x++) {
            const cell = grid[y][x];
            if (cell.type === 'building' || (cell.type === 'zone' && cell.buildingId)) {
              totalBuildings++;

              if (cell.overlayData) {
                if (!cell.overlayData.power || cell.overlayData.power < 50) {
                  noPowerTiles++;
                }
                if (!cell.overlayData.water || cell.overlayData.water < 50) {
                  noWaterTiles++;
                }
              }
            }
          }
        }

        // Warning: Many buildings without power
        if (totalBuildings > 0) {
          const powerCoveragePercent = ((totalBuildings - noPowerTiles) / totalBuildings) * 100;
          const waterCoveragePercent = ((totalBuildings - noWaterTiles) / totalBuildings) * 100;

          if (powerCoveragePercent < 60) {
            messages.push({
              advisorType: this.type,
              severity: AdvisorSeverity.Warning,
              title: 'Low Power Coverage',
              message:
                `Only ${Math.round(powerCoveragePercent)}% of buildings have power. Expand the power grid!`,
            });
          }

          if (waterCoveragePercent < 60) {
            messages.push({
              advisorType: this.type,
              severity: AdvisorSeverity.Warning,
              title: 'Low Water Coverage',
              message:
                `Only ${Math.round(waterCoveragePercent)}% of buildings have water. Build more pumps!`,
            });
          }
        }
      }
    }

    return messages as AdvisorMessage[];
  }
}
