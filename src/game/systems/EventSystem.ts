import Phaser from 'phaser';
import { GameEvent, GameEventType, Resources, ResourceRate } from '../types';
import { GameSystem } from './GameSystem';

/**
 * Event definitions for random occurrences
 */
const EVENT_TEMPLATES: Omit<GameEvent, 'id' | 'timestamp'>[] = [
  {
    type: 'raid',
    name: 'Raider Attack!',
    description: 'A band of raiders is attacking your settlement! They steal supplies before retreating.',
    effect: { scrap: -15, food: -10, caps: -5 },
    duration: 0,
  },
  {
    type: 'caravan',
    name: 'Trade Caravan',
    description: 'A traveling merchant caravan passes through, boosting your supplies.',
    effect: { scrap: 20, food: 15, caps: 10 },
    duration: 0,
  },
  {
    type: 'radstorm',
    name: 'Radiation Storm',
    description: 'A radioactive dust storm rolls in, forcing everyone indoors. Production halted temporarily.',
    effect: {},
    rateEffect: { scrap: -2, food: -1, water: -1 },
    duration: 45,
  },
  {
    type: 'refugees',
    name: 'Refugee Arrival',
    description: 'Desperate survivors have found your settlement and seek shelter.',
    effect: { population: 2 },
    duration: 0,
    choices: [
      { 
        label: 'Welcome them', 
        description: 'Accept the refugees (+2 population)', 
        effect: { population: 2 } 
      },
      { 
        label: 'Turn them away', 
        description: 'Refuse entry (no change)', 
        effect: {} 
      },
    ],
  },
  {
    type: 'disease',
    name: 'Disease Outbreak',
    description: 'Sickness spreads through the settlement. Medicine consumption increases.',
    effect: { medicine: -5 },
    rateEffect: { medicine: -0.5 },
    duration: 30,
  },
  {
    type: 'discovery',
    name: 'Scavenger Discovery',
    description: 'Your scavengers found a hidden cache of pre-war supplies!',
    effect: { scrap: 30, medicine: 10, caps: 20 },
    duration: 0,
  },
];

/**
 * Event probabilities per minute (base chance)
 */
const EVENT_PROBABILITIES: Record<GameEventType, number> = {
  raid: 0.08,      // 8% per minute
  caravan: 0.12,   // 12% per minute
  radstorm: 0.05,  // 5% per minute
  refugees: 0.06,  // 6% per minute
  disease: 0.04,   // 4% per minute
  discovery: 0.10, // 10% per minute
};

/**
 * Random event system for wasteland gameplay
 */
export class EventSystem implements GameSystem {
  private scene!: Phaser.Scene;
  private eventHistory: GameEvent[] = [];
  private activeEvents: GameEvent[] = [];
  private lastEventCheck: number = 0;
  private eventCheckInterval: number = 10; // Check every 10 seconds
  private gameTime: number = 0;
  private eventIdCounter: number = 0;
  private eventsEnabled: boolean = true;

  // Cooldowns to prevent spam
  private eventCooldowns: Map<GameEventType, number> = new Map();
  private cooldownDuration: number = 60; // 60 second cooldown per event type

  init(scene: Phaser.Scene): void {
    this.scene = scene;
  }

  update(delta: number): void {
    const deltaSeconds = delta / 1000;
    this.gameTime += deltaSeconds;

    // Update active event durations
    this.updateActiveEvents(deltaSeconds);

    // Check for new random events
    if (this.eventsEnabled && this.gameTime - this.lastEventCheck >= this.eventCheckInterval) {
      this.checkRandomEvents();
      this.lastEventCheck = this.gameTime;
    }
  }

  /**
   * Checks for random event occurrences
   */
  private checkRandomEvents(): void {
    // Calculate probability per check (based on interval)
    const minuteFraction = this.eventCheckInterval / 60;

    for (const template of EVENT_TEMPLATES) {
      const baseProb = EVENT_PROBABILITIES[template.type];
      const adjustedProb = baseProb * minuteFraction;

      // Check cooldown
      const cooldownEnd = this.eventCooldowns.get(template.type) || 0;
      if (this.gameTime < cooldownEnd) continue;

      // Random chance
      if (Math.random() < adjustedProb) {
        this.triggerEvent(template);
        this.eventCooldowns.set(template.type, this.gameTime + this.cooldownDuration);
        break; // Only one event per check
      }
    }
  }

  /**
   * Triggers an event
   */
  triggerEvent(template: Omit<GameEvent, 'id' | 'timestamp'>): GameEvent {
    const event: GameEvent = {
      ...template,
      id: `event_${this.eventIdCounter++}`,
      timestamp: this.gameTime,
    };

    this.eventHistory.push(event);
    if (this.eventHistory.length > 50) {
      this.eventHistory.shift(); // Keep only last 50 events
    }

    // If event has duration, add to active events
    if (event.duration && event.duration > 0) {
      this.activeEvents.push(event);
    }

    // Emit event for UI and other systems
    this.scene.events.emit('event:triggered', event);

    // If no choices, apply effect immediately
    if (!event.choices || event.choices.length === 0) {
      this.scene.events.emit('event:apply', event.effect);
    }

    return event;
  }

  /**
   * Applies a choice from an event
   */
  applyEventChoice(eventId: string, choiceIndex: number): void {
    const event = this.eventHistory.find(e => e.id === eventId);
    if (!event || !event.choices || !event.choices[choiceIndex]) return;

    const choice = event.choices[choiceIndex];
    this.scene.events.emit('event:apply', choice.effect);
  }

  /**
   * Updates active timed events
   */
  private updateActiveEvents(deltaSeconds: number): void {
    const stillActive: GameEvent[] = [];

    for (const event of this.activeEvents) {
      const elapsed = this.gameTime - event.timestamp;
      if (elapsed < (event.duration || 0)) {
        stillActive.push(event);
      } else {
        // Event ended
        this.scene.events.emit('event:ended', event);
      }
    }

    this.activeEvents = stillActive;
  }

  /**
   * Gets active rate modifiers from events
   */
  getActiveRateModifiers(): ResourceRate {
    const modifiers: ResourceRate = {};

    for (const event of this.activeEvents) {
      if (!event.rateEffect) continue;

      const keys = Object.keys(event.rateEffect) as Array<keyof ResourceRate>;
      for (const key of keys) {
        modifiers[key] = (modifiers[key] || 0) + (event.rateEffect[key] || 0);
      }
    }

    return modifiers;
  }

  // Getters
  getEventHistory(): GameEvent[] {
    return [...this.eventHistory];
  }

  getActiveEvents(): GameEvent[] {
    return [...this.activeEvents];
  }

  getRecentEvents(count: number = 5): GameEvent[] {
    return this.eventHistory.slice(-count);
  }

  // State management
  setEventsEnabled(enabled: boolean): void {
    this.eventsEnabled = enabled;
  }

  setGameTime(time: number): void {
    this.gameTime = time;
  }

  setEventHistory(history: GameEvent[]): void {
    this.eventHistory = [...history];
    this.eventIdCounter = history.length;
  }

  reset(): void {
    this.eventHistory = [];
    this.activeEvents = [];
    this.lastEventCheck = 0;
    this.gameTime = 0;
    this.eventIdCounter = 0;
    this.eventCooldowns.clear();
  }
}
