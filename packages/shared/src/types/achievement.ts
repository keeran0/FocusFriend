/**
 * Achievement and gamification type definitions
 */

// Achievement definition
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji or icon name
  category: AchievementCategory;
  tier: AchievementTier;
  requirement: AchievementRequirement;
  pointsAwarded: number;
  unlockedAt?: Date;
}

export enum AchievementCategory {
  FOCUS = 'focus', // Related to focus time
  STREAK = 'streak', // Related to streaks
  SOCIAL = 'social', // Related to friends/groups
  MILESTONE = 'milestone', // Total achievements
  SPECIAL = 'special', // Limited time or unique
}

export enum AchievementTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  DIAMOND = 'diamond',
}

// What's required to unlock
export interface AchievementRequirement {
  type: RequirementType;
  value: number;
  comparison: 'gte' | 'lte' | 'eq'; // greater than or equal, less than or equal, equal
}

export enum RequirementType {
  TOTAL_FOCUS_TIME = 'total_focus_time', // Total seconds focused
  SINGLE_SESSION_TIME = 'single_session_time', // Longest single session
  STREAK_DAYS = 'streak_days', // Consecutive days
  TOTAL_SESSIONS = 'total_sessions', // Number of sessions
  TOTAL_POINTS = 'total_points', // Points accumulated
  FRIENDS_COUNT = 'friends_count', // Number of friends
  GROUP_SESSIONS = 'group_sessions', // Sessions with group
  FOCUS_SCORE = 'focus_score', // Average focus score
  PERFECT_SESSIONS = 'perfect_sessions', // Sessions with 100% focus
}

// User's achievement progress
export interface AchievementProgress {
  achievementId: string;
  userId: string;
  currentValue: number;
  targetValue: number;
  progressPercent: number;
  isUnlocked: boolean;
  unlockedAt?: Date;
}

// Streak information
export interface Streak {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  streakStartDate: string;
  isAtRisk: boolean; // True if no session today yet
}

// Level definition
export interface Level {
  level: number;
  name: string;
  minPoints: number;
  maxPoints: number;
  icon: string;
  perks?: string[];
}

// Points transaction
export interface PointsTransaction {
  id: string;
  userId: string;
  amount: number;
  type: PointsTransactionType;
  description: string;
  referenceId?: string; // Session ID, Achievement ID, etc.
  createdAt: Date;
}

export enum PointsTransactionType {
  SESSION_COMPLETE = 'session_complete',
  ACHIEVEMENT_UNLOCK = 'achievement_unlock',
  STREAK_BONUS = 'streak_bonus',
  DAILY_BONUS = 'daily_bonus',
  REFERRAL_BONUS = 'referral_bonus',
  GROUP_BONUS = 'group_bonus',
}
