/**
 * Activity Monitor Service
 * Tracks user activity and idle time using system-level detection
 */

import { EventEmitter } from 'events';
import { powerMonitor } from 'electron';

// Types
export interface ActivityState {
  isIdle: boolean;
  idleDuration: number;
  lastActivityTime: Date;
  activeWindow: { title: string; appName: string; url?: string } | null;
  sessionActive: boolean;
  isPaused: boolean;
}

export interface ActivityStats {
  totalTime: number;
  activeTime: number;
  idleTime: number;
  idleEvents: number;
  focusScore: number;
  longestActiveStreak: number;
  longestIdleStreak: number;
}

export interface ActivityConfig {
  idleThreshold: number; // seconds
  pollInterval: number; // milliseconds
  trackWindows: boolean;
}

export interface ActivityEvent {
  type: string;
  timestamp: Date;
  data?: Record<string, unknown>;
}

const DEFAULT_CONFIG: ActivityConfig = {
  idleThreshold: 30, // 30 seconds for testing
  pollInterval: 1000,
  trackWindows: true,
};

class ActivityMonitor extends EventEmitter {
  private config: ActivityConfig;
  private state: ActivityState;
  private stats: ActivityStats;
  private pollInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;
  private sessionStartTime: Date | null = null;
  private lastIdleEmitTime = 0;
  private hasEmittedIdleThreshold = false;
  private currentActiveStreak = 0;
  private currentIdleStreak = 0;

  constructor(config: Partial<ActivityConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = {
      isIdle: false,
      idleDuration: 0,
      lastActivityTime: new Date(),
      activeWindow: null,
      sessionActive: false,
      isPaused: false,
    };
    this.stats = {
      totalTime: 0,
      activeTime: 0,
      idleTime: 0,
      idleEvents: 0,
      focusScore: 100,
      longestActiveStreak: 0,
      longestIdleStreak: 0,
    };

    console.log('[ActivityMonitor] Initialized with config:', this.config);
  }

  public startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.pollInterval = setInterval(() => this.checkActivity(), this.config.pollInterval);

    this.emitEvent('monitoring-start');
    console.log('[ActivityMonitor] Starting monitoring');
  }

  public stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    this.emitEvent('monitoring-stop');
    console.log('[ActivityMonitor] Stopping monitoring');
  }

  public startSession(): void {
    this.sessionStartTime = new Date();
    this.state.sessionActive = true;
    this.state.isPaused = false;
    this.hasEmittedIdleThreshold = false;

    // Reset stats for new session
    this.stats = {
      totalTime: 0,
      activeTime: 0,
      idleTime: 0,
      idleEvents: 0,
      focusScore: 100,
      longestActiveStreak: 0,
      longestIdleStreak: 0,
    };
    this.currentActiveStreak = 0;
    this.currentIdleStreak = 0;

    this.emitEvent('session-start');
    console.log('[ActivityMonitor] Starting session');
  }

  public endSession(): ActivityStats {
    this.state.sessionActive = false;
    this.state.isPaused = false;
    this.sessionStartTime = null;
    this.hasEmittedIdleThreshold = false;

    const finalStats = { ...this.stats };
    this.emitEvent('session-end', { stats: finalStats });
    console.log('[ActivityMonitor] Ending session');

    return finalStats;
  }

  public pauseSession(): void {
    if (!this.state.sessionActive || this.state.isPaused) {
      console.log('[ActivityMonitor] Cannot pause - session not active or already paused');
      return;
    }

    console.log('[ActivityMonitor] Pausing session');
    this.state.isPaused = true;

    // Finalize current streak
    if (this.state.isIdle) {
      if (this.currentIdleStreak > this.stats.longestIdleStreak) {
        this.stats.longestIdleStreak = this.currentIdleStreak;
      }
    } else {
      if (this.currentActiveStreak > this.stats.longestActiveStreak) {
        this.stats.longestActiveStreak = this.currentActiveStreak;
      }
    }

    this.emitEvent('session-pause');
  }

  public resumeSession(): void {
    if (!this.state.sessionActive || !this.state.isPaused) {
      console.log('[ActivityMonitor] Cannot resume - session not active or not paused');
      return;
    }

    console.log('[ActivityMonitor] Resuming session');
    this.state.isPaused = false;
    this.state.isIdle = false;
    this.state.idleDuration = 0;
    this.state.lastActivityTime = new Date();
    this.hasEmittedIdleThreshold = false;
    this.currentActiveStreak = 0;
    this.currentIdleStreak = 0;

    this.emitEvent('session-resume');
  }

  public getState(): ActivityState {
    return { ...this.state };
  }

  public getStats(): ActivityStats {
    return { ...this.stats };
  }

  public updateConfig(config: Partial<ActivityConfig>): void {
    this.config = { ...this.config, ...config };
    this.hasEmittedIdleThreshold = false; // Reset so new threshold takes effect
    console.log('[ActivityMonitor] Updating config:', config);
  }

  public getIdleTime(): number {
    return powerMonitor.getSystemIdleTime();
  }

  private checkActivity(): void {
    if (!this.isMonitoring) return;

    // Skip if session is paused
    if (this.state.isPaused) {
      this.emit('activity-update', this.getState());
      return;
    }

    const systemIdleTime = powerMonitor.getSystemIdleTime();
    const wasIdle = this.state.isIdle;
    const isNowIdle = systemIdleTime >= this.config.idleThreshold;

    // Update idle duration
    if (isNowIdle) {
      this.state.idleDuration = systemIdleTime;
    } else {
      this.state.idleDuration = 0;
      this.state.lastActivityTime = new Date();
    }

    // State transition: Active -> Idle
    if (!wasIdle && isNowIdle) {
      this.state.isIdle = true;
      console.log(`[ActivityMonitor] State change: ACTIVE -> IDLE (after ${systemIdleTime}s)`);
      this.emitEvent('activity-stop');

      // Emit idle-threshold event ONCE per idle period
      if (!this.hasEmittedIdleThreshold) {
        console.log('[ActivityMonitor] Emitting idle-threshold (ONE TIME)');
        this.hasEmittedIdleThreshold = true;
        this.emitEvent('idle-threshold');
      }

      // Update streaks
      if (this.currentActiveStreak > this.stats.longestActiveStreak) {
        this.stats.longestActiveStreak = this.currentActiveStreak;
      }
      this.currentActiveStreak = 0;

      if (this.state.sessionActive) {
        this.stats.idleEvents++;
      }
    }

    // State transition: Idle -> Active
    if (wasIdle && !isNowIdle) {
      this.state.isIdle = false;
      this.hasEmittedIdleThreshold = false; // Reset for next idle period
      console.log('[ActivityMonitor] State change: IDLE -> ACTIVE');
      this.emitEvent('activity-start');

      // Update streaks
      if (this.currentIdleStreak > this.stats.longestIdleStreak) {
        this.stats.longestIdleStreak = this.currentIdleStreak;
      }
      this.currentIdleStreak = 0;
    }

    // Update session stats
    if (this.state.sessionActive && !this.state.isPaused) {
      const deltaSeconds = this.config.pollInterval / 1000;
      this.stats.totalTime += deltaSeconds;

      if (isNowIdle) {
        this.stats.idleTime += deltaSeconds;
        this.currentIdleStreak += deltaSeconds;
      } else {
        this.stats.activeTime += deltaSeconds;
        this.currentActiveStreak += deltaSeconds;
      }

      // Calculate focus score
      if (this.stats.totalTime > 0) {
        this.stats.focusScore = Math.round((this.stats.activeTime / this.stats.totalTime) * 100);
      }
    }

    // Emit update
    this.emit('activity-update', this.getState());
  }

  private emitEvent(type: string, data?: Record<string, unknown>): void {
    const event: ActivityEvent = {
      type,
      timestamp: new Date(),
      data,
    };
    this.emit('activity-event', event);
  }

  public destroy(): void {
    this.stopMonitoring();
    this.removeAllListeners();
  }
}

// Singleton instance
let activityMonitorInstance: ActivityMonitor | null = null;

export function getActivityMonitor(config?: Partial<ActivityConfig>): ActivityMonitor {
  if (!activityMonitorInstance) {
    activityMonitorInstance = new ActivityMonitor(config);
  } else if (config) {
    activityMonitorInstance.updateConfig(config);
  }
  return activityMonitorInstance;
}

export function destroyActivityMonitor(): void {
  if (activityMonitorInstance) {
    activityMonitorInstance.destroy();
    activityMonitorInstance = null;
  }
}
