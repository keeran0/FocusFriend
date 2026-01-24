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

  constructor(config: Partial<ActivityConfig> = {}) {
    super();
    this.config = {
      idleThreshold: config.idleThreshold ?? 120,
      pollInterval: config.pollInterval ?? 1000,
      trackWindows: config.trackWindows ?? true,
    };
  }

  /**
   * Start monitoring activity
   */
  start(): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    this.state.lastActivityTime = new Date();

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

    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }

    this.isMonitoring = false;
    this.emit('monitoring-stopped');
  }

  /**
   * Start a focus session
   */
  startSession(): void {
    this.sessionActive = true;
    this.state.sessionActive = true;
    this.stats = this.createEmptyStats();
    this.currentStreakStart = new Date();
    this.currentStreakType = 'active';

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
    this.sessionActive = false;
    this.state.sessionActive = false;

    // Finalize current streak
    this.finalizeStreak();

    // Calculate final focus score
    this.stats.focusScore = this.calculateFocusScore();

    this.emitEvent('session-end', { stats: this.stats });

    const finalStats = { ...this.stats };
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
    this.config = { ...this.config, ...config };
  }

  /**
   * Check current activity status
   */
  private checkActivity(): void {
    const idleSeconds = powerMonitor.getSystemIdleTime();
    const wasIdle = this.state.isIdle;
    const isNowIdle = idleSeconds >= this.config.idleThreshold;

    // Update state
    this.state.idleDuration = idleSeconds;

    // Detect state change
    if (!wasIdle && isNowIdle) {
      // User became idle
      this.onBecameIdle();
    } else if (wasIdle && !isNowIdle) {
      // User became active
      this.onBecameActive();
    }

    // Update session stats if session is active
    if (this.sessionActive) {
      this.updateSessionStats(isNowIdle);
    }

    // Emit periodic update
    this.emit('activity-update', this.state);
  }

  /**
   * Handle user becoming idle
   */
  private onBecameIdle(): void {
    this.state.isIdle = true;

    // Finalize active streak
    this.finalizeStreak();
    this.currentStreakStart = new Date();
    this.currentStreakType = 'idle';

    this.emitEvent('activity-stop');
    this.emitEvent('idle-threshold', {
      idleDuration: this.state.idleDuration,
    });

    // Notify renderer to show nudge
    this.notifyRenderer('idle-detected', {
      duration: this.state.idleDuration,
    });
  }

  /**
   * Handle user becoming active
   */
  private onBecameActive(): void {
    this.state.isIdle = false;
    this.state.lastActivityTime = new Date();

    // Finalize idle streak
    this.finalizeStreak();
    this.currentStreakStart = new Date();
    this.currentStreakType = 'active';

    this.emitEvent('activity-start');

    // Notify renderer
    this.notifyRenderer('activity-resumed', {});
  }

  /**
   * Update session statistics
   */
  private updateSessionStats(isIdle: boolean): void {
    const increment = this.config.pollInterval / 1000; // Convert to seconds

    this.stats.totalTime += increment;

    if (isIdle) {
      this.stats.idleTime += increment;
    } else {
      this.stats.activeTime += increment;
    }

    // Update focus score periodically
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
   * Send notification to renderer process
   */
  private notifyRenderer(channel: string, data: Record<string, unknown>): void {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach(window => {
      if (!window.isDestroyed()) {
        window.webContents.send(channel, data);
      }
    });
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
  }
  return activityMonitor;
}

export function destroyActivityMonitor(): void {
  if (activityMonitor) {
    activityMonitor.stop();
    activityMonitor = null;
  }
}
