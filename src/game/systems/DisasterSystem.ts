import Phaser from 'phaser';
import { GameSystem } from './GameSystem';
import {
  Disaster,
  DisasterType,
  DisasterSeverity,
  BuildingDamage,
  DamageState,
  ResourceCost,
} from '../types';

/**
 * Configuration for disaster system
 */
const DISASTER_CONFIG = {
  checkInterval: 60000, // Check for disasters every 60 seconds
  baseDisasterChance: 0.05, // 5% chance per check
  warningTime: 30, // 30 seconds warning before disaster
  minDisasterInterval: 120, // Minimum 2 minutes between disasters
};

/**
 * Disaster definitions (wasteland-themed)
 */
interface DisasterTemplate {
  type: DisasterType;
  name: string;
  description: string;
  warningMessage: string;
  baseChance: number; // Probability multiplier
  minSeverity: DisasterSeverity;
  maxSeverity: DisasterSeverity;
  duration: number; // Duration in seconds
  baseDamage: number; // Base damage amount
  baseRadius: number; // Base affected radius
}

const DISASTER_TEMPLATES: Record<DisasterType, DisasterTemplate> = {
  [DisasterType.Radstorm]: {
    type: DisasterType.Radstorm,
    name: 'Radiation Storm',
    description: 'A massive radiation storm is battering the settlement!',
    warningMessage: 'Radiation levels rising! A rad storm is approaching from the west.',
    baseChance: 1.0,
    minSeverity: DisasterSeverity.Minor,
    maxSeverity: DisasterSeverity.Major,
    duration: 60,
    baseDamage: 20,
    baseRadius: 8,
  },

  [DisasterType.DustStorm]: {
    type: DisasterType.DustStorm,
    name: 'Dust Storm',
    description: 'A violent dust storm reduces visibility to zero!',
    warningMessage: 'Massive dust cloud detected on the horizon!',
    baseChance: 1.2,
    minSeverity: DisasterSeverity.Minor,
    maxSeverity: DisasterSeverity.Moderate,
    duration: 45,
    baseDamage: 10,
    baseRadius: 12,
  },

  [DisasterType.Earthquake]: {
    type: DisasterType.Earthquake,
    name: 'Earthquake',
    description: 'The ground shakes violently, damaging structures!',
    warningMessage: 'Seismic activity detected! Brace for tremors!',
    baseChance: 0.6,
    minSeverity: DisasterSeverity.Moderate,
    maxSeverity: DisasterSeverity.Catastrophic,
    duration: 15,
    baseDamage: 50,
    baseRadius: 20,
  },

  [DisasterType.RaiderAssault]: {
    type: DisasterType.RaiderAssault,
    name: 'Raider Assault',
    description: 'A large raider gang is attacking the settlement!',
    warningMessage: 'Scouts report hostile forces approaching!',
    baseChance: 1.5,
    minSeverity: DisasterSeverity.Minor,
    maxSeverity: DisasterSeverity.Major,
    duration: 90,
    baseDamage: 30,
    baseRadius: 10,
  },

  [DisasterType.SuperMutantInvasion]: {
    type: DisasterType.SuperMutantInvasion,
    name: 'Super Mutant Invasion',
    description: 'Super mutants are rampaging through the settlement!',
    warningMessage: 'Warning! Super mutant war party sighted nearby!',
    baseChance: 0.4,
    minSeverity: DisasterSeverity.Major,
    maxSeverity: DisasterSeverity.Catastrophic,
    duration: 120,
    baseDamage: 70,
    baseRadius: 15,
  },

  [DisasterType.FeralhGoulPlague]: {
    type: DisasterType.FeralhGoulPlague,
    name: 'Feral Ghoul Plague',
    description: 'Feral ghouls are flooding into the settlement!',
    warningMessage: 'Massive ghoul horde detected moving this way!',
    baseChance: 0.7,
    minSeverity: DisasterSeverity.Moderate,
    maxSeverity: DisasterSeverity.Major,
    duration: 100,
    baseDamage: 40,
    baseRadius: 12,
  },

  [DisasterType.ReactorMeltdown]: {
    type: DisasterType.ReactorMeltdown,
    name: 'Reactor Meltdown',
    description: 'A nuclear reactor is melting down!',
    warningMessage: 'Critical reactor failure imminent!',
    baseChance: 0.3,
    minSeverity: DisasterSeverity.Major,
    maxSeverity: DisasterSeverity.Catastrophic,
    duration: 180,
    baseDamage: 100,
    baseRadius: 25,
  },

  [DisasterType.WaterContamination]: {
    type: DisasterType.WaterContamination,
    name: 'Water Contamination',
    description: 'The water supply has been poisoned!',
    warningMessage: 'Water quality alerts! Contamination detected!',
    baseChance: 0.8,
    minSeverity: DisasterSeverity.Minor,
    maxSeverity: DisasterSeverity.Moderate,
    duration: 120,
    baseDamage: 15,
    baseRadius: 8,
  },

  [DisasterType.Fire]: {
    type: DisasterType.Fire,
    name: 'Spreading Fire',
    description: 'A fire is spreading rapidly through the settlement!',
    warningMessage: 'Fire reported! Flames spreading quickly!',
    baseChance: 1.0,
    minSeverity: DisasterSeverity.Minor,
    maxSeverity: DisasterSeverity.Major,
    duration: 80,
    baseDamage: 45,
    baseRadius: 6,
  },

  [DisasterType.DeathclawAttack]: {
    type: DisasterType.DeathclawAttack,
    name: 'Deathclaw Rampage',
    description: 'A deathclaw is rampaging through the settlement!',
    warningMessage: 'DEATHCLAW SIGHTED! Take cover immediately!',
    baseChance: 0.2,
    minSeverity: DisasterSeverity.Major,
    maxSeverity: DisasterSeverity.Catastrophic,
    duration: 60,
    baseDamage: 80,
    baseRadius: 10,
  },

  [DisasterType.RadscorpionSwarm]: {
    type: DisasterType.RadscorpionSwarm,
    name: 'Radscorpion Swarm',
    description: 'Giant radscorpions are infesting the settlement!',
    warningMessage: 'Radscorpion nest discovered nearby!',
    baseChance: 0.9,
    minSeverity: DisasterSeverity.Minor,
    maxSeverity: DisasterSeverity.Moderate,
    duration: 75,
    baseDamage: 25,
    baseRadius: 8,
  },
};

/**
 * Severity multipliers for damage and radius
 */
const SEVERITY_MULTIPLIERS: Record<DisasterSeverity, { damage: number; radius: number }> = {
  [DisasterSeverity.Minor]: { damage: 0.5, radius: 0.7 },
  [DisasterSeverity.Moderate]: { damage: 1.0, radius: 1.0 },
  [DisasterSeverity.Major]: { damage: 1.8, radius: 1.4 },
  [DisasterSeverity.Catastrophic]: { damage: 3.0, radius: 2.0 },
};

/**
 * Damage state thresholds (health percent)
 */
const DAMAGE_THRESHOLDS: Record<DamageState, [number, number]> = {
  [DamageState.None]: [100, 100],
  [DamageState.Light]: [75, 99],
  [DamageState.Moderate]: [50, 74],
  [DamageState.Heavy]: [25, 49],
  [DamageState.Critical]: [1, 24],
  [DamageState.Destroyed]: [0, 0],
};

/**
 * DisasterSystem - Manages major disasters with building damage and recovery
 */
export class DisasterSystem implements GameSystem {
  private scene!: Phaser.Scene;
  private checkTimer: number = 0;
  private gameTime: number = 0;
  private lastDisasterTime: number = 0;

  // Active disasters
  private activeDisasters: Map<string, Disaster> = new Map();
  private disasterIdCounter: number = 0;

  // Pending disasters (warnings)
  private pendingDisasters: Map<string, Disaster> = new Map();

  // Building damage tracking
  private buildingDamage: Map<string, BuildingDamage> = new Map();

  // Configuration
  private disasterFrequencyMultiplier: number = 1.0;
  private disastersEnabled: boolean = true;

  init(scene: Phaser.Scene): void {
    this.scene = scene;
  }

  update(delta: number): void {
    const deltaSeconds = delta / 1000;
    this.gameTime += deltaSeconds;
    this.checkTimer += delta;

    // Update active disasters
    this.updateActiveDisasters(deltaSeconds);

    // Update pending disasters (warnings)
    this.updatePendingDisasters(deltaSeconds);

    // Check for new random disasters
    if (this.disastersEnabled && this.checkTimer >= DISASTER_CONFIG.checkInterval) {
      this.checkTimer = 0;
      this.checkRandomDisasters();
    }
  }

  /**
   * Check for random disaster occurrences
   */
  private checkRandomDisasters(): void {
    // Check cooldown
    if (this.gameTime - this.lastDisasterTime < DISASTER_CONFIG.minDisasterInterval) {
      return;
    }

    // Roll for disaster
    const roll = Math.random();
    const threshold = DISASTER_CONFIG.baseDisasterChance * this.disasterFrequencyMultiplier;

    if (roll < threshold) {
      // Select random disaster type weighted by baseChance
      const disasterType = this.selectRandomDisasterType();
      this.triggerDisaster(disasterType);
    }
  }

  /**
   * Select a random disaster type based on probabilities
   */
  private selectRandomDisasterType(): DisasterType {
    const types = Object.values(DisasterType);
    const weights = types.map(type => DISASTER_TEMPLATES[type].baseChance);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    let random = Math.random() * totalWeight;
    for (let i = 0; i < types.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return types[i];
      }
    }

    return types[0]; // Fallback
  }

  /**
   * Trigger a disaster
   */
  triggerDisaster(
    type: DisasterType,
    epicenter?: { x: number; y: number },
    severity?: DisasterSeverity,
    playerTriggered: boolean = false
  ): Disaster {
    const template = DISASTER_TEMPLATES[type];

    // Determine severity
    const finalSeverity = severity || this.randomSeverity(template.minSeverity, template.maxSeverity);

    // Calculate epicenter (random if not specified)
    const finalEpicenter = epicenter || this.getRandomEpicenter();

    // Apply severity multipliers
    const multipliers = SEVERITY_MULTIPLIERS[finalSeverity];
    const radius = Math.floor(template.baseRadius * multipliers.radius);

    // Create disaster
    const disaster: Disaster = {
      id: `disaster_${this.disasterIdCounter++}`,
      type,
      severity: finalSeverity,
      name: template.name,
      description: template.description,
      epicenter: finalEpicenter,
      radius,
      startTime: this.gameTime + DISASTER_CONFIG.warningTime,
      duration: template.duration,
      active: false,
      damageDealt: 0,
      buildingsAffected: [],
      warning: {
        warningTime: DISASTER_CONFIG.warningTime,
        message: template.warningMessage,
      },
    };

    // Add to pending disasters (warning phase)
    this.pendingDisasters.set(disaster.id, disaster);

    // Emit warning event
    this.scene.events.emit('disaster:warning', disaster);

    // Emit to advisors
    this.scene.events.emit('advisor:disaster:warning', disaster);

    return disaster;
  }

  /**
   * Trigger disaster manually (player-triggered or testing)
   */
  triggerDisasterManual(
    type: DisasterType,
    epicenter: { x: number; y: number },
    severity: DisasterSeverity
  ): Disaster {
    return this.triggerDisaster(type, epicenter, severity, true);
  }

  /**
   * Update pending disasters (activate when warning time expires)
   */
  private updatePendingDisasters(deltaSeconds: number): void {
    const toActivate: string[] = [];

    for (const [id, disaster] of this.pendingDisasters.entries()) {
      if (this.gameTime >= disaster.startTime) {
        toActivate.push(id);
      }
    }

    // Activate disasters
    for (const id of toActivate) {
      const disaster = this.pendingDisasters.get(id)!;
      this.activateDisaster(disaster);
      this.pendingDisasters.delete(id);
    }
  }

  /**
   * Activate a disaster (apply damage)
   */
  private activateDisaster(disaster: Disaster): void {
    disaster.active = true;
    this.activeDisasters.set(disaster.id, disaster);
    this.lastDisasterTime = this.gameTime;

    // Apply initial damage
    this.applyDisasterDamage(disaster);

    // Emit event
    this.scene.events.emit('disaster:started', disaster);

    // Emit to advisors
    this.scene.events.emit('advisor:disaster:active', disaster);
  }

  /**
   * Apply damage from a disaster
   */
  private applyDisasterDamage(disaster: Disaster): void {
    const template = DISASTER_TEMPLATES[disaster.type];
    const multipliers = SEVERITY_MULTIPLIERS[disaster.severity];
    const totalDamage = Math.floor(template.baseDamage * multipliers.damage);

    // Get buildings in affected area
    const affectedBuildings = this.getBuildingsInRadius(disaster.epicenter, disaster.radius);

    // Apply damage to each building
    for (const buildingId of affectedBuildings) {
      // Calculate damage based on distance from epicenter
      const distance = this.getDistanceToEpicenter(buildingId, disaster.epicenter);
      const distanceRatio = Math.max(0, 1 - distance / disaster.radius);
      const damage = Math.floor(totalDamage * distanceRatio);

      this.damageBuildingByAmount(buildingId, damage);
      disaster.buildingsAffected.push(buildingId);
      disaster.damageDealt += damage;
    }

    // Emit event with damage info
    this.scene.events.emit('disaster:damage', {
      disaster,
      buildingsAffected: affectedBuildings,
      totalDamage: disaster.damageDealt,
    });
  }

  /**
   * Update active disasters
   */
  private updateActiveDisasters(deltaSeconds: number): void {
    const toEnd: string[] = [];

    for (const [id, disaster] of this.activeDisasters.entries()) {
      const elapsed = this.gameTime - disaster.startTime;
      if (elapsed >= disaster.duration) {
        toEnd.push(id);
      }
    }

    // End disasters
    for (const id of toEnd) {
      const disaster = this.activeDisasters.get(id)!;
      this.endDisaster(disaster);
      this.activeDisasters.delete(id);
    }
  }

  /**
   * End a disaster
   */
  private endDisaster(disaster: Disaster): void {
    disaster.active = false;

    // Emit event
    this.scene.events.emit('disaster:ended', disaster);

    // Update scenario system
    this.scene.events.emit('scenario:disasterSurvived', disaster);
  }

  /**
   * Damage a building by amount
   */
  private damageBuildingByAmount(buildingId: string, damage: number): void {
    let buildingDmg = this.buildingDamage.get(buildingId);

    // Create damage record if doesn't exist
    if (!buildingDmg) {
      buildingDmg = {
        buildingId,
        damageState: DamageState.None,
        healthPercent: 100,
        repairCost: {},
        productionPenalty: 0,
      };
      this.buildingDamage.set(buildingId, buildingDmg);
    }

    // Apply damage
    buildingDmg.healthPercent = Math.max(0, buildingDmg.healthPercent - damage);

    // Update damage state
    buildingDmg.damageState = this.getDamageStateFromHealth(buildingDmg.healthPercent);

    // Calculate production penalty (0-1)
    buildingDmg.productionPenalty = 1 - (buildingDmg.healthPercent / 100);

    // Calculate repair cost (increases with damage)
    buildingDmg.repairCost = this.calculateRepairCost(buildingId, buildingDmg.healthPercent);

    // Emit event
    this.scene.events.emit('building:damaged', buildingDmg);

    // If destroyed, emit special event
    if (buildingDmg.damageState === DamageState.Destroyed) {
      this.scene.events.emit('building:destroyed', buildingId);
    }
  }

  /**
   * Repair a building
   */
  repairBuilding(buildingId: string): boolean {
    const damage = this.buildingDamage.get(buildingId);
    if (!damage || damage.healthPercent === 100) return false;

    // Check if player has resources (emit event for MainScene to check)
    const result = { canAfford: false };
    this.scene.events.emit('building:checkRepairCost', { buildingId, cost: damage.repairCost, result });

    if (!result.canAfford) {
      this.scene.events.emit('building:repairFailed', { buildingId, reason: 'insufficient_resources' });
      return false;
    }

    // Apply repair cost
    this.scene.events.emit('building:applyRepairCost', { buildingId, cost: damage.repairCost });

    // Repair building
    damage.healthPercent = 100;
    damage.damageState = DamageState.None;
    damage.productionPenalty = 0;
    damage.repairCost = {};

    // Emit event
    this.scene.events.emit('building:repaired', buildingId);

    return true;
  }

  /**
   * Get damage state from health percent
   */
  private getDamageStateFromHealth(health: number): DamageState {
    for (const [state, [min, max]] of Object.entries(DAMAGE_THRESHOLDS)) {
      if (health >= min && health <= max) {
        return state as DamageState;
      }
    }
    return DamageState.None;
  }

  /**
   * Calculate repair cost based on building and damage
   */
  private calculateRepairCost(buildingId: string, healthPercent: number): ResourceCost {
    const damagePercent = 100 - healthPercent;

    // Base cost (emit event to get building value)
    const buildingValue = { scrap: 50, caps: 25 }; // Default values
    this.scene.events.emit('building:getValue', { buildingId, value: buildingValue });

    // Cost scales with damage
    const costMultiplier = damagePercent / 100;

    return {
      scrap: Math.ceil(buildingValue.scrap * costMultiplier),
      caps: Math.ceil(buildingValue.caps * costMultiplier),
    };
  }

  /**
   * Get buildings in radius from epicenter
   */
  private getBuildingsInRadius(epicenter: { x: number; y: number }, radius: number): string[] {
    const buildings: string[] = [];

    // Emit event to get buildings from MainScene
    this.scene.events.emit('disaster:getBuildingsInRadius', { epicenter, radius, buildings });

    return buildings;
  }

  /**
   * Get distance from building to epicenter
   */
  private getDistanceToEpicenter(buildingId: string, epicenter: { x: number; y: number }): number {
    // Emit event to get building position
    const position = { x: 0, y: 0 };
    this.scene.events.emit('building:getPosition', { buildingId, position });

    const dx = position.x - epicenter.x;
    const dy = position.y - epicenter.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Get random epicenter within grid
   */
  private getRandomEpicenter(): { x: number; y: number } {
    // Default grid size (will be overridden by MainScene)
    const gridSize = { width: 48, height: 48 };
    this.scene.events.emit('disaster:getGridSize', gridSize);

    return {
      x: Math.floor(Math.random() * gridSize.width),
      y: Math.floor(Math.random() * gridSize.height),
    };
  }

  /**
   * Get random severity within range
   */
  private randomSeverity(min: DisasterSeverity, max: DisasterSeverity): DisasterSeverity {
    const severities = [
      DisasterSeverity.Minor,
      DisasterSeverity.Moderate,
      DisasterSeverity.Major,
      DisasterSeverity.Catastrophic,
    ];

    const minIndex = severities.indexOf(min);
    const maxIndex = severities.indexOf(max);
    const randomIndex = minIndex + Math.floor(Math.random() * (maxIndex - minIndex + 1));

    return severities[randomIndex];
  }

  // Getters
  getActiveDisasters(): Disaster[] {
    return Array.from(this.activeDisasters.values());
  }

  getPendingDisasters(): Disaster[] {
    return Array.from(this.pendingDisasters.values());
  }

  getBuildingDamage(buildingId: string): BuildingDamage | undefined {
    return this.buildingDamage.get(buildingId);
  }

  getAllDamagedBuildings(): BuildingDamage[] {
    return Array.from(this.buildingDamage.values()).filter(d => d.healthPercent < 100);
  }

  getTotalRepairCost(): ResourceCost {
    const total: ResourceCost = {};

    for (const damage of this.buildingDamage.values()) {
      if (damage.healthPercent < 100) {
        for (const [resource, amount] of Object.entries(damage.repairCost)) {
          total[resource as keyof ResourceCost] = (total[resource as keyof ResourceCost] || 0) + amount;
        }
      }
    }

    return total;
  }

  // Configuration
  setDisasterFrequency(multiplier: number): void {
    this.disasterFrequencyMultiplier = multiplier;
  }

  setDisastersEnabled(enabled: boolean): void {
    this.disastersEnabled = enabled;
  }

  // State management
  reset(): void {
    this.activeDisasters.clear();
    this.pendingDisasters.clear();
    this.buildingDamage.clear();
    this.checkTimer = 0;
    this.gameTime = 0;
    this.lastDisasterTime = 0;
    this.disasterIdCounter = 0;
  }

  destroy(): void {
    this.reset();
  }
}
