/**
 * Achievement definitions
 */

import {
  type Achievement,
  AchievementCategory,
  AchievementTier,
  RequirementType,
} from '../types/achievement.js';
import { POINTS } from './points.js';

// All available achievements
export const ACHIEVEMENTS: Omit<Achievement, 'unlockedAt'>[] = [
  // Focus Time Achievements
  {
    id: 'focus_1h',
    name: 'First Hour',
    description: 'Accumulate 1 hour of total focus time',
    icon: '⏱️',
    category: AchievementCategory.FOCUS,
    tier: AchievementTier.BRONZE,
    requirement: { type: RequirementType.TOTAL_FOCUS_TIME, value: 3600, comparison: 'gte' },
    pointsAwarded: POINTS.ACHIEVEMENT_BRONZE,
  },
  {
    id: 'focus_10h',
    name: 'Getting Serious',
    description: 'Accumulate 10 hours of total focus time',
    icon: '📚',
    category: AchievementCategory.FOCUS,
    tier: AchievementTier.SILVER,
    requirement: { type: RequirementType.TOTAL_FOCUS_TIME, value: 36000, comparison: 'gte' },
    pointsAwarded: POINTS.ACHIEVEMENT_SILVER,
  },
  {
    id: 'focus_50h',
    name: 'Dedicated Scholar',
    description: 'Accumulate 50 hours of total focus time',
    icon: '🎓',
    category: AchievementCategory.FOCUS,
    tier: AchievementTier.GOLD,
    requirement: { type: RequirementType.TOTAL_FOCUS_TIME, value: 180000, comparison: 'gte' },
    pointsAwarded: POINTS.ACHIEVEMENT_GOLD,
  },
  {
    id: 'focus_100h',
    name: 'Century Club',
    description: 'Accumulate 100 hours of total focus time',
    icon: '💯',
    category: AchievementCategory.FOCUS,
    tier: AchievementTier.PLATINUM,
    requirement: { type: RequirementType.TOTAL_FOCUS_TIME, value: 360000, comparison: 'gte' },
    pointsAwarded: POINTS.ACHIEVEMENT_PLATINUM,
  },

  // Streak Achievements
  {
    id: 'streak_3',
    name: 'Consistent',
    description: 'Maintain a 3-day focus streak',
    icon: '🔥',
    category: AchievementCategory.STREAK,
    tier: AchievementTier.BRONZE,
    requirement: { type: RequirementType.STREAK_DAYS, value: 3, comparison: 'gte' },
    pointsAwarded: POINTS.ACHIEVEMENT_BRONZE,
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day focus streak',
    icon: '📅',
    category: AchievementCategory.STREAK,
    tier: AchievementTier.SILVER,
    requirement: { type: RequirementType.STREAK_DAYS, value: 7, comparison: 'gte' },
    pointsAwarded: POINTS.ACHIEVEMENT_SILVER,
  },
  {
    id: 'streak_30',
    name: 'Monthly Master',
    description: 'Maintain a 30-day focus streak',
    icon: '🗓️',
    category: AchievementCategory.STREAK,
    tier: AchievementTier.GOLD,
    requirement: { type: RequirementType.STREAK_DAYS, value: 30, comparison: 'gte' },
    pointsAwarded: POINTS.ACHIEVEMENT_GOLD,
  },
  {
    id: 'streak_100',
    name: 'Unstoppable',
    description: 'Maintain a 100-day focus streak',
    icon: '⚡',
    category: AchievementCategory.STREAK,
    tier: AchievementTier.DIAMOND,
    requirement: { type: RequirementType.STREAK_DAYS, value: 100, comparison: 'gte' },
    pointsAwarded: POINTS.ACHIEVEMENT_DIAMOND,
  },

  // Session Achievements
  {
    id: 'sessions_10',
    name: 'Getting Started',
    description: 'Complete 10 focus sessions',
    icon: '🎯',
    category: AchievementCategory.MILESTONE,
    tier: AchievementTier.BRONZE,
    requirement: { type: RequirementType.TOTAL_SESSIONS, value: 10, comparison: 'gte' },
    pointsAwarded: POINTS.ACHIEVEMENT_BRONZE,
  },
  {
    id: 'sessions_100',
    name: 'Session Centurion',
    description: 'Complete 100 focus sessions',
    icon: '🏅',
    category: AchievementCategory.MILESTONE,
    tier: AchievementTier.GOLD,
    requirement: { type: RequirementType.TOTAL_SESSIONS, value: 100, comparison: 'gte' },
    pointsAwarded: POINTS.ACHIEVEMENT_GOLD,
  },
  {
    id: 'perfect_session',
    name: 'Laser Focus',
    description: 'Complete a session with 100% focus score',
    icon: '🎯',
    category: AchievementCategory.FOCUS,
    tier: AchievementTier.SILVER,
    requirement: { type: RequirementType.FOCUS_SCORE, value: 100, comparison: 'eq' },
    pointsAwarded: POINTS.ACHIEVEMENT_SILVER,
  },
  {
    id: 'perfect_10',
    name: 'Perfectionist',
    description: 'Complete 10 sessions with 100% focus score',
    icon: '✨',
    category: AchievementCategory.FOCUS,
    tier: AchievementTier.PLATINUM,
    requirement: { type: RequirementType.PERFECT_SESSIONS, value: 10, comparison: 'gte' },
    pointsAwarded: POINTS.ACHIEVEMENT_PLATINUM,
  },

  // Social Achievements
  {
    id: 'first_friend',
    name: 'Social Butterfly',
    description: 'Add your first friend',
    icon: '🤝',
    category: AchievementCategory.SOCIAL,
    tier: AchievementTier.BRONZE,
    requirement: { type: RequirementType.FRIENDS_COUNT, value: 1, comparison: 'gte' },
    pointsAwarded: POINTS.ACHIEVEMENT_BRONZE,
  },
  {
    id: 'friends_10',
    name: 'Popular',
    description: 'Have 10 friends',
    icon: '👥',
    category: AchievementCategory.SOCIAL,
    tier: AchievementTier.SILVER,
    requirement: { type: RequirementType.FRIENDS_COUNT, value: 10, comparison: 'gte' },
    pointsAwarded: POINTS.ACHIEVEMENT_SILVER,
  },
];

// Get achievement by ID
export function getAchievementById(id: string): Omit<Achievement, 'unlockedAt'> | undefined {
  return ACHIEVEMENTS.find(a => a.id === id);
}

// Get achievements by category
export function getAchievementsByCategory(
  category: AchievementCategory
): Omit<Achievement, 'unlockedAt'>[] {
  return ACHIEVEMENTS.filter(a => a.category === category);
}

// Get achievements by tier
export function getAchievementsByTier(tier: AchievementTier): Omit<Achievement, 'unlockedAt'>[] {
  return ACHIEVEMENTS.filter(a => a.tier === tier);
}
