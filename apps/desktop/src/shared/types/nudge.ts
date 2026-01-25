/**
 * Nudge system type definitions
 */

// Nudge severity levels
export type NudgeType = 'gentle' | 'moderate' | 'urgent' | 'motivational' | 'streak_reminder';

// Nudge configuration
export interface NudgeConfig {
  enabled: boolean;
  frequency: NudgeFrequency;
  soundEnabled: boolean;
  escalationEnabled: boolean;
  quietHoursStart?: string; // HH:mm format
  quietHoursEnd?: string;
}

export type NudgeFrequency = 'gentle' | 'moderate' | 'aggressive';

// Frequency timing (seconds after idle detection)
export const NUDGE_TIMING: Record<
  NudgeFrequency,
  { gentle: number; moderate: number; urgent: number }
> = {
  gentle: { gentle: 180, moderate: 300, urgent: 600 }, // 3min, 5min, 10min
  moderate: { gentle: 120, moderate: 180, urgent: 300 }, // 2min, 3min, 5min
  aggressive: { gentle: 60, moderate: 120, urgent: 180 }, // 1min, 2min, 3min
};

// A single nudge instance
export interface Nudge {
  id: string;
  type: NudgeType;
  title: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  sessionId?: string;
}

// Nudge template for message generation
export interface NudgeTemplate {
  type: NudgeType;
  titles: string[];
  messages: string[];
  emoji: string;
}

// Nudge action (what user can do with a nudge)
export type NudgeAction = 'dismiss' | 'snooze' | 'end_session' | 'take_break';

// Nudge event emitted to renderer
export interface NudgeEvent {
  nudge: Nudge;
  showOverlay: boolean;
  playSound: boolean;
}

// Default nudge configuration
export const DEFAULT_NUDGE_CONFIG: NudgeConfig = {
  enabled: true,
  frequency: 'moderate',
  soundEnabled: true,
  escalationEnabled: true,
};
