/**
 * Activity monitoring type definitions
 */

// Current activity state
export interface ActivityState {
  isIdle: boolean;
  idleDuration: number; // seconds
  lastActivityTime: Date;
  activeWindow: ActiveWindowInfo | null;
  sessionActive: boolean;
}

// Active window information
export interface ActiveWindowInfo {
  title: string;
  appName: string;
  url?: string; // For browsers
}

// Activity event (emitted on state changes)
export interface ActivityEvent {
  type: ActivityEventType;
  timestamp: Date;
  data?: Record<string, unknown>;
}

export type ActivityEventType =
  | 'activity-start' // User became active
  | 'activity-stop' // User became idle
  | 'idle-threshold' // Idle time exceeded threshold
  | 'window-change' // Active window changed
  | 'session-start' // Focus session started
  | 'session-end'; // Focus session ended

// Activity monitoring configuration
export interface ActivityConfig {
  idleThreshold: number; // Seconds before considered idle (default: 120)
  pollInterval: number; // How often to check (default: 1000ms)
  trackWindows: boolean; // Track active window (default: true)
}

// Activity statistics for a session
export interface ActivityStats {
  totalTime: number; // Total session time in seconds
  activeTime: number; // Time user was active
  idleTime: number; // Time user was idle
  idleEvents: number; // Number of times user went idle
  focusScore: number; // 0-100 percentage
  longestActiveStreak: number; // Longest period without going idle
  longestIdleStreak: number; // Longest idle period
}

// Default configuration
export const DEFAULT_ACTIVITY_CONFIG: ActivityConfig = {
  idleThreshold: 120, // 2 minutes
  pollInterval: 1000, // 1 second
  trackWindows: true,
};
