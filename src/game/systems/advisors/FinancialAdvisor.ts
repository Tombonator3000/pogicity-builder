import Phaser from 'phaser';
import { Advisor } from '../AdvisorSystem';
import {
  AdvisorType,
  AdvisorSeverity,
  AdvisorMessage,
} from '../../types';

/**
 * FinancialAdvisor
 * Monitors budget, taxes, and economy.
 *
 * Warnings:
 * - Running a deficit
 * - Low funds (< 1000 caps)
 * - No income sources
 * - Excessive expenses
 */
export class FinancialAdvisor implements Advisor {
  type = AdvisorType.Financial;

  checkForIssues(scene: Phaser.Scene): AdvisorMessage[] {
    const messages: Omit<AdvisorMessage, 'id' | 'timestamp'>[] = [];

    // Get resources from scene
    const resources = (scene as any).getResources?.();
    if (!resources) return [];

    // Critical: Very low funds
    if (resources.caps < 100) {
      messages.push({
        advisorType: this.type,
        severity: AdvisorSeverity.Critical,
        title: 'Critical: Nearly Bankrupt!',
        message:
          "We're almost out of caps! We need to increase income or drastically cut spending immediately, or the settlement will collapse.",
      });
    }
    // Warning: Low funds
    else if (resources.caps < 500) {
      messages.push({
        advisorType: this.type,
        severity: AdvisorSeverity.Warning,
        title: 'Low Funds',
        message:
          "Our cap reserves are running low. Consider building more trading posts or reducing expenses to avoid financial trouble.",
      });
    }

    // Check population for economy
    if (resources.population < 10) {
      messages.push({
        advisorType: this.type,
        severity: AdvisorSeverity.Info,
        title: 'Small Population',
        message:
          "With such a small population, our economy is limited. Build more housing and attract more settlers to grow our economy.",
      });
    }

    // Check resource production
    const resourceSystem = (scene as any).resourceSystem;
    if (resourceSystem) {
      const rates = resourceSystem.getNetProductionRates?.();
      if (rates) {
        // Warning about negative resource production
        if (rates.food < 0) {
          messages.push({
            advisorType: this.type,
            severity: AdvisorSeverity.Warning,
            title: 'Food Shortage',
            message:
              "We're consuming more food than we produce! Build farms or scavenging posts to increase food production.",
          });
        }

        if (rates.water < 0) {
          messages.push({
            advisorType: this.type,
            severity: AdvisorSeverity.Warning,
            title: 'Water Shortage',
            message:
              "Water consumption exceeds production! Build water pumps or purifiers immediately.",
          });
        }
      }
    }

    return messages as AdvisorMessage[];
  }
}
