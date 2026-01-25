/**
 * Nudge Service
 * Manages nudge scheduling, escalation, and delivery
 */

import { Notification, BrowserWindow } from 'electron';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import type {
  Nudge,
  NudgeConfig,
  NudgeType,
  NudgeEvent,
  NudgeFrequency,
} from '../../shared/types/nudge.js';
import { getRandomNudgeMessage } from '../../shared/data/nudgeTemplates.js';

// Nudge timing constants (in milliseconds) - SHORTER FOR TESTING
const TIMING: Record<NudgeFrequency, { gentle: number; moderate: number; urgent: number }> = {
  gentle: { gentle: 10000, moderate: 20000, urgent: 40000 }, // 10s, 20s, 40s (for testing)
  moderate: { gentle: 5000, moderate: 10000, urgent: 20000 }, // 5s, 10s, 20s (for testing)
  aggressive: { gentle: 3000, moderate: 6000, urgent: 12000 }, // 3s, 6s, 12s (for testing)
};

// For production, use these values:
// const TIMING: Record<NudgeFrequency, { gentle: number; moderate: number; urgent: number }> = {
//   gentle: { gentle: 180000, moderate: 300000, urgent: 600000 },      // 3min, 5min, 10min
//   moderate: { gentle: 120000, moderate: 180000, urgent: 300000 },    // 2min, 3min, 5min
//   aggressive: { gentle: 60000, moderate: 120000, urgent: 180000 },   // 1min, 2min, 3min
// };

export class NudgeService extends EventEmitter {
  private config: NudgeConfig;
  private currentSessionId: string | null = null;
  private isCurrentlyIdle: boolean = false;
  private nudgeHistory: Nudge[] = [];
  private scheduledNudges: Map<string, NodeJS.Timeout> = new Map();
  private deliveredNudgeTypes: Set<NudgeType> = new Set();
  private userStreak: number = 0;

  constructor(config: Partial<NudgeConfig> = {}) {
    super();
    this.config = {
      enabled: config.enabled ?? true,
      frequency: config.frequency ?? 'moderate',
      soundEnabled: config.soundEnabled ?? true,
      escalationEnabled: config.escalationEnabled ?? true,
      quietHoursStart: config.quietHoursStart,
      quietHoursEnd: config.quietHoursEnd,
    };
    console.log('[NudgeService] Initialized with config:', this.config);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<NudgeConfig>): void {
    console.log('[NudgeService] Updating config:', config);
    const oldFrequency = this.config.frequency;
    this.config = { ...this.config, ...config };

    // If frequency changed while idle, reschedule
    if (config.frequency && config.frequency !== oldFrequency && this.isCurrentlyIdle) {
      console.log(`[NudgeService] Frequency changed, rescheduling nudges`);
      this.clearAllScheduledNudges();
      this.deliveredNudgeTypes.clear();
      this.scheduleNudges();
    }
  }

  /**
   * Set current user streak
   */
  setUserStreak(streak: number): void {
    this.userStreak = streak;
  }

  /**
   * Start a focus session
   */
  startSession(sessionId: string): void {
    console.log('[NudgeService] Starting session:', sessionId);
    this.currentSessionId = sessionId;
    this.nudgeHistory = [];
    this.isCurrentlyIdle = false;
    this.clearAllScheduledNudges();
    this.deliveredNudgeTypes.clear();
  }

  /**
   * End the current session
   */
  endSession(): Nudge[] {
    console.log('[NudgeService] Ending session');
    this.currentSessionId = null;
    this.isCurrentlyIdle = false;
    this.clearAllScheduledNudges();
    this.deliveredNudgeTypes.clear();
    return [...this.nudgeHistory];
  }

  /**
   * Called ONCE when user becomes idle
   */
  onIdleStart(): void {
    console.log(
      '[NudgeService] onIdleStart called, enabled:',
      this.config.enabled,
      'sessionId:',
      this.currentSessionId
    );

    if (!this.config.enabled) {
      console.log('[NudgeService] Nudges disabled, skipping');
      return;
    }

    if (!this.currentSessionId) {
      console.log('[NudgeService] No active session, skipping');
      return;
    }

    if (this.isQuietHours()) {
      console.log('[NudgeService] Quiet hours active, skipping');
      return;
    }

    // Prevent duplicate calls
    if (this.isCurrentlyIdle) {
      console.log('[NudgeService] Already idle, ignoring duplicate call');
      return;
    }

    console.log('[NudgeService] Starting idle period, scheduling nudges');
    this.isCurrentlyIdle = true;
    this.deliveredNudgeTypes.clear();
    this.scheduleNudges();
  }

  /**
   * Called ONCE when user becomes active
   */
  onIdleEnd(): void {
    console.log('[NudgeService] onIdleEnd called');

    if (!this.isCurrentlyIdle) {
      console.log('[NudgeService] Was not idle, ignoring');
      return;
    }

    console.log('[NudgeService] Ending idle period, clearing nudges');
    this.isCurrentlyIdle = false;
    this.clearAllScheduledNudges();
    this.deliveredNudgeTypes.clear();
  }

  /**
   * Acknowledge a nudge
   */
  acknowledgeNudge(nudgeId: string): void {
    const nudge = this.nudgeHistory.find(n => n.id === nudgeId);
    if (nudge) {
      nudge.acknowledged = true;
      nudge.acknowledgedAt = new Date();
      this.emit('nudge-acknowledged', nudge);
    }
  }

  /**
   * Get nudge history
   */
  getNudgeHistory(): Nudge[] {
    return [...this.nudgeHistory];
  }

  /**
   * Schedule all nudges for this idle period
   */
  private scheduleNudges(): void {
    const timing = TIMING[this.config.frequency];

    console.log('[NudgeService] Scheduling nudges with frequency:', this.config.frequency);
    console.log('[NudgeService] Timing:', {
      gentle: `${timing.gentle / 1000}s`,
      moderate: `${timing.moderate / 1000}s`,
      urgent: `${timing.urgent / 1000}s`,
    });

    // Schedule gentle nudge
    this.scheduleNudge('gentle', timing.gentle);

    // Schedule moderate and urgent (if escalation enabled)
    if (this.config.escalationEnabled) {
      this.scheduleNudge('moderate', timing.moderate);
      this.scheduleNudge('urgent', timing.urgent);
    }

    // Streak reminder if applicable
    if (this.userStreak >= 3) {
      this.scheduleNudge('streak_reminder', timing.moderate + 5000);
    }
  }

  /**
   * Schedule a single nudge
   */
  private scheduleNudge(type: NudgeType, delayMs: number): void {
    const nudgeKey = type;

    // Don't schedule if already scheduled
    if (this.scheduledNudges.has(nudgeKey)) {
      console.log(`[NudgeService] ${type} already scheduled, skipping`);
      return;
    }

    console.log(`[NudgeService] Scheduling ${type} nudge in ${delayMs / 1000}s`);

    const timeoutId = setTimeout(() => {
      this.scheduledNudges.delete(nudgeKey);
      this.deliverNudge(type);
    }, delayMs);

    this.scheduledNudges.set(nudgeKey, timeoutId);
  }

  /**
   * Clear all scheduled nudges
   */
  private clearAllScheduledNudges(): void {
    console.log(`[NudgeService] Clearing ${this.scheduledNudges.size} scheduled nudges`);
    this.scheduledNudges.forEach((timeout, key) => {
      console.log(`[NudgeService] Clearing scheduled nudge: ${key}`);
      clearTimeout(timeout);
    });
    this.scheduledNudges.clear();
  }

  /**
   * Deliver a nudge
   */
  private deliverNudge(type: NudgeType): void {
    console.log(`[NudgeService] Attempting to deliver ${type} nudge`);

    // Check if still valid to deliver
    if (!this.isCurrentlyIdle) {
      console.log(`[NudgeService] No longer idle, skipping ${type} nudge`);
      return;
    }

    if (!this.currentSessionId) {
      console.log(`[NudgeService] No session, skipping ${type} nudge`);
      return;
    }

    // Check if already delivered this type
    if (this.deliveredNudgeTypes.has(type)) {
      console.log(`[NudgeService] ${type} already delivered, skipping`);
      return;
    }

    if (this.isQuietHours()) {
      console.log(`[NudgeService] Quiet hours, skipping ${type} nudge`);
      return;
    }

    console.log(`[NudgeService] Delivering ${type} nudge`);
    this.deliveredNudgeTypes.add(type);

    // Generate message
    const variables = {
      streak: this.userStreak,
      streak_plus_one: this.userStreak + 1,
    };
    const { title, message, emoji } = getRandomNudgeMessage(type, variables);

    // Create nudge
    const nudge: Nudge = {
      id: uuidv4(),
      type,
      title: `${emoji} ${title}`,
      message,
      timestamp: new Date(),
      acknowledged: false,
      sessionId: this.currentSessionId,
    };

    this.nudgeHistory.push(nudge);

    // Determine delivery style
    const showOverlay = type === 'urgent';
    const playSound = this.config.soundEnabled && type !== 'gentle';

    const nudgeEvent: NudgeEvent = {
      nudge,
      showOverlay,
      playSound,
    };

    // Emit to renderer
    this.emit('nudge', nudgeEvent);

    // System notification for non-gentle
    if (type !== 'gentle') {
      this.showSystemNotification(nudge);
    }
  }

  /**
   * Show system notification
   */
  private showSystemNotification(nudge: Nudge): void {
    const notification = new Notification({
      title: nudge.title,
      body: nudge.message,
      silent: !this.config.soundEnabled,
    });

    notification.on('click', () => {
      this.acknowledgeNudge(nudge.id);
      const windows = BrowserWindow.getAllWindows();
      if (windows.length > 0) {
        const win = windows[0];
        if (win.isMinimized()) win.restore();
        win.focus();
      }
    });

    notification.show();
  }

  /**
   * Check quiet hours
   */
  private isQuietHours(): boolean {
    if (!this.config.quietHoursStart || !this.config.quietHoursEnd) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMin] = this.config.quietHoursStart.split(':').map(Number);
    const [endHour, endMin] = this.config.quietHoursEnd.split(':').map(Number);

    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime > endTime) {
      return currentTime >= startTime || currentTime < endTime;
    }

    return currentTime >= startTime && currentTime < endTime;
  }
}

// Singleton
let nudgeService: NudgeService | null = null;

export function getNudgeService(config?: Partial<NudgeConfig>): NudgeService {
  if (!nudgeService) {
    nudgeService = new NudgeService(config);
  }
  return nudgeService;
}

export function destroyNudgeService(): void {
  if (nudgeService) {
    nudgeService.endSession();
    nudgeService = null;
  }
}
