/**
 * User-related type definitions
 */

// Base user information
export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// User profile with stats
export interface UserProfile extends User {
  stats: UserStats;
  level: UserLevel;
  currentStreak: number;
  longestStreak: number;
  achievements: string[]; // Achievement IDs
}

// User statistics
export interface UserStats {
  totalFocusTime: number; // in seconds
  totalSessions: number;
  totalPoints: number;
  averageSessionLength: number; // in seconds
  completedSessions: number;
  abandonedSessions: number;
}

// User level information
export interface UserLevel {
  current: number;
  name: string;
  pointsInLevel: number;
  pointsForNextLevel: number;
  progressPercent: number;
}

// User settings/preferences
export interface UserSettings {
  userId: string;
  // Notification preferences
  notificationsEnabled: boolean;
  nudgeFrequency: NudgeFrequency;
  quietHoursStart?: string; // HH:mm format
  quietHoursEnd?: string;
  // Session preferences
  defaultSessionDuration: number; // in minutes
  idleThreshold: number; // seconds before considered idle
  // Privacy
  profileVisibility: ProfileVisibility;
  showOnLeaderboard: boolean;
}

// Enums
export enum NudgeFrequency {
  GENTLE = 'gentle', // Every 10 minutes
  MODERATE = 'moderate', // Every 5 minutes
  AGGRESSIVE = 'aggressive', // Every 2 minutes
}

export enum ProfileVisibility {
  PUBLIC = 'public',
  FRIENDS_ONLY = 'friends_only',
  PRIVATE = 'private',
}

// Authentication types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  displayName?: string;
}
