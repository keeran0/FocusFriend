/**
 * Nudge system type definitions
 *
 * Timing is based on multiples of the idle threshold:
 * - Gentle: 2.5x for warning, 5x for auto-pause
 * - Moderate: 2x for warning, 3x for auto-pause
 * - Focused: 1x for auto-pause (immediate after idle detected)
 */

export type NudgeLevel = 1 | 2 | 3;

export interface NudgeStage {
  delayMultiplier: number; // Multiplier of idle threshold
  notification: boolean;
  sound: boolean;
  overlay: boolean;
  autoPause: boolean;
  message: NudgeMessageType;
}

export type NudgeMessageType = 'gentle_reminder' | 'check_in' | 'urgent_warning' | 'session_paused';

export interface NudgeLevelConfig {
  level: NudgeLevel;
  name: string;
  description: string;
  stages: NudgeStage[];
}

export interface NudgeConfig {
  enabled: boolean;
  level: NudgeLevel;
  soundEnabled: boolean;
  idleThreshold: number;
  quietHoursEnabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

export interface Nudge {
  id: string;
  level: NudgeLevel;
  stage: number;
  title: string;
  message: string;
  timestamp: Date;
  notification: boolean;
  sound: boolean;
  overlay: boolean;
  autoPause: boolean;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  sessionId?: string;
}

export interface NudgeEvent {
  nudge: Nudge;
  showOverlay: boolean;
  playSound: boolean;
  autoPause: boolean;
}

/**
 * NUDGE LEVEL CONFIGURATIONS
 *
 * Timing uses multipliers of the idle threshold:
 *
 * Level 1 (Gentle):
 * - Stage 1: 0x (immediately when idle detected)
 * - Stage 2: 2.5x idle threshold
 * - Stage 3: 5x idle threshold (auto-pause)
 *
 * Level 2 (Moderate):
 * - Stage 1: 0x (immediately when idle detected)
 * - Stage 2: 2x idle threshold
 * - Stage 3: 3x idle threshold (auto-pause)
 *
 * Level 3 (Focused):
 * - Stage 1: 0x (immediately when idle detected)
 * - Stage 2: 1x idle threshold (auto-pause)
 */
export const NUDGE_LEVELS: Record<NudgeLevel, NudgeLevelConfig> = {
  1: {
    level: 1,
    name: 'Gentle',
    description: 'Silent notifications only',
    stages: [
      {
        delayMultiplier: 0,
        notification: true,
        sound: false,
        overlay: false,
        autoPause: false,
        message: 'gentle_reminder',
      },
      {
        delayMultiplier: 2.5,
        notification: true,
        sound: false,
        overlay: false,
        autoPause: false,
        message: 'check_in',
      },
      {
        delayMultiplier: 5,
        notification: true,
        sound: false,
        overlay: false,
        autoPause: true,
        message: 'session_paused',
      },
    ],
  },
  2: {
    level: 2,
    name: 'Moderate',
    description: 'Sound alerts',
    stages: [
      {
        delayMultiplier: 0,
        notification: true,
        sound: true,
        overlay: false,
        autoPause: false,
        message: 'gentle_reminder',
      },
      {
        delayMultiplier: 2,
        notification: true,
        sound: true,
        overlay: false,
        autoPause: false,
        message: 'check_in',
      },
      {
        delayMultiplier: 3,
        notification: true,
        sound: true,
        overlay: false,
        autoPause: true,
        message: 'session_paused',
      },
    ],
  },
  3: {
    level: 3,
    name: 'Focused',
    description: 'Popup + sound, quick auto-pause',
    stages: [
      {
        delayMultiplier: 0,
        notification: true,
        sound: true,
        overlay: true,
        autoPause: false,
        message: 'urgent_warning',
      },
      {
        delayMultiplier: 1,
        notification: true,
        sound: true,
        overlay: true,
        autoPause: true,
        message: 'session_paused',
      },
    ],
  },
};

export const DEFAULT_NUDGE_CONFIG: NudgeConfig = {
  enabled: true,
  level: 2,
  soundEnabled: true,
  idleThreshold: 30,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
};

// Helper to calculate actual delay in ms from multiplier
export function calculateStageDelay(multiplier: number, idleThreshold: number): number {
  return multiplier * idleThreshold * 1000;
}
