/**
 * Focus Friend - Gamification Module
 * Tutorial 11: Points, Levels, Achievements & Streaks
 *
 * Location: apps/desktop/src/renderer/components/gamification/index.ts
 */

// Data service
export {
  // Types
  type GamificationProfile,
  type Level,
  type Achievement,
  type AchievementCategory,
  type AchievementRarity,
  type PointsResult,
  type DailyChallenge,
  type GamificationStats,
  type AchievementRequirement,

  // Constants
  LEVELS,
  ACHIEVEMENTS,
  RARITY_COLORS,

  // Level functions
  getLevelForXP,
  getLevelProgress,
  getXPToNextLevel,
  calculateMultiplier,

  // Profile management
  getProfile,
  saveProfile,

  // Stats management
  getStats,
  updateStats,

  // Main API
  awardPointsForSession,

  // Achievements
  checkAndUnlockAchievements,
  getAllAchievements,
  getAchievementsByCategory,
  getAchievementProgress,

  // Daily challenges
  getDailyChallenges,
  updateChallengeProgress,

  // Utilities
  resetGamificationData,
  generateDemoProfile,

  // Events
  onGamificationEvent,
  emitGamificationEvent,
} from './gamificationData';

// UI Components
export { LevelProgressBar } from './LevelProgressBar';
export { AchievementBadge } from './AchievementBadge';
export { AchievementsPanel } from './AchievementsPanel';
export { PointsPopup } from './PointsPopup';
export { LevelUpModal } from './LevelUpModal';
export { AchievementToast } from './AchievementToast';
export { DailyChallenges } from './DailyChallenges';
export { GamificationPanel } from './GamificationPanel';

// Hook
export { useGamification } from './useGamification';
