import Phaser from 'phaser';
import { GameSystem } from './GameSystem';
import { Ordinance, OrdinanceCategory } from '../types';

/**
 * Configuration for ordinance system
 */
const ORDINANCE_CONFIG = {
  updateInterval: 30000, // Check monthly costs every 30 seconds (1 month)
  maxActiveOrdinances: 10, // Maximum simultaneous ordinances
};

/**
 * Predefined ordinances (wasteland-themed)
 */
export const ORDINANCES: Record<string, Omit<Ordinance, 'enabled'>> = {
  // FINANCE ORDINANCES
  ord_ration_system: {
    id: 'ord_ration_system',
    category: OrdinanceCategory.Finance,
    name: 'Ration Control System',
    description: 'Implement food and water rationing. Reduces consumption but decreases happiness.',
    monthlyCost: -30, // Saves money
    effects: {
      happinessModifier: -10,
      productionModifier: -0.2, // 20% less food/water consumption
    },
  },

  ord_tax_break: {
    id: 'ord_tax_break',
    category: OrdinanceCategory.Finance,
    name: 'Tax Break for Traders',
    description: 'Reduce taxes to attract more traders and boost economy.',
    monthlyCost: -50, // Costs money (lost tax revenue)
    effects: {
      happinessModifier: 10,
      taxRateModifier: -0.3, // 30% less tax income
      productionModifier: 0.15, // 15% more caps production
    },
    requirements: {
      minPopulation: 20,
    },
  },

  ord_heavy_taxation: {
    id: 'ord_heavy_taxation',
    category: OrdinanceCategory.Finance,
    name: 'Heavy Taxation',
    description: 'Increase taxes to boost income, but citizens will be unhappy.',
    monthlyCost: 0,
    effects: {
      happinessModifier: -20,
      taxRateModifier: 0.5, // 50% more tax income
    },
    requirements: {
      minPopulation: 30,
    },
  },

  ord_scavenger_subsidies: {
    id: 'ord_scavenger_subsidies',
    category: OrdinanceCategory.Finance,
    name: 'Scavenger Subsidies',
    description: 'Pay bonuses to scavengers to boost scrap collection.',
    monthlyCost: 100,
    effects: {
      happinessModifier: 5,
      productionModifier: 0.25, // 25% more scrap production
    },
    requirements: {
      minPopulation: 15,
    },
  },

  // SAFETY ORDINANCES
  ord_curfew: {
    id: 'ord_curfew',
    category: OrdinanceCategory.Safety,
    name: 'Night Curfew',
    description: 'Enforce nighttime curfew to reduce raider threat.',
    monthlyCost: 50,
    effects: {
      happinessModifier: -15,
      crimeModifier: -0.4, // 40% less crime/raider threat
      productionModifier: -0.1, // 10% less production
    },
    requirements: {
      minPopulation: 20,
      requiredBuildings: ['guard_tower'],
    },
  },

  ord_disaster_preparedness: {
    id: 'ord_disaster_preparedness',
    category: OrdinanceCategory.Safety,
    name: 'Disaster Preparedness Program',
    description: 'Train citizens for disasters. Reduces disaster damage.',
    monthlyCost: 80,
    effects: {
      happinessModifier: 5,
      disasterRiskModifier: -0.3, // 30% less disaster damage
    },
    requirements: {
      minPopulation: 25,
    },
  },

  ord_militia_training: {
    id: 'ord_militia_training',
    category: OrdinanceCategory.Safety,
    name: 'Mandatory Militia Training',
    description: 'All able settlers train as militia. Better defense, lower happiness.',
    monthlyCost: 70,
    effects: {
      happinessModifier: -10,
      crimeModifier: -0.5, // 50% less crime
      disasterRiskModifier: -0.2, // 20% less damage from hostile disasters
    },
    requirements: {
      minPopulation: 30,
      requiredBuildings: ['guard_tower'],
    },
  },

  ord_security_patrols: {
    id: 'ord_security_patrols',
    category: OrdinanceCategory.Safety,
    name: 'Security Patrols',
    description: 'Regular patrols around the settlement perimeter.',
    monthlyCost: 60,
    effects: {
      crimeModifier: -0.3, // 30% less crime
      happinessModifier: 5,
    },
    requirements: {
      minPopulation: 15,
      requiredBuildings: ['guard_tower'],
    },
  },

  // ENVIRONMENT ORDINANCES
  ord_pollution_controls: {
    id: 'ord_pollution_controls',
    category: OrdinanceCategory.Environment,
    name: 'Pollution Controls',
    description: 'Implement strict radiation and pollution controls.',
    monthlyCost: 100,
    effects: {
      pollutionModifier: -0.4, // 40% less pollution
      productionModifier: -0.15, // 15% less industrial production
      happinessModifier: 10,
    },
    requirements: {
      minPopulation: 30,
    },
  },

  ord_recycling_program: {
    id: 'ord_recycling_program',
    category: OrdinanceCategory.Environment,
    name: 'Mandatory Recycling',
    description: 'All waste must be recycled. Reduces pollution and increases scrap.',
    monthlyCost: 50,
    effects: {
      pollutionModifier: -0.2, // 20% less pollution
      productionModifier: 0.1, // 10% more scrap
      happinessModifier: -5,
    },
    requirements: {
      minPopulation: 20,
    },
  },

  ord_clean_energy: {
    id: 'ord_clean_energy',
    category: OrdinanceCategory.Environment,
    name: 'Clean Energy Initiative',
    description: 'Transition to cleaner power sources. Expensive but reduces pollution.',
    monthlyCost: 150,
    effects: {
      pollutionModifier: -0.5, // 50% less pollution from power
      happinessModifier: 15,
    },
    requirements: {
      minPopulation: 40,
      minBudget: 500,
    },
  },

  ord_green_spaces: {
    id: 'ord_green_spaces',
    category: OrdinanceCategory.Environment,
    name: 'Green Space Preservation',
    description: 'Maintain parks and vegetation. Improves happiness and reduces pollution.',
    monthlyCost: 40,
    effects: {
      happinessModifier: 10,
      pollutionModifier: -0.15, // 15% less pollution
    },
    requirements: {
      minPopulation: 25,
    },
  },

  // SOCIAL ORDINANCES
  ord_refugee_welcome: {
    id: 'ord_refugee_welcome',
    category: OrdinanceCategory.Social,
    name: 'Refugee Welcome Program',
    description: 'Actively recruit refugees. Faster population growth but higher resource costs.',
    monthlyCost: 80,
    effects: {
      happinessModifier: 5,
      productionModifier: -0.1, // 10% more consumption
    },
    requirements: {
      minPopulation: 15,
    },
  },

  ord_healthcare_expansion: {
    id: 'ord_healthcare_expansion',
    category: OrdinanceCategory.Social,
    name: 'Healthcare Expansion',
    description: 'Improve medical services. Increases happiness and reduces disease.',
    monthlyCost: 90,
    effects: {
      happinessModifier: 15,
      disasterRiskModifier: -0.2, // 20% less disease impact
    },
    requirements: {
      minPopulation: 30,
      requiredBuildings: ['med_tent'],
    },
  },

  ord_education_program: {
    id: 'ord_education_program',
    category: OrdinanceCategory.Social,
    name: 'Wasteland Education',
    description: 'Teach survival skills and literacy. Boosts happiness and production.',
    monthlyCost: 70,
    effects: {
      happinessModifier: 10,
      productionModifier: 0.1, // 10% production bonus
    },
    requirements: {
      minPopulation: 25,
    },
  },

  ord_entertainment: {
    id: 'ord_entertainment',
    category: OrdinanceCategory.Social,
    name: 'Entertainment & Recreation',
    description: 'Fund entertainment activities. Greatly increases happiness.',
    monthlyCost: 60,
    effects: {
      happinessModifier: 20,
    },
    requirements: {
      minPopulation: 20,
    },
  },

  // INDUSTRY ORDINANCES
  ord_industrial_boost: {
    id: 'ord_industrial_boost',
    category: OrdinanceCategory.Industry,
    name: 'Industrial Expansion',
    description: 'Subsidize industrial production. More output, more pollution.',
    monthlyCost: 100,
    effects: {
      productionModifier: 0.3, // 30% more production
      pollutionModifier: 0.5, // 50% more pollution
      happinessModifier: -10,
    },
    requirements: {
      minPopulation: 30,
    },
  },

  ord_trade_agreements: {
    id: 'ord_trade_agreements',
    category: OrdinanceCategory.Industry,
    name: 'Trade Agreements',
    description: 'Establish trade routes with other settlements. Boosts caps income.',
    monthlyCost: 50,
    effects: {
      productionModifier: 0.2, // 20% more caps
      happinessModifier: 5,
    },
    requirements: {
      minPopulation: 25,
      minBudget: 200,
    },
  },

  ord_automation: {
    id: 'ord_automation',
    category: OrdinanceCategory.Industry,
    name: 'Automation Initiative',
    description: 'Automate production with pre-war tech. Expensive but efficient.',
    monthlyCost: 150,
    effects: {
      productionModifier: 0.4, // 40% more production
      happinessModifier: -5, // Some job losses
    },
    requirements: {
      minPopulation: 40,
      minBudget: 500,
    },
  },

  ord_quality_control: {
    id: 'ord_quality_control',
    category: OrdinanceCategory.Industry,
    name: 'Quality Control Standards',
    description: 'Enforce quality standards. Reduces output but increases value.',
    monthlyCost: 40,
    effects: {
      productionModifier: -0.1, // 10% less quantity
      taxRateModifier: 0.2, // 20% more value (caps)
      happinessModifier: 10,
    },
    requirements: {
      minPopulation: 20,
    },
  },
};

/**
 * OrdinanceSystem - Manages city policies and their effects
 */
export class OrdinanceSystem implements GameSystem {
  private scene!: Phaser.Scene;
  private ordinances: Map<string, Ordinance> = new Map();
  private updateTimer: number = 0;
  private gameTime: number = 0;

  // Active effects (cumulative from all ordinances)
  private activeEffects = {
    happinessModifier: 0,
    taxRateModifier: 0,
    pollutionModifier: 0,
    productionModifier: 0,
    disasterRiskModifier: 0,
    crimeModifier: 0,
  };

  init(scene: Phaser.Scene): void {
    this.scene = scene;
    this.initializeOrdinances();
  }

  update(delta: number): void {
    const deltaSeconds = delta / 1000;
    this.gameTime += deltaSeconds;
    this.updateTimer += delta;

    // Apply monthly costs
    if (this.updateTimer >= ORDINANCE_CONFIG.updateInterval) {
      this.updateTimer = 0;
      this.applyMonthlyCosts();
    }
  }

  /**
   * Initialize all ordinances as disabled
   */
  private initializeOrdinances(): void {
    for (const [id, ordData] of Object.entries(ORDINANCES)) {
      this.ordinances.set(id, {
        ...ordData,
        enabled: false,
      });
    }
  }

  /**
   * Enable an ordinance
   */
  enableOrdinance(ordinanceId: string): boolean {
    const ordinance = this.ordinances.get(ordinanceId);
    if (!ordinance) {
      console.error(`Ordinance not found: ${ordinanceId}`);
      return false;
    }

    if (ordinance.enabled) {
      console.warn(`Ordinance already enabled: ${ordinanceId}`);
      return false;
    }

    // Check requirements
    if (!this.checkRequirements(ordinance)) {
      this.scene.events.emit('ordinance:requirementsNotMet', ordinance);
      return false;
    }

    // Check max ordinances
    const activeCount = this.getActiveOrdinances().length;
    if (activeCount >= ORDINANCE_CONFIG.maxActiveOrdinances) {
      this.scene.events.emit('ordinance:maxReached');
      return false;
    }

    // Enable ordinance
    ordinance.enabled = true;
    this.recalculateEffects();

    // Emit event
    this.scene.events.emit('ordinance:enabled', ordinance);

    return true;
  }

  /**
   * Disable an ordinance
   */
  disableOrdinance(ordinanceId: string): boolean {
    const ordinance = this.ordinances.get(ordinanceId);
    if (!ordinance) {
      console.error(`Ordinance not found: ${ordinanceId}`);
      return false;
    }

    if (!ordinance.enabled) {
      console.warn(`Ordinance not enabled: ${ordinanceId}`);
      return false;
    }

    // Disable ordinance
    ordinance.enabled = false;
    this.recalculateEffects();

    // Emit event
    this.scene.events.emit('ordinance:disabled', ordinance);

    return true;
  }

  /**
   * Check if ordinance requirements are met
   */
  private checkRequirements(ordinance: Ordinance): boolean {
    if (!ordinance.requirements) return true;

    const result = { passed: true };

    // Emit event for other systems to check requirements
    this.scene.events.emit('ordinance:checkRequirements', { ordinance, result });

    return result.passed;
  }

  /**
   * Apply monthly costs for all active ordinances
   */
  private applyMonthlyCosts(): void {
    const costs: Record<string, number> = {};
    let totalCost = 0;

    for (const ordinance of this.ordinances.values()) {
      if (!ordinance.enabled) continue;

      costs[ordinance.id] = ordinance.monthlyCost;
      totalCost += ordinance.monthlyCost;
    }

    if (totalCost !== 0) {
      // Emit event to apply costs to budget
      this.scene.events.emit('ordinance:monthlyCosts', { costs, totalCost });
    }
  }

  /**
   * Recalculate cumulative effects from all active ordinances
   */
  private recalculateEffects(): void {
    // Reset effects
    this.activeEffects = {
      happinessModifier: 0,
      taxRateModifier: 0,
      pollutionModifier: 0,
      productionModifier: 0,
      disasterRiskModifier: 0,
      crimeModifier: 0,
    };

    // Sum effects from all active ordinances
    for (const ordinance of this.ordinances.values()) {
      if (!ordinance.enabled) continue;

      const effects = ordinance.effects;
      if (effects.happinessModifier) this.activeEffects.happinessModifier += effects.happinessModifier;
      if (effects.taxRateModifier) this.activeEffects.taxRateModifier += effects.taxRateModifier;
      if (effects.pollutionModifier) this.activeEffects.pollutionModifier += effects.pollutionModifier;
      if (effects.productionModifier) this.activeEffects.productionModifier += effects.productionModifier;
      if (effects.disasterRiskModifier) this.activeEffects.disasterRiskModifier += effects.disasterRiskModifier;
      if (effects.crimeModifier) this.activeEffects.crimeModifier += effects.crimeModifier;
    }

    // Emit event for other systems to apply effects
    this.scene.events.emit('ordinance:effectsChanged', this.activeEffects);
  }

  /**
   * Get all ordinances
   */
  getAllOrdinances(): Ordinance[] {
    return Array.from(this.ordinances.values());
  }

  /**
   * Get ordinances by category
   */
  getOrdinancesByCategory(category: OrdinanceCategory): Ordinance[] {
    return Array.from(this.ordinances.values()).filter(o => o.category === category);
  }

  /**
   * Get active ordinances
   */
  getActiveOrdinances(): Ordinance[] {
    return Array.from(this.ordinances.values()).filter(o => o.enabled);
  }

  /**
   * Get available ordinances (requirements met)
   */
  getAvailableOrdinances(): Ordinance[] {
    return Array.from(this.ordinances.values()).filter(o => {
      if (o.enabled) return false;
      return this.checkRequirements(o);
    });
  }

  /**
   * Get active effects
   */
  getActiveEffects(): typeof this.activeEffects {
    return { ...this.activeEffects };
  }

  /**
   * Get total monthly cost
   */
  getTotalMonthlyCost(): number {
    return this.getActiveOrdinances().reduce((sum, o) => sum + o.monthlyCost, 0);
  }

  /**
   * Check if ordinance is enabled
   */
  isEnabled(ordinanceId: string): boolean {
    const ordinance = this.ordinances.get(ordinanceId);
    return ordinance?.enabled || false;
  }

  // State management
  reset(): void {
    // Disable all ordinances
    for (const ordinance of this.ordinances.values()) {
      ordinance.enabled = false;
    }
    this.recalculateEffects();
    this.updateTimer = 0;
    this.gameTime = 0;
  }

  destroy(): void {
    this.ordinances.clear();
  }
}
