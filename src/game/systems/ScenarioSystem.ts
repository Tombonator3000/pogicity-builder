import Phaser from 'phaser';
import { GameSystem } from './GameSystem';
import {
  Scenario,
  ScenarioDifficulty,
  ScenarioProgress,
  Objective,
  ObjectiveType,
  Achievement,
  AchievementCategory,
  MayorRating,
  MayorRatingFactors,
  Resources,
} from '../types';

/**
 * Configuration for scenario system
 */
const SCENARIO_CONFIG = {
  updateInterval: 5000, // Check objectives every 5 seconds
  autoSave: true,
  autoSaveInterval: 30000, // Auto-save every 30 seconds
};

/**
 * Predefined scenarios (wasteland-themed)
 */
export const SCENARIOS: Record<string, Omit<Scenario, 'objectives'> & { objectives: Omit<Objective, 'current' | 'completed'>[] }> = {
  tutorial: {
    id: 'tutorial',
    name: 'First Steps in the Wasteland',
    description: 'Learn the basics of settlement building in the harsh post-apocalyptic world.',
    difficulty: ScenarioDifficulty.Tutorial,
    objectives: [
      {
        id: 'obj_tutorial_1',
        type: ObjectiveType.Buildings,
        title: 'Build a Scrap Pile',
        description: 'Construct your first scrap collection building',
        target: 1,
        required: true,
      },
      {
        id: 'obj_tutorial_2',
        type: ObjectiveType.Population,
        title: 'Attract Settlers',
        description: 'Grow your population to 5 settlers',
        target: 5,
        required: true,
      },
      {
        id: 'obj_tutorial_3',
        type: ObjectiveType.Resources,
        title: 'Collect Resources',
        description: 'Accumulate 50 scrap',
        target: 50,
        required: true,
      },
    ],
    startingResources: {
      scrap: 100,
      food: 50,
      water: 50,
      power: 20,
      medicine: 10,
      caps: 50,
      population: 2,
      maxPopulation: 10,
      happiness: 70,
    },
    rewards: {
      unlockScenarios: ['scavenger_camp'],
      achievement: 'ach_first_settlement',
    },
  },

  scavenger_camp: {
    id: 'scavenger_camp',
    name: 'Scavenger Camp',
    description: 'Build a thriving scavenger settlement. Focus on resource collection and trading.',
    difficulty: ScenarioDifficulty.Easy,
    objectives: [
      {
        id: 'obj_scav_1',
        type: ObjectiveType.Population,
        title: 'Growing Community',
        description: 'Reach 20 population',
        target: 20,
        required: true,
      },
      {
        id: 'obj_scav_2',
        type: ObjectiveType.Happiness,
        title: 'Keep Morale High',
        description: 'Maintain happiness above 60',
        target: 60,
        required: true,
      },
      {
        id: 'obj_scav_3',
        type: ObjectiveType.Budget,
        title: 'Trade Success',
        description: 'Accumulate 500 caps',
        target: 500,
        required: true,
      },
    ],
    startingResources: {
      scrap: 150,
      food: 100,
      water: 100,
      power: 30,
      medicine: 20,
      caps: 100,
      population: 5,
      maxPopulation: 30,
      happiness: 70,
    },
    rewards: {
      unlockScenarios: ['radiated_valley'],
      achievement: 'ach_trader',
    },
  },

  radiated_valley: {
    id: 'radiated_valley',
    name: 'Radiated Valley Challenge',
    description: 'Survive in a highly irradiated zone. Manage pollution and health carefully.',
    difficulty: ScenarioDifficulty.Medium,
    objectives: [
      {
        id: 'obj_rad_1',
        type: ObjectiveType.Population,
        title: 'Hardy Survivors',
        description: 'Reach 30 population',
        target: 30,
        required: true,
      },
      {
        id: 'obj_rad_2',
        type: ObjectiveType.Pollution,
        title: 'Radiation Control',
        description: 'Keep average pollution below 50',
        target: 50,
        required: true,
      },
      {
        id: 'obj_rad_3',
        type: ObjectiveType.Survival,
        title: 'Endurance Test',
        description: 'Survive for 10 minutes',
        target: 600, // 10 minutes in seconds
        required: true,
      },
    ],
    startingResources: {
      scrap: 200,
      food: 150,
      water: 150,
      power: 50,
      medicine: 50,
      caps: 200,
      population: 10,
      maxPopulation: 50,
      happiness: 60,
    },
    disasterFrequency: 1.5, // 50% more disasters
    timeLimit: 1200, // 20 minutes
    rewards: {
      unlockScenarios: ['fortress'],
      achievement: 'ach_radiation_master',
    },
  },

  fortress: {
    id: 'fortress',
    name: 'The Fortress',
    description: 'Build an impenetrable fortress. Defend against constant raider attacks.',
    difficulty: ScenarioDifficulty.Hard,
    objectives: [
      {
        id: 'obj_fort_1',
        type: ObjectiveType.Buildings,
        title: 'Strong Defenses',
        description: 'Build 5 guard towers',
        target: 5,
        required: true,
      },
      {
        id: 'obj_fort_2',
        type: ObjectiveType.DisasterSurvival,
        title: 'Under Siege',
        description: 'Survive 3 raider assaults',
        target: 3,
        required: true,
      },
      {
        id: 'obj_fort_3',
        type: ObjectiveType.Population,
        title: 'Protected Population',
        description: 'Reach 50 population',
        target: 50,
        required: true,
      },
    ],
    startingResources: {
      scrap: 300,
      food: 200,
      water: 200,
      power: 100,
      medicine: 100,
      caps: 500,
      population: 15,
      maxPopulation: 100,
      happiness: 70,
    },
    disasterFrequency: 2.0, // Double disaster frequency
    specialRules: [
      'Raider attacks occur frequently',
      'Defense buildings are essential',
      'Population happiness is harder to maintain',
    ],
    rewards: {
      unlockScenarios: ['wasteland_metropolis'],
      achievement: 'ach_fortress_defender',
    },
  },

  wasteland_metropolis: {
    id: 'wasteland_metropolis',
    name: 'Wasteland Metropolis',
    description: 'Build the ultimate wasteland city. Balance all systems to create a thriving metropolis.',
    difficulty: ScenarioDifficulty.Expert,
    objectives: [
      {
        id: 'obj_metro_1',
        type: ObjectiveType.Population,
        title: 'Metropolis Population',
        description: 'Reach 100 population',
        target: 100,
        required: true,
      },
      {
        id: 'obj_metro_2',
        type: ObjectiveType.Happiness,
        title: 'Thriving City',
        description: 'Maintain 80+ happiness',
        target: 80,
        required: true,
      },
      {
        id: 'obj_metro_3',
        type: ObjectiveType.ZoneDevelopment,
        title: 'Fully Developed',
        description: 'Develop 50 zones',
        target: 50,
        required: true,
      },
      {
        id: 'obj_metro_4',
        type: ObjectiveType.Budget,
        title: 'Economic Powerhouse',
        description: 'Accumulate 5000 caps',
        target: 5000,
        required: true,
      },
    ],
    startingResources: {
      scrap: 500,
      food: 300,
      water: 300,
      power: 200,
      medicine: 150,
      caps: 1000,
      population: 20,
      maxPopulation: 200,
      happiness: 70,
    },
    timeLimit: 3600, // 60 minutes
    disasterFrequency: 1.2,
    specialRules: [
      'All city systems must be balanced',
      'Pollution management is critical',
      'Infrastructure must support large population',
      'Time limit: 60 minutes',
    ],
    rewards: {
      achievement: 'ach_wasteland_legend',
    },
  },
};

/**
 * Predefined achievements
 */
export const ACHIEVEMENTS: Record<string, Omit<Achievement, 'unlocked' | 'unlockedAt'>> = {
  ach_first_settlement: {
    id: 'ach_first_settlement',
    category: AchievementCategory.Scenario,
    name: 'First Steps',
    description: 'Complete the tutorial scenario',
    requirement: { type: 'scenario', value: 1 },
  },
  ach_trader: {
    id: 'ach_trader',
    category: AchievementCategory.Economy,
    name: 'Master Trader',
    description: 'Complete the Scavenger Camp scenario',
    requirement: { type: 'scenario', value: 1 },
  },
  ach_radiation_master: {
    id: 'ach_radiation_master',
    category: AchievementCategory.Survival,
    name: 'Radiation Master',
    description: 'Complete the Radiated Valley challenge',
    requirement: { type: 'scenario', value: 1 },
  },
  ach_fortress_defender: {
    id: 'ach_fortress_defender',
    category: AchievementCategory.Survival,
    name: 'Fortress Defender',
    description: 'Complete The Fortress scenario',
    requirement: { type: 'scenario', value: 1 },
  },
  ach_wasteland_legend: {
    id: 'ach_wasteland_legend',
    category: AchievementCategory.Scenario,
    name: 'Wasteland Legend',
    description: 'Complete the Wasteland Metropolis scenario',
    requirement: { type: 'scenario', value: 1 },
    secret: true,
  },
  ach_population_100: {
    id: 'ach_population_100',
    category: AchievementCategory.Population,
    name: 'Century Club',
    description: 'Reach 100 population',
    requirement: { type: 'population', value: 100 },
  },
  ach_caps_10000: {
    id: 'ach_caps_10000',
    category: AchievementCategory.Economy,
    name: 'Wasteland Tycoon',
    description: 'Accumulate 10,000 caps',
    requirement: { type: 'caps', value: 10000 },
  },
  ach_builder: {
    id: 'ach_builder',
    category: AchievementCategory.Building,
    name: 'Master Builder',
    description: 'Place 100 buildings',
    requirement: { type: 'buildings', value: 100 },
  },
  ach_survivor: {
    id: 'ach_survivor',
    category: AchievementCategory.Survival,
    name: 'Survivor',
    description: 'Survive 5 disasters',
    requirement: { type: 'disasters', value: 5 },
  },
};

/**
 * Mayor rating score ranges
 */
const MAYOR_RATING_RANGES: Record<MayorRating, [number, number]> = {
  [MayorRating.Outcast]: [0, 20],
  [MayorRating.Settler]: [21, 40],
  [MayorRating.Overseer]: [41, 60],
  [MayorRating.Guardian]: [61, 80],
  [MayorRating.WastelandHero]: [81, 95],
  [MayorRating.Legend]: [96, 100],
};

/**
 * ScenarioSystem - Manages scenarios, objectives, achievements, and mayor rating
 */
export class ScenarioSystem implements GameSystem {
  private scene!: Phaser.Scene;
  private updateTimer: number = 0;
  private gameTime: number = 0;

  // Scenario state
  private currentScenario: Scenario | null = null;
  private scenarioProgress: ScenarioProgress | null = null;
  private completedScenarios: Set<string> = new Set();

  // Achievement state
  private achievements: Map<string, Achievement> = new Map();

  // Mayor rating
  private mayorRating: MayorRating = MayorRating.Settler;
  private mayorScore: number = 50;
  private ratingFactors: MayorRatingFactors = {
    population: 50,
    happiness: 50,
    economy: 50,
    infrastructure: 50,
    environment: 50,
    safety: 50,
  };

  // Statistics tracking
  private stats = {
    buildingsPlaced: 0,
    disastersSurvived: 0,
    totalPlayTime: 0,
  };

  init(scene: Phaser.Scene): void {
    this.scene = scene;
    this.initializeAchievements();
  }

  update(delta: number): void {
    const deltaSeconds = delta / 1000;
    this.gameTime += deltaSeconds;
    this.updateTimer += delta;

    // Update scenario progress
    if (this.currentScenario && this.scenarioProgress && !this.scenarioProgress.completed) {
      this.scenarioProgress.elapsedTime += deltaSeconds;

      // Check time limit
      if (this.currentScenario.timeLimit &&
          this.scenarioProgress.elapsedTime >= this.currentScenario.timeLimit) {
        this.failScenario('Time limit exceeded');
      }
    }

    // Periodic updates
    if (this.updateTimer >= SCENARIO_CONFIG.updateInterval) {
      this.updateTimer = 0;
      this.checkObjectives();
      this.updateMayorRating();
      this.checkAchievements();
    }

    // Track total play time
    this.stats.totalPlayTime += deltaSeconds;
  }

  /**
   * Initialize achievements
   */
  private initializeAchievements(): void {
    for (const [id, achData] of Object.entries(ACHIEVEMENTS)) {
      this.achievements.set(id, {
        ...achData,
        unlocked: false,
      });
    }
  }

  /**
   * Start a scenario
   */
  startScenario(scenarioId: string): boolean {
    const scenarioTemplate = SCENARIOS[scenarioId];
    if (!scenarioTemplate) {
      console.error(`Scenario not found: ${scenarioId}`);
      return false;
    }

    // Create scenario with initialized objectives
    const objectives: Objective[] = scenarioTemplate.objectives.map(obj => ({
      ...obj,
      current: 0,
      completed: false,
    }));

    this.currentScenario = {
      ...scenarioTemplate,
      objectives,
    };

    // Initialize progress
    this.scenarioProgress = {
      scenarioId,
      startTime: this.gameTime,
      elapsedTime: 0,
      objectiveProgress: {},
      completed: false,
      victory: false,
    };

    // Initialize objective progress
    for (const obj of objectives) {
      this.scenarioProgress.objectiveProgress[obj.id] = 0;
    }

    // Emit event for UI
    this.scene.events.emit('scenario:started', this.currentScenario);

    return true;
  }

  /**
   * Check all objectives for the current scenario
   */
  private checkObjectives(): void {
    if (!this.currentScenario || !this.scenarioProgress || this.scenarioProgress.completed) {
      return;
    }

    let allRequiredComplete = true;

    for (const objective of this.currentScenario.objectives) {
      if (objective.completed) continue;

      // Update objective progress based on type
      const newProgress = this.getObjectiveProgress(objective);
      objective.current = newProgress;
      this.scenarioProgress.objectiveProgress[objective.id] = newProgress;

      // Check if objective completed
      if (newProgress >= objective.target) {
        objective.completed = true;
        this.scene.events.emit('objective:completed', objective);
      }

      // Check if all required objectives are complete
      if (objective.required && !objective.completed) {
        allRequiredComplete = false;
      }
    }

    // Check for scenario victory
    if (allRequiredComplete) {
      this.completeScenario(true);
    }
  }

  /**
   * Get current progress for an objective
   */
  private getObjectiveProgress(objective: Objective): number {
    // This needs to query the game state through events
    // For now, return stored progress
    const result = { value: objective.current };

    // Emit event for other systems to update progress
    this.scene.events.emit('objective:check', { objective, result });

    return result.value;
  }

  /**
   * Update objective progress from external systems
   */
  updateObjectiveProgress(objectiveId: string, value: number): void {
    if (!this.currentScenario || !this.scenarioProgress) return;

    const objective = this.currentScenario.objectives.find(o => o.id === objectiveId);
    if (objective && !objective.completed) {
      objective.current = value;
      this.scenarioProgress.objectiveProgress[objectiveId] = value;
    }
  }

  /**
   * Complete the current scenario
   */
  private completeScenario(victory: boolean): void {
    if (!this.scenarioProgress || !this.currentScenario) return;

    this.scenarioProgress.completed = true;
    this.scenarioProgress.victory = victory;

    // Calculate score (0-100)
    const timeBonus = this.calculateTimeBonus();
    const objectiveScore = this.calculateObjectiveScore();
    this.scenarioProgress.score = Math.floor((objectiveScore * 0.7) + (timeBonus * 0.3));

    if (victory) {
      this.completedScenarios.add(this.currentScenario.id);

      // Unlock rewards
      if (this.currentScenario.rewards?.achievement) {
        this.unlockAchievement(this.currentScenario.rewards.achievement);
      }

      this.scene.events.emit('scenario:victory', {
        scenario: this.currentScenario,
        progress: this.scenarioProgress,
      });
    } else {
      this.scene.events.emit('scenario:failure', {
        scenario: this.currentScenario,
        progress: this.scenarioProgress,
      });
    }
  }

  /**
   * Fail the current scenario
   */
  private failScenario(reason: string): void {
    this.completeScenario(false);
    this.scene.events.emit('scenario:failed', reason);
  }

  /**
   * Calculate time bonus (0-100)
   */
  private calculateTimeBonus(): number {
    if (!this.scenarioProgress || !this.currentScenario?.timeLimit) return 100;

    const timeUsed = this.scenarioProgress.elapsedTime;
    const timeLimit = this.currentScenario.timeLimit;
    const timeRatio = timeUsed / timeLimit;

    // 100 points if completed in < 50% time, 0 points if at time limit
    return Math.max(0, Math.min(100, 100 * (2 - 2 * timeRatio)));
  }

  /**
   * Calculate objective completion score (0-100)
   */
  private calculateObjectiveScore(): number {
    if (!this.currentScenario) return 0;

    const objectives = this.currentScenario.objectives;
    if (objectives.length === 0) return 100;

    const completionRatios = objectives.map(obj =>
      Math.min(1, obj.current / obj.target)
    );
    const averageCompletion = completionRatios.reduce((a, b) => a + b, 0) / objectives.length;

    return Math.floor(averageCompletion * 100);
  }

  /**
   * Update mayor rating based on city performance
   */
  private updateMayorRating(): void {
    // Calculate overall score (0-100)
    const weights = {
      population: 0.2,
      happiness: 0.2,
      economy: 0.15,
      infrastructure: 0.15,
      environment: 0.15,
      safety: 0.15,
    };

    this.mayorScore = Math.floor(
      this.ratingFactors.population * weights.population +
      this.ratingFactors.happiness * weights.happiness +
      this.ratingFactors.economy * weights.economy +
      this.ratingFactors.infrastructure * weights.infrastructure +
      this.ratingFactors.environment * weights.environment +
      this.ratingFactors.safety * weights.safety
    );

    // Determine rating
    const newRating = this.getRatingFromScore(this.mayorScore);
    if (newRating !== this.mayorRating) {
      const oldRating = this.mayorRating;
      this.mayorRating = newRating;
      this.scene.events.emit('mayorRating:changed', { oldRating, newRating, score: this.mayorScore });
    }
  }

  /**
   * Get mayor rating from score
   */
  private getRatingFromScore(score: number): MayorRating {
    for (const [rating, [min, max]] of Object.entries(MAYOR_RATING_RANGES)) {
      if (score >= min && score <= max) {
        return rating as MayorRating;
      }
    }
    return MayorRating.Settler;
  }

  /**
   * Update a rating factor
   */
  updateRatingFactor(factor: keyof MayorRatingFactors, value: number): void {
    this.ratingFactors[factor] = Math.max(0, Math.min(100, value));
  }

  /**
   * Check and unlock achievements
   */
  private checkAchievements(): void {
    // Emit event for other systems to report stats
    const stats = { ...this.stats };
    this.scene.events.emit('achievement:checkStats', stats);

    // Check each achievement
    for (const achievement of this.achievements.values()) {
      if (achievement.unlocked) continue;

      let unlocked = false;

      switch (achievement.requirement.type) {
        case 'population':
          unlocked = stats.buildingsPlaced >= achievement.requirement.value;
          break;
        case 'buildings':
          unlocked = stats.buildingsPlaced >= achievement.requirement.value;
          break;
        case 'disasters':
          unlocked = stats.disastersSurvived >= achievement.requirement.value;
          break;
        // Scenario achievements handled separately
      }

      if (unlocked) {
        this.unlockAchievement(achievement.id);
      }
    }
  }

  /**
   * Unlock an achievement
   */
  unlockAchievement(achievementId: string): void {
    const achievement = this.achievements.get(achievementId);
    if (!achievement || achievement.unlocked) return;

    achievement.unlocked = true;
    achievement.unlockedAt = this.gameTime;

    this.scene.events.emit('achievement:unlocked', achievement);
  }

  /**
   * Update statistics
   */
  incrementStat(stat: keyof typeof this.stats, amount: number = 1): void {
    this.stats[stat] += amount;
  }

  // Getters
  getCurrentScenario(): Scenario | null {
    return this.currentScenario;
  }

  getScenarioProgress(): ScenarioProgress | null {
    return this.scenarioProgress ? { ...this.scenarioProgress } : null;
  }

  getMayorRating(): MayorRating {
    return this.mayorRating;
  }

  getMayorScore(): number {
    return this.mayorScore;
  }

  getRatingFactors(): MayorRatingFactors {
    return { ...this.ratingFactors };
  }

  getAchievements(): Achievement[] {
    return Array.from(this.achievements.values()).filter(a => !a.secret || a.unlocked);
  }

  getUnlockedAchievements(): Achievement[] {
    return Array.from(this.achievements.values()).filter(a => a.unlocked);
  }

  getCompletedScenarios(): string[] {
    return Array.from(this.completedScenarios);
  }

  getAvailableScenarios(): Scenario[] {
    // Return scenarios that are unlocked
    // Tutorial is always available
    const available: Scenario[] = [];

    // Tutorial
    const tutorial = this.createScenarioFromTemplate('tutorial');
    if (tutorial) available.push(tutorial);

    // Other scenarios based on completion
    if (this.completedScenarios.has('tutorial')) {
      const scavenger = this.createScenarioFromTemplate('scavenger_camp');
      if (scavenger) available.push(scavenger);
    }
    if (this.completedScenarios.has('scavenger_camp')) {
      const radiated = this.createScenarioFromTemplate('radiated_valley');
      if (radiated) available.push(radiated);
    }
    if (this.completedScenarios.has('radiated_valley')) {
      const fortress = this.createScenarioFromTemplate('fortress');
      if (fortress) available.push(fortress);
    }
    if (this.completedScenarios.has('fortress')) {
      const metro = this.createScenarioFromTemplate('wasteland_metropolis');
      if (metro) available.push(metro);
    }

    return available;
  }

  private createScenarioFromTemplate(id: string): Scenario | null {
    const template = SCENARIOS[id];
    if (!template) return null;

    return {
      ...template,
      objectives: template.objectives.map(obj => ({
        ...obj,
        current: 0,
        completed: false,
      })),
    };
  }

  // State management
  reset(): void {
    this.currentScenario = null;
    this.scenarioProgress = null;
    this.mayorRating = MayorRating.Settler;
    this.mayorScore = 50;
    this.updateTimer = 0;
    this.gameTime = 0;
  }
}
