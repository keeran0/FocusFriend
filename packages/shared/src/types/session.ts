/**
 * Focus session type definitions
 */

// Focus session
export interface FocusSession {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  plannedDuration: number; // in seconds
  actualDuration?: number; // in seconds
  status: SessionStatus;
  focusScore: number; // 0-100
  idleTime: number; // total idle time in seconds
  nudgeCount: number; // how many nudges were sent
  pointsEarned: number;
  note?: string;
  tags: string[];
}

// Session status
export enum SessionStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
}

// Activity event during a session
export interface ActivityEvent {
  id: string;
  sessionId: string;
  timestamp: Date;
  type: ActivityEventType;
  data?: Record<string, unknown>;
}

export enum ActivityEventType {
  SESSION_START = 'session_start',
  SESSION_PAUSE = 'session_pause',
  SESSION_RESUME = 'session_resume',
  SESSION_END = 'session_end',
  IDLE_DETECTED = 'idle_detected',
  ACTIVITY_RESUMED = 'activity_resumed',
  NUDGE_SENT = 'nudge_sent',
  NUDGE_ACKNOWLEDGED = 'nudge_acknowledged',
}

// Nudge (reminder to focus)
export interface Nudge {
  id: string;
  sessionId: string;
  timestamp: Date;
  type: NudgeType;
  message: string;
  acknowledged: boolean;
  acknowledgedAt?: Date;
}

export enum NudgeType {
  GENTLE = 'gentle', // Subtle reminder
  MODERATE = 'moderate', // Normal notification
  URGENT = 'urgent', // Attention-grabbing
  MOTIVATIONAL = 'motivational', // Encouraging message
  STREAK_REMINDER = 'streak_reminder', // Don't break your streak!
}

// Session summary for dashboard
export interface SessionSummary {
  date: string; // YYYY-MM-DD
  totalSessions: number;
  totalFocusTime: number;
  totalIdleTime: number;
  averageFocusScore: number;
  pointsEarned: number;
}

// Daily/Weekly/Monthly aggregates
export interface ActivityAggregate {
  period: 'day' | 'week' | 'month';
  startDate: string;
  endDate: string;
  sessions: SessionSummary[];
  totalFocusTime: number;
  totalSessions: number;
  averageFocusScore: number;
  totalPoints: number;
  streakDays: number;
}
