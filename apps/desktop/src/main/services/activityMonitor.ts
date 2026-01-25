/**
 * Activity Monitor Service
 * Runs in the main process to detect user idle time and activity
 */

import { powerMonitor, BrowserWindow } from 'electron';
import { EventEmitter } from 'events';
import type {
  ActivityState,
  ActivityEvent,
  ActivityConfig,
  ActivityStats,
  ActivityEventType,
} from '../../shared/types/activity.js';

export class ActivityMonitor extends EventEmitter {
  private config: ActivityConfig;
  private pollTimer: NodeJS.Timeout | null = null;
  private isMonitoring: boolean = false;
  private sessionActive: boolean = false;

  // Current state
  private state: ActivityState = {
    isIdle: false,
    idleDuration: 0,
    lastActivityTime: new Date(),
    activeWindow: null,
    sessionActive: false,
  };

  // Session statistics
  private stats: ActivityStats = this.createEmptyStats();

  // Tracking for streaks
  private currentStreakStart: Date = new Date();
  private currentStreakType: 'active' | 'idle' = 'active';

  // CRITICAL: Track if we've already fired the idle-threshold event this idle period
  private hasEmittedIdleThreshold: boolean = false;

  constructor(config: Partial<ActivityConfig> = {}) {
    super();
    this.config = {
      idleThreshold: config.idleThreshold ?? 30, // 30 seconds for testing
      pollInterval: config.pollInterval ?? 1000,
      trackWindows: config.trackWindows ?? true,
    };
    console.log('[ActivityMonitor] Initialized with config:', this.config);
  }

  /**
   * Start monitoring activity
   */
  start(): void {
    if (this.isMonitoring) {
      return;
    }

    console.log('[ActivityMonitor] Starting monitoring');
    this.isMonitoring = true;
    this.state.lastActivityTime = new Date();
    this.hasEmittedIdleThreshold = false;

    // Start polling
    this.pollTimer = setInterval(() => {
      this.checkActivity();
    }, this.config.pollInterval);

    this.emit('monitoring-started');
  }

  /**
   * Stop monitoring activity
   */
  stop(): void {
    if (!this.isMonitoring) {
      return;
    }

    console.log('[ActivityMonitor] Stopping monitoring');
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }

    this.isMonitoring = false;
    this.hasEmittedIdleThreshold = false;
    this.emit('monitoring-stopped');
  }

  /**
   * Start a focus session
   */
  startSession(): void {
    console.log('[ActivityMonitor] Starting session');
    this.sessionActive = true;
    this.state.sessionActive = true;
    this.state.isIdle = false;
    this.stats = this.createEmptyStats();
    this.currentStreakStart = new Date();
    this.currentStreakType = 'active';
    this.hasEmittedIdleThreshold = false;

    this.emitEvent('session-start');

    // Start monitoring if not already
    if (!this.isMonitoring) {
      this.start();
    }
  }

  /**
   * End a focus session
   */
  endSession(): ActivityStats {
    console.log('[ActivityMonitor] Ending session');
    this.sessionActive = false;
    this.state.sessionActive = false;

    // Finalize current streak
    this.finalizeStreak();

    // Calculate final focus score
    this.stats.focusScore = this.calculateFocusScore();

    this.emitEvent('session-end', { stats: this.stats });

    const finalStats = { ...this.stats };
    this.hasEmittedIdleThreshold = false;
    return finalStats;
  }

  /**
   * Get current activity state
   */
  getState(): ActivityState {
    return { ...this.state };
  }

  /**
   * Get current session statistics
   */
  getStats(): ActivityStats {
    return { ...this.stats };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ActivityConfig>): void {
    console.log('[ActivityMonitor] Updating config:', config);
    this.config = { ...this.config, ...config };
  }

  /**
   * Check current activity status - called every pollInterval
   */
  private checkActivity(): void {
    const idleSeconds = powerMonitor.getSystemIdleTime();
    const wasIdle = this.state.isIdle;
    const isNowIdle = idleSeconds >= this.config.idleThreshold;

    // Update idle duration in state
    this.state.idleDuration = idleSeconds;

    // STATE TRANSITION: Active -> Idle
    if (!wasIdle && isNowIdle) {
      console.log(`[ActivityMonitor] State change: ACTIVE -> IDLE (after ${idleSeconds}s)`);
      this.state.isIdle = true;

      // Finalize active streak
      this.finalizeStreak();
      this.currentStreakStart = new Date();
      this.currentStreakType = 'idle';

      // Emit activity-stop
      this.emitEvent('activity-stop');

      // Emit idle-threshold ONLY ONCE per idle period
      if (!this.hasEmittedIdleThreshold) {
        console.log('[ActivityMonitor] Emitting idle-threshold (ONE TIME)');
        this.hasEmittedIdleThreshold = true;
        this.emitEvent('idle-threshold', { idleDuration: idleSeconds });
      }
    }
    // STATE TRANSITION: Idle -> Active
    else if (wasIdle && !isNowIdle) {
      console.log(`[ActivityMonitor] State change: IDLE -> ACTIVE`);
      this.state.isIdle = false;
      this.state.lastActivityTime = new Date();

      // Reset the flag so we can emit again on next idle period
      this.hasEmittedIdleThreshold = false;

      // Finalize idle streak
      this.finalizeStreak();
      this.currentStreakStart = new Date();
      this.currentStreakType = 'active';

      // Emit activity-start
      this.emitEvent('activity-start');
    }

    // Update session stats if session is active
    if (this.sessionActive) {
      this.updateSessionStats(isNowIdle);
    }

    // Always emit activity-update for UI updates
    this.emit('activity-update', { ...this.state });
  }

  /**
   * Update session statistics
   */
  private updateSessionStats(isIdle: boolean): void {
    const increment = this.config.pollInterval / 1000;

    this.stats.totalTime += increment;

    if (isIdle) {
      this.stats.idleTime += increment;
    } else {
      this.stats.activeTime += increment;
    }

    this.stats.focusScore = this.calculateFocusScore();
  }

  /**
   * Finalize current streak and update stats
   */
  private finalizeStreak(): void {
    const streakDuration = Math.floor((Date.now() - this.currentStreakStart.getTime()) / 1000);

    if (this.currentStreakType === 'active') {
      if (streakDuration > this.stats.longestActiveStreak) {
        this.stats.longestActiveStreak = streakDuration;
      }
    } else {
      if (streakDuration > this.stats.longestIdleStreak) {
        this.stats.longestIdleStreak = streakDuration;
      }
      this.stats.idleEvents++;
    }
  }

  /**
   * Calculate focus score (0-100)
   */
  private calculateFocusScore(): number {
    if (this.stats.totalTime === 0) {
      return 100;
    }

    const score = Math.round((this.stats.activeTime / this.stats.totalTime) * 100);

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Emit an activity event
   */
  private emitEvent(type: ActivityEventType, data?: Record<string, unknown>): void {
    const event: ActivityEvent = {
      type,
      timestamp: new Date(),
      data,
    };

    this.emit('activity-event', event);
  }

  /**
   * Create empty stats object
   */
  private createEmptyStats(): ActivityStats {
    return {
      totalTime: 0,
      activeTime: 0,
      idleTime: 0,
      idleEvents: 0,
      focusScore: 100,
      longestActiveStreak: 0,
      longestIdleStreak: 0,
    };
  }
}

// Singleton instance
let activityMonitor: ActivityMonitor | null = null;

export function getActivityMonitor(config?: Partial<ActivityConfig>): ActivityMonitor {
  if (!activityMonitor) {
    activityMonitor = new ActivityMonitor(config);
  } else if (config) {
    // Update config if provided
    activityMonitor.updateConfig(config);
  }
  return activityMonitor;
}

export function destroyActivityMonitor(): void {
  if (activityMonitor) {
    activityMonitor.stop();
    activityMonitor = null;
  }
}
