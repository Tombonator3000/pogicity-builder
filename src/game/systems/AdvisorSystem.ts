import Phaser from 'phaser';
import { GameSystem } from './GameSystem';
import {
  AdvisorType,
  AdvisorSeverity,
  AdvisorMessage,
  CitizenPetition,
} from '../types';

/**
 * Advisor System Configuration
 */
export const ADVISOR_CONFIG = {
  updateInterval: 15000, // Check for issues every 15 seconds
  maxMessages: 10, // Maximum active messages
  messagePriority: {
    [AdvisorSeverity.Critical]: 3,
    [AdvisorSeverity.Warning]: 2,
    [AdvisorSeverity.Info]: 1,
  },
  cooldownPeriod: 60000, // Don't repeat same advice within 60 seconds
} as const;

/**
 * Base Advisor Interface
 * Individual advisors implement this interface
 */
export interface Advisor {
  type: AdvisorType;
  checkForIssues(scene: Phaser.Scene): AdvisorMessage[];
}

/**
 * AdvisorSystem
 * Manages city advisors who provide proactive guidance and warnings.
 *
 * Features:
 * - Multiple advisor types (Financial, Safety, Utilities, Transportation, Environmental)
 * - Proactive issue detection
 * - Prioritized message queue
 * - Cooldown system to prevent spam
 * - Citizen petition system
 * - Advisor personality/voice
 */
export class AdvisorSystem implements GameSystem {
  private scene!: Phaser.Scene;
  private advisors: Advisor[] = [];
  private messages: AdvisorMessage[] = [];
  private petitions: CitizenPetition[] = [];
  private lastUpdateTime: number = 0;
  private messageIdCounter: number = 0;
  private petitionIdCounter: number = 0;
  private recentMessages: Map<string, number> = new Map(); // Track recent messages for cooldown

  /**
   * Initialize the advisor system
   */
  init(scene: Phaser.Scene): void {
    this.scene = scene;
    this.lastUpdateTime = Date.now();

    // Register individual advisors
    this.registerAdvisors();

    console.log('[AdvisorSystem] Initialized with', this.advisors.length, 'advisors');
  }

  /**
   * Register individual advisors
   */
  private registerAdvisors(): void {
    // Advisors will be added dynamically
    // Individual advisor classes will register themselves
  }

  /**
   * Add an advisor to the system
   */
  addAdvisor(advisor: Advisor): void {
    this.advisors.push(advisor);
    console.log(`[AdvisorSystem] Registered ${advisor.type} advisor`);
  }

  /**
   * Update advisor logic
   */
  update(delta: number): void {
    const now = Date.now();
    if (now - this.lastUpdateTime >= ADVISOR_CONFIG.updateInterval) {
      this.checkAllAdvisors();
      this.cleanupOldMessages();
      this.lastUpdateTime = now;
    }
  }

  /**
   * Check all advisors for issues
   */
  private checkAllAdvisors(): void {
    this.advisors.forEach((advisor) => {
      const newMessages = advisor.checkForIssues(this.scene);

      newMessages.forEach((message) => {
        this.addMessage(message);
      });
    });
  }

  /**
   * Add a new advisor message
   */
  addMessage(message: Omit<AdvisorMessage, 'id' | 'timestamp'>): void {
    const now = Date.now();

    // Check cooldown
    const messageKey = `${message.advisorType}:${message.title}`;
    const lastMessageTime = this.recentMessages.get(messageKey);
    if (lastMessageTime && now - lastMessageTime < ADVISOR_CONFIG.cooldownPeriod) {
      return; // Skip duplicate message within cooldown period
    }

    // Create full message
    const fullMessage: AdvisorMessage = {
      id: `msg_${this.messageIdCounter++}`,
      timestamp: now,
      ...message,
    };

    this.messages.push(fullMessage);
    this.recentMessages.set(messageKey, now);

    // Limit number of messages
    if (this.messages.length > ADVISOR_CONFIG.maxMessages) {
      // Remove lowest priority messages
      this.messages.sort((a, b) => {
        const priorityDiff =
          ADVISOR_CONFIG.messagePriority[b.severity] -
          ADVISOR_CONFIG.messagePriority[a.severity];
        if (priorityDiff !== 0) return priorityDiff;
        return a.timestamp - b.timestamp; // Older messages removed first
      });
      this.messages = this.messages.slice(0, ADVISOR_CONFIG.maxMessages);
    }

    console.log(`[AdvisorSystem] New message from ${message.advisorType}: ${message.title}`);
    this.scene.events.emit('advisor:message', fullMessage);
  }

  /**
   * Dismiss a message
   */
  dismissMessage(messageId: string): void {
    const message = this.messages.find((m) => m.id === messageId);
    if (message) {
      message.dismissed = true;
      this.scene.events.emit('advisor:messageDismissed', messageId);
    }
  }

  /**
   * Remove dismissed messages older than 5 minutes
   */
  private cleanupOldMessages(): void {
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    this.messages = this.messages.filter((msg) => {
      if (msg.dismissed && now - msg.timestamp > fiveMinutes) {
        return false;
      }
      return true;
    });
  }

  /**
   * Get all active messages
   */
  getMessages(): AdvisorMessage[] {
    return this.messages.filter((m) => !m.dismissed);
  }

  /**
   * Get messages by type
   */
  getMessagesByType(type: AdvisorType): AdvisorMessage[] {
    return this.messages.filter((m) => !m.dismissed && m.advisorType === type);
  }

  /**
   * Get messages by severity
   */
  getMessagesBySeverity(severity: AdvisorSeverity): AdvisorMessage[] {
    return this.messages.filter((m) => !m.dismissed && m.severity === severity);
  }

  /**
   * Get highest priority message
   */
  getTopMessage(): AdvisorMessage | null {
    const activeMessages = this.getMessages();
    if (activeMessages.length === 0) return null;

    // Sort by priority
    const sorted = [...activeMessages].sort((a, b) => {
      const priorityDiff =
        ADVISOR_CONFIG.messagePriority[b.severity] -
        ADVISOR_CONFIG.messagePriority[a.severity];
      if (priorityDiff !== 0) return priorityDiff;
      return a.timestamp - b.timestamp; // Older messages first
    });

    return sorted[0];
  }

  /**
   * Add a citizen petition
   */
  addPetition(petition: Omit<CitizenPetition, 'id' | 'timestamp'>): void {
    const fullPetition: CitizenPetition = {
      id: `petition_${this.petitionIdCounter++}`,
      timestamp: Date.now(),
      ...petition,
    };

    this.petitions.push(fullPetition);
    console.log(`[AdvisorSystem] New petition: ${petition.title}`);
    this.scene.events.emit('advisor:petition', fullPetition);
  }

  /**
   * Resolve a petition
   */
  resolvePetition(petitionId: string, accepted: boolean): void {
    const petition = this.petitions.find((p) => p.id === petitionId);
    if (petition) {
      petition.resolved = true;

      // Emit event for happiness impact
      this.scene.events.emit('advisor:petitionResolved', {
        petition,
        accepted,
      });

      console.log(`[AdvisorSystem] Petition ${petitionId} ${accepted ? 'accepted' : 'denied'}`);
    }
  }

  /**
   * Get all active petitions
   */
  getPetitions(): CitizenPetition[] {
    return this.petitions.filter((p) => !p.resolved);
  }

  /**
   * Get statistics for UI
   */
  getAdvisorStats(): {
    totalMessages: number;
    criticalMessages: number;
    warningMessages: number;
    infoMessages: number;
    activePetitions: number;
    messagesByAdvisor: Record<AdvisorType, number>;
  } {
    const activeMessages = this.getMessages();

    const messagesByAdvisor: Record<AdvisorType, number> = {
      [AdvisorType.Financial]: 0,
      [AdvisorType.Safety]: 0,
      [AdvisorType.Utilities]: 0,
      [AdvisorType.Transportation]: 0,
      [AdvisorType.Environmental]: 0,
    };

    let criticalMessages = 0;
    let warningMessages = 0;
    let infoMessages = 0;

    activeMessages.forEach((msg) => {
      messagesByAdvisor[msg.advisorType]++;

      if (msg.severity === AdvisorSeverity.Critical) criticalMessages++;
      else if (msg.severity === AdvisorSeverity.Warning) warningMessages++;
      else infoMessages++;
    });

    return {
      totalMessages: activeMessages.length,
      criticalMessages,
      warningMessages,
      infoMessages,
      activePetitions: this.getPetitions().length,
      messagesByAdvisor,
    };
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.advisors = [];
    this.messages = [];
    this.petitions = [];
    this.recentMessages.clear();
    console.log('[AdvisorSystem] Destroyed');
  }
}
