/**
 * Focus Friend - Gamification Data Service
 * Tutorial 11: Points, Levels, Achievements & Streaks
 *
 * Location: apps/desktop/src/renderer/components/gamification/gamificationData.ts
 *
 * This service handles:
 * ✓ Point calculation with streak multipliers
 * ✓ 10-level progression system with XP thresholds
 * ✓ 30 achievement badges across 6 categories
 * ✓ Daily streak tracking
 * ✓ Daily challenges
 * ✓ Integration with focusWrappedData.ts session storage
 */

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface GamificationProfile {
  id: string;
  displayName: string;
  totalXP: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  unlockedAchievements: string[];
  totalFocusMinutes: number;
  totalSessions: number;
  createdAt: string;
}

export interface Level {
  level: number;
  name: string;
  title: string;
  xpRequired: number;
  xpToNext: number;
  color: string; // Primary color (Vapor Dusk palette)
  glowColor: string; // Glow effect color
  icon: string;
  streakMultiplierBonus: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  rarity: AchievementRarity;
  xpReward: number;
  isSecret: boolean;
  requirement: AchievementRequirement;
}

export interface AchievementRequirement {
  type:
    | 'totalMinutes'
    | 'totalSessions'
    | 'streak'
    | 'longestStreak'
    | 'level'
    | 'longestSession'
    | 'sessionsInDay'
    | 'daysActive'
    | 'nightOwl'
    | 'earlyBird'
    | 'weekend'
    | 'totalXP';
  value: number;
}

export type AchievementCategory =
  | 'time' // Focus time milestones
  | 'streak' // Streak achievements
  | 'sessions' // Session count
  | 'level' // Level milestones
  | 'special' // Time-of-day, weekend, etc.
  | 'challenge'; // Daily challenges

export type AchievementRarity =
  | 'common' // Easy to get (gray/mint)
  | 'uncommon' // Some effort (sky blue)
  | 'rare' // Takes commitment (lavender)
  | 'epic' // Significant achievement (coral)
  | 'legendary'; // Ultimate achievements (gold)

export interface PointsResult {
  basePoints: number;
  streakMultiplier: number;
  levelMultiplier: number;
  totalMultiplier: number;
  bonusPoints: number;
  totalPoints: number;
  newTotalXP: number;
  leveledUp: boolean;
  newLevel?: Level;
  previousLevel?: Level;
  newAchievements: Achievement[];
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  type: 'focus_time' | 'sessions' | 'streak';
  target: number;
  progress: number;
  xpReward: number;
  completed: boolean;
}

export interface GamificationStats {
  totalFocusMinutes: number;
  totalSessions: number;
  currentStreak: number;
  longestStreak: number;
  totalXP: number;
  level: number;
  sessionsToday: number;
  focusMinutesToday: number;
  longestSessionMinutes: number;
  daysActive: number;
  nightOwlSessions: number; // 10pm - 4am
  earlyBirdSessions: number; // 5am - 8am
  weekendSessions: number;
}

// ============================================
// VAPOR DUSK COLOR PALETTE
// ============================================

const COLORS = {
  // Rarity colors (for achievements) - Focus Friend palette
  common: '#A3A3A3', // Neutral
  uncommon: '#4ADE80', // Green
  rare: '#22D3EE', // Cyan
  epic: '#FB923C', // Orange
  legendary: '#FFD93D', // Gold

  // Level colors (Focus Friend green-to-orange progression)
  level1: '#737373', // Neutral gray (Novice)
  level2: '#4ADE80', // Green (early growth)
  level3: '#22C55E', // Deeper green
  level4: '#10B981', // Emerald
  level5: '#22D3EE', // Cyan (mid-tier)
  level6: '#0EA5E9', // Sky blue
  level7: '#FBBF24', // Amber
  level8: '#FB923C', // Orange
  level9: '#F97316', // Deep orange
  level10: '#FFD93D', // Gold (Transcendent)
};

// ============================================
// CONSTANTS: 10-LEVEL SYSTEM
// ============================================

export const LEVELS: Level[] = [
  {
    level: 1,
    name: 'Novice',
    title: 'Focus Novice',
    xpRequired: 0,
    xpToNext: 100,
    color: COLORS.level1,
    glowColor: `${COLORS.level1}66`,
    icon: '🌱',
    streakMultiplierBonus: 0,
  },
  {
    level: 2,
    name: 'Apprentice',
    title: 'Focus Apprentice',
    xpRequired: 100,
    xpToNext: 200,
    color: COLORS.level2,
    glowColor: `${COLORS.level2}66`,
    icon: '🌿',
    streakMultiplierBonus: 0.05,
  },
  {
    level: 3,
    name: 'Adept',
    title: 'Focus Adept',
    xpRequired: 300,
    xpToNext: 300,
    color: COLORS.level3,
    glowColor: `${COLORS.level3}66`,
    icon: '💧',
    streakMultiplierBonus: 0.1,
  },
  {
    level: 4,
    name: 'Skilled',
    title: 'Skilled Focuser',
    xpRequired: 600,
    xpToNext: 400,
    color: COLORS.level4,
    glowColor: `${COLORS.level4}66`,
    icon: '✨',
    streakMultiplierBonus: 0.15,
  },
  {
    level: 5,
    name: 'Expert',
    title: 'Focus Expert',
    xpRequired: 1000,
    xpToNext: 500,
    color: COLORS.level5,
    glowColor: `${COLORS.level5}66`,
    icon: '💎',
    streakMultiplierBonus: 0.2,
  },
  {
    level: 6,
    name: 'Master',
    title: 'Focus Master',
    xpRequired: 1500,
    xpToNext: 700,
    color: COLORS.level6,
    glowColor: `${COLORS.level6}66`,
    icon: '🔮',
    streakMultiplierBonus: 0.25,
  },
  {
    level: 7,
    name: 'Grandmaster',
    title: 'Focus Grandmaster',
    xpRequired: 2200,
    xpToNext: 800,
    color: COLORS.level7,
    glowColor: `${COLORS.level7}66`,
    icon: '👑',
    streakMultiplierBonus: 0.3,
  },
  {
    level: 8,
    name: 'Champion',
    title: 'Focus Champion',
    xpRequired: 3000,
    xpToNext: 1000,
    color: COLORS.level8,
    glowColor: `${COLORS.level8}66`,
    icon: '🏆',
    streakMultiplierBonus: 0.4,
  },
  {
    level: 9,
    name: 'Legend',
    title: 'Focus Legend',
    xpRequired: 4000,
    xpToNext: 1500,
    color: COLORS.level9,
    glowColor: `${COLORS.level9}66`,
    icon: '⚡',
    streakMultiplierBonus: 0.5,
  },
  {
    level: 10,
    name: 'Transcendent',
    title: 'Transcendent Master',
    xpRequired: 5500,
    xpToNext: Infinity,
    color: COLORS.level10,
    glowColor: `${COLORS.level10}88`,
    icon: '🌟',
    streakMultiplierBonus: 0.75,
  },
];

// ============================================
// CONSTANTS: 30 ACHIEVEMENTS
// ============================================

export const ACHIEVEMENTS: Achievement[] = [
  // ========== TIME ACHIEVEMENTS (8) ==========
  {
    id: 'first_focus',
    name: 'First Focus',
    description: 'Complete your first focus session',
    category: 'time',
    icon: '🎯',
    rarity: 'common',
    xpReward: 10,
    isSecret: false,
    requirement: { type: 'totalSessions', value: 1 },
  },
  {
    id: 'hour_hero',
    name: 'Hour Hero',
    description: 'Accumulate 1 hour of focus time',
    category: 'time',
    icon: '⏰',
    rarity: 'common',
    xpReward: 20,
    isSecret: false,
    requirement: { type: 'totalMinutes', value: 60 },
  },
  {
    id: 'five_hours',
    name: 'Five Hour Club',
    description: 'Accumulate 5 hours of focus time',
    category: 'time',
    icon: '🕐',
    rarity: 'uncommon',
    xpReward: 50,
    isSecret: false,
    requirement: { type: 'totalMinutes', value: 300 },
  },
  {
    id: 'day_worker',
    name: 'Day Worker',
    description: 'Accumulate 24 hours of focus time',
    category: 'time',
    icon: '☀️',
    rarity: 'rare',
    xpReward: 100,
    isSecret: false,
    requirement: { type: 'totalMinutes', value: 1440 },
  },
  {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: 'Accumulate 1 week of focus time (168 hours)',
    category: 'time',
    icon: '📅',
    rarity: 'epic',
    xpReward: 300,
    isSecret: false,
    requirement: { type: 'totalMinutes', value: 10080 },
  },
  {
    id: 'marathon_mind',
    name: 'Marathon Mind',
    description: 'Complete a 60+ minute session',
    category: 'time',
    icon: '🏃',
    rarity: 'uncommon',
    xpReward: 40,
    isSecret: false,
    requirement: { type: 'longestSession', value: 60 },
  },
  {
    id: 'ultra_focus',
    name: 'Ultra Focus',
    description: 'Complete a 90+ minute session',
    category: 'time',
    icon: '🦾',
    rarity: 'rare',
    xpReward: 75,
    isSecret: false,
    requirement: { type: 'longestSession', value: 90 },
  },
  {
    id: 'iron_will',
    name: 'Iron Will',
    description: 'Complete a 2+ hour session',
    category: 'time',
    icon: '🔩',
    rarity: 'epic',
    xpReward: 150,
    isSecret: false,
    requirement: { type: 'longestSession', value: 120 },
  },

  // ========== STREAK ACHIEVEMENTS (6) ==========
  {
    id: 'streak_starter',
    name: 'Streak Starter',
    description: 'Achieve a 3-day streak',
    category: 'streak',
    icon: '🔥',
    rarity: 'common',
    xpReward: 25,
    isSecret: false,
    requirement: { type: 'streak', value: 3 },
  },
  {
    id: 'week_streak',
    name: 'Unstoppable',
    description: 'Achieve a 7-day streak',
    category: 'streak',
    icon: '💪',
    rarity: 'uncommon',
    xpReward: 75,
    isSecret: false,
    requirement: { type: 'streak', value: 7 },
  },
  {
    id: 'two_week_streak',
    name: 'Fortnight Fighter',
    description: 'Achieve a 14-day streak',
    category: 'streak',
    icon: '⚔️',
    rarity: 'rare',
    xpReward: 150,
    isSecret: false,
    requirement: { type: 'streak', value: 14 },
  },
  {
    id: 'month_streak',
    name: 'Monthly Master',
    description: 'Achieve a 30-day streak',
    category: 'streak',
    icon: '🗓️',
    rarity: 'epic',
    xpReward: 300,
    isSecret: false,
    requirement: { type: 'streak', value: 30 },
  },
  {
    id: 'quarter_streak',
    name: 'Quarterly Champion',
    description: 'Achieve a 90-day streak',
    category: 'streak',
    icon: '🏅',
    rarity: 'legendary',
    xpReward: 500,
    isSecret: false,
    requirement: { type: 'longestStreak', value: 90 },
  },
  {
    id: 'active_veteran',
    name: 'Active Veteran',
    description: 'Be active for 50 different days',
    category: 'streak',
    icon: '🎖️',
    rarity: 'rare',
    xpReward: 100,
    isSecret: false,
    requirement: { type: 'daysActive', value: 50 },
  },

  // ========== SESSION ACHIEVEMENTS (6) ==========
  {
    id: 'getting_started',
    name: 'Getting Started',
    description: 'Complete 5 sessions',
    category: 'sessions',
    icon: '🚀',
    rarity: 'common',
    xpReward: 15,
    isSecret: false,
    requirement: { type: 'totalSessions', value: 5 },
  },
  {
    id: 'double_digits',
    name: 'Double Digits',
    description: 'Complete 10 sessions',
    category: 'sessions',
    icon: '🔟',
    rarity: 'common',
    xpReward: 25,
    isSecret: false,
    requirement: { type: 'totalSessions', value: 10 },
  },
  {
    id: 'fifty_sessions',
    name: 'Fifty & Focused',
    description: 'Complete 50 sessions',
    category: 'sessions',
    icon: '5️⃣',
    rarity: 'uncommon',
    xpReward: 75,
    isSecret: false,
    requirement: { type: 'totalSessions', value: 50 },
  },
  {
    id: 'century_club',
    name: 'Century Club',
    description: 'Complete 100 sessions',
    category: 'sessions',
    icon: '💯',
    rarity: 'rare',
    xpReward: 150,
    isSecret: false,
    requirement: { type: 'totalSessions', value: 100 },
  },
  {
    id: 'five_hundred',
    name: 'High Five Hundred',
    description: 'Complete 500 sessions',
    category: 'sessions',
    icon: '🖐️',
    rarity: 'epic',
    xpReward: 400,
    isSecret: false,
    requirement: { type: 'totalSessions', value: 500 },
  },
  {
    id: 'daily_grinder',
    name: 'Daily Grinder',
    description: 'Complete 5 sessions in a single day',
    category: 'sessions',
    icon: '⚙️',
    rarity: 'uncommon',
    xpReward: 50,
    isSecret: false,
    requirement: { type: 'sessionsInDay', value: 5 },
  },

  // ========== LEVEL ACHIEVEMENTS (4) ==========
  {
    id: 'level_5',
    name: 'Rising Star',
    description: 'Reach Level 5',
    category: 'level',
    icon: '⭐',
    rarity: 'uncommon',
    xpReward: 50,
    isSecret: false,
    requirement: { type: 'level', value: 5 },
  },
  {
    id: 'level_7',
    name: 'Elite Status',
    description: 'Reach Level 7',
    category: 'level',
    icon: '🌟',
    rarity: 'rare',
    xpReward: 100,
    isSecret: false,
    requirement: { type: 'level', value: 7 },
  },
  {
    id: 'level_9',
    name: 'Legendary Status',
    description: 'Reach Level 9',
    category: 'level',
    icon: '💫',
    rarity: 'epic',
    xpReward: 200,
    isSecret: false,
    requirement: { type: 'level', value: 9 },
  },
  {
    id: 'max_level',
    name: 'Transcendence',
    description: 'Reach Level 10 - Maximum Level',
    category: 'level',
    icon: '✨',
    rarity: 'legendary',
    xpReward: 500,
    isSecret: false,
    requirement: { type: 'level', value: 10 },
  },

  // ========== SPECIAL ACHIEVEMENTS (6) ==========
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Complete 10 sessions between 10 PM and 4 AM',
    category: 'special',
    icon: '🦉',
    rarity: 'uncommon',
    xpReward: 40,
    isSecret: false,
    requirement: { type: 'nightOwl', value: 10 },
  },
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Complete 10 sessions between 5 AM and 8 AM',
    category: 'special',
    icon: '🐦',
    rarity: 'uncommon',
    xpReward: 40,
    isSecret: false,
    requirement: { type: 'earlyBird', value: 10 },
  },
  {
    id: 'weekend_warrior',
    name: 'Weekend Warrior',
    description: 'Complete 20 sessions on weekends',
    category: 'special',
    icon: '🎮',
    rarity: 'uncommon',
    xpReward: 45,
    isSecret: false,
    requirement: { type: 'weekend', value: 20 },
  },
  {
    id: 'xp_thousand',
    name: 'XP Collector',
    description: 'Earn 1,000 total XP',
    category: 'special',
    icon: '💎',
    rarity: 'uncommon',
    xpReward: 50,
    isSecret: false,
    requirement: { type: 'totalXP', value: 1000 },
  },
  {
    id: 'xp_five_thousand',
    name: 'XP Hoarder',
    description: 'Earn 5,000 total XP',
    category: 'special',
    icon: '💰',
    rarity: 'rare',
    xpReward: 100,
    isSecret: false,
    requirement: { type: 'totalXP', value: 5000 },
  },
  {
    id: 'xp_ten_thousand',
    name: 'XP Millionaire',
    description: 'Earn 10,000 total XP',
    category: 'special',
    icon: '👑',
    rarity: 'legendary',
    xpReward: 250,
    isSecret: true,
    requirement: { type: 'totalXP', value: 10000 },
  },
];

// ============================================
// RARITY COLORS
// ============================================

export const RARITY_COLORS: Record<
  AchievementRarity,
  { bg: string; border: string; text: string }
> = {
  common: {
    bg: 'rgba(163, 163, 163, 0.1)',
    border: 'rgba(163, 163, 163, 0.3)',
    text: '#A3A3A3',
  },
  uncommon: {
    bg: 'rgba(74, 222, 128, 0.1)',
    border: 'rgba(74, 222, 128, 0.3)',
    text: '#4ADE80',
  },
  rare: {
    bg: 'rgba(34, 211, 238, 0.1)',
    border: 'rgba(34, 211, 238, 0.3)',
    text: '#22D3EE',
  },
  epic: {
    bg: 'rgba(251, 146, 60, 0.1)',
    border: 'rgba(251, 146, 60, 0.3)',
    text: '#FB923C',
  },
  legendary: {
    bg: 'rgba(255, 217, 61, 0.15)',
    border: 'rgba(255, 217, 61, 0.4)',
    text: '#FFD93D',
  },
};

// ============================================
// STORAGE KEYS
// ============================================

const STORAGE_KEYS = {
  PROFILE: 'focus-friend-gamification-profile',
  STATS: 'focus-friend-gamification-stats',
  CHALLENGES: 'focus-friend-daily-challenges',
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const getToday = (): string => {
  return new Date().toISOString().split('T')[0];
};

const getYesterday = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
};

const isWeekend = (): boolean => {
  const day = new Date().getDay();
  return day === 0 || day === 6;
};

const isNightOwlHour = (): boolean => {
  const hour = new Date().getHours();
  return hour >= 22 || hour < 4;
};

const isEarlyBirdHour = (): boolean => {
  const hour = new Date().getHours();
  return hour >= 5 && hour < 8;
};

// ============================================
// LEVEL FUNCTIONS
// ============================================

export const getLevelForXP = (xp: number): Level => {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xpRequired) {
      return LEVELS[i];
    }
  }
  return LEVELS[0];
};

export const getLevelProgress = (xp: number): { current: number; max: number; percent: number } => {
  const level = getLevelForXP(xp);
  const nextLevel = LEVELS.find(l => l.level === level.level + 1);

  if (!nextLevel) {
    return { current: xp - level.xpRequired, max: 1000, percent: 100 };
  }

  const xpIntoLevel = xp - level.xpRequired;
  const xpForLevel = nextLevel.xpRequired - level.xpRequired;
  const percent = Math.min(100, Math.round((xpIntoLevel / xpForLevel) * 100));

  return { current: xpIntoLevel, max: xpForLevel, percent };
};

export const getXPToNextLevel = (xp: number): number => {
  const level = getLevelForXP(xp);
  const nextLevel = LEVELS.find(l => l.level === level.level + 1);

  if (!nextLevel) return 0;
  return nextLevel.xpRequired - xp;
};

// ============================================
// MULTIPLIER CALCULATION
// ============================================

export const calculateMultiplier = (
  level: Level,
  streak: number
): {
  streakMultiplier: number;
  levelMultiplier: number;
  totalMultiplier: number;
} => {
  // Streak bonus: +2% per day, max +50%
  const streakMultiplier = 1 + Math.min(0.5, streak * 0.02);

  // Level bonus: from level data
  const levelMultiplier = 1 + level.streakMultiplierBonus;

  // Combined (multiplicative)
  const totalMultiplier = Math.round(streakMultiplier * levelMultiplier * 100) / 100;

  return {
    streakMultiplier: Math.round(streakMultiplier * 100) / 100,
    levelMultiplier: Math.round(levelMultiplier * 100) / 100,
    totalMultiplier: Math.min(2.5, totalMultiplier), // Cap at 2.5x
  };
};

// ============================================
// PROFILE MANAGEMENT
// ============================================

export const getProfile = (): GamificationProfile => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('[Gamification] Error loading profile:', error);
  }

  // Create new profile
  const profile: GamificationProfile = {
    id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    displayName: 'Focus Friend',
    totalXP: 0,
    level: 1,
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: '',
    unlockedAchievements: [],
    totalFocusMinutes: 0,
    totalSessions: 0,
    createdAt: new Date().toISOString(),
  };

  saveProfile(profile);
  return profile;
};

export const saveProfile = (profile: GamificationProfile): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (error) {
    console.error('[Gamification] Error saving profile:', error);
  }
};

// ============================================
// STATS MANAGEMENT
// ============================================

export const getStats = (): GamificationStats => {
  const profile = getProfile();

  let additionalStats = {
    sessionsToday: 0,
    focusMinutesToday: 0,
    longestSessionMinutes: 0,
    daysActive: 0,
    nightOwlSessions: 0,
    earlyBirdSessions: 0,
    weekendSessions: 0,
  };

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.STATS);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Reset daily stats if it's a new day
      if (parsed.date !== getToday()) {
        parsed.sessionsToday = 0;
        parsed.focusMinutesToday = 0;
      }
      additionalStats = { ...additionalStats, ...parsed };
    }
  } catch (error) {
    console.error('[Gamification] Error loading stats:', error);
  }

  return {
    totalFocusMinutes: profile.totalFocusMinutes,
    totalSessions: profile.totalSessions,
    currentStreak: profile.currentStreak,
    longestStreak: profile.longestStreak,
    totalXP: profile.totalXP,
    level: profile.level,
    ...additionalStats,
  };
};

export const updateStats = (updates: Partial<GamificationStats>): void => {
  try {
    const current = getStats();
    const updated = {
      ...current,
      ...updates,
      date: getToday(), // Track which day these stats are for
    };
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(updated));
  } catch (error) {
    console.error('[Gamification] Error updating stats:', error);
  }
};

// ============================================
// MAIN API: AWARD POINTS FOR SESSION
// ============================================

export const awardPointsForSession = (focusMinutes: number): PointsResult => {
  const profile = getProfile();
  const stats = getStats();
  const today = getToday();
  const yesterday = getYesterday();

  // === UPDATE STREAK ===
  let newStreak = profile.currentStreak;
  if (profile.lastActiveDate === today) {
    // Same day, streak unchanged
  } else if (profile.lastActiveDate === yesterday) {
    // Consecutive day, increment streak
    newStreak += 1;
  } else if (profile.lastActiveDate === '') {
    // First session ever
    newStreak = 1;
  } else {
    // Streak broken
    newStreak = 1;
  }

  // === CALCULATE POINTS ===
  const currentLevel = getLevelForXP(profile.totalXP);
  const multipliers = calculateMultiplier(currentLevel, newStreak);

  const basePoints = Math.round(focusMinutes); // 1 XP per minute
  const bonusPoints = Math.round(basePoints * (multipliers.totalMultiplier - 1));
  const totalPoints = basePoints + bonusPoints;

  // === UPDATE PROFILE ===
  const previousXP = profile.totalXP;
  profile.totalXP += totalPoints;
  profile.totalFocusMinutes += focusMinutes;
  profile.totalSessions += 1;
  profile.currentStreak = newStreak;
  profile.longestStreak = Math.max(profile.longestStreak, newStreak);
  profile.lastActiveDate = today;
  profile.level = getLevelForXP(profile.totalXP).level;

  // === CHECK LEVEL UP ===
  const newLevel = getLevelForXP(profile.totalXP);
  const previousLevel = getLevelForXP(previousXP);
  const leveledUp = newLevel.level > previousLevel.level;

  // === UPDATE STATS ===
  const newStats: Partial<GamificationStats> = {
    sessionsToday: stats.sessionsToday + 1,
    focusMinutesToday: stats.focusMinutesToday + focusMinutes,
    longestSessionMinutes: Math.max(stats.longestSessionMinutes, focusMinutes),
    daysActive: profile.lastActiveDate !== today ? stats.daysActive + 1 : stats.daysActive,
  };

  // Track special session types
  if (isNightOwlHour()) {
    newStats.nightOwlSessions = (stats.nightOwlSessions || 0) + 1;
  }
  if (isEarlyBirdHour()) {
    newStats.earlyBirdSessions = (stats.earlyBirdSessions || 0) + 1;
  }
  if (isWeekend()) {
    newStats.weekendSessions = (stats.weekendSessions || 0) + 1;
  }

  updateStats(newStats);
  saveProfile(profile);

  // === CHECK ACHIEVEMENTS ===
  const newAchievements = checkAndUnlockAchievements();

  return {
    basePoints,
    streakMultiplier: multipliers.streakMultiplier,
    levelMultiplier: multipliers.levelMultiplier,
    totalMultiplier: multipliers.totalMultiplier,
    bonusPoints,
    totalPoints,
    newTotalXP: profile.totalXP,
    leveledUp,
    newLevel: leveledUp ? newLevel : undefined,
    previousLevel: leveledUp ? previousLevel : undefined,
    newAchievements,
  };
};

// ============================================
// ACHIEVEMENTS
// ============================================

const checkAchievementRequirement = (
  achievement: Achievement,
  stats: GamificationStats
): boolean => {
  const { type, value } = achievement.requirement;

  switch (type) {
    case 'totalMinutes':
      return stats.totalFocusMinutes >= value;
    case 'totalSessions':
      return stats.totalSessions >= value;
    case 'streak':
      return stats.currentStreak >= value;
    case 'longestStreak':
      return stats.longestStreak >= value;
    case 'level':
      return stats.level >= value;
    case 'longestSession':
      return stats.longestSessionMinutes >= value;
    case 'sessionsInDay':
      return stats.sessionsToday >= value;
    case 'daysActive':
      return stats.daysActive >= value;
    case 'nightOwl':
      return stats.nightOwlSessions >= value;
    case 'earlyBird':
      return stats.earlyBirdSessions >= value;
    case 'weekend':
      return stats.weekendSessions >= value;
    case 'totalXP':
      return stats.totalXP >= value;
    default:
      return false;
  }
};

export const checkAndUnlockAchievements = (): Achievement[] => {
  const profile = getProfile();
  const stats = getStats();
  const newlyUnlocked: Achievement[] = [];

  for (const achievement of ACHIEVEMENTS) {
    // Skip already unlocked
    if (profile.unlockedAchievements.includes(achievement.id)) {
      continue;
    }

    // Check if requirement is met
    if (checkAchievementRequirement(achievement, stats)) {
      profile.unlockedAchievements.push(achievement.id);
      profile.totalXP += achievement.xpReward;
      newlyUnlocked.push(achievement);
    }
  }

  if (newlyUnlocked.length > 0) {
    // Update level after achievement XP
    profile.level = getLevelForXP(profile.totalXP).level;
    saveProfile(profile);
  }

  return newlyUnlocked;
};

export const getAllAchievements = (): (Achievement & {
  unlocked: boolean;
  unlockedAt?: string;
})[] => {
  const profile = getProfile();

  return ACHIEVEMENTS.map(achievement => ({
    ...achievement,
    unlocked: profile.unlockedAchievements.includes(achievement.id),
  }));
};

export const getAchievementsByCategory = (category: AchievementCategory) => {
  return getAllAchievements().filter(a => a.category === category);
};

export const getAchievementProgress = () => {
  const all = getAllAchievements();
  const unlocked = all.filter(a => a.unlocked);

  const byRarity = (rarity: AchievementRarity) => ({
    total: all.filter(a => a.rarity === rarity).length,
    unlocked: unlocked.filter(a => a.rarity === rarity).length,
  });

  return {
    total: all.length,
    unlocked: unlocked.length,
    percentage: Math.round((unlocked.length / all.length) * 100),
    byRarity: {
      common: byRarity('common'),
      uncommon: byRarity('uncommon'),
      rare: byRarity('rare'),
      epic: byRarity('epic'),
      legendary: byRarity('legendary'),
    },
  };
};

// ============================================
// DAILY CHALLENGES
// ============================================

export const getDailyChallenges = (): DailyChallenge[] => {
  const today = getToday();

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CHALLENGES);
    if (stored) {
      const data = JSON.parse(stored);
      if (data.date === today) {
        return data.challenges;
      }
    }
  } catch (error) {
    console.error('[Gamification] Error loading challenges:', error);
  }

  // Generate new daily challenges
  const challenges: DailyChallenge[] = [
    {
      id: 'daily_focus_60',
      title: 'Focus Hour',
      description: 'Focus for 60 minutes today',
      type: 'focus_time',
      target: 60,
      progress: 0,
      xpReward: 30,
      completed: false,
    },
    {
      id: 'daily_sessions_3',
      title: 'Triple Threat',
      description: 'Complete 3 focus sessions',
      type: 'sessions',
      target: 3,
      progress: 0,
      xpReward: 25,
      completed: false,
    },
    {
      id: 'daily_streak',
      title: 'Keep It Going',
      description: 'Maintain your streak today',
      type: 'streak',
      target: 1,
      progress: 0,
      xpReward: 15,
      completed: false,
    },
  ];

  localStorage.setItem(
    STORAGE_KEYS.CHALLENGES,
    JSON.stringify({
      date: today,
      challenges,
    })
  );

  return challenges;
};

export const updateChallengeProgress = (focusMinutes: number): DailyChallenge[] => {
  const challenges = getDailyChallenges();
  const profile = getProfile();
  let xpFromChallenges = 0;

  for (const challenge of challenges) {
    if (challenge.completed) continue;

    switch (challenge.type) {
      case 'focus_time':
        challenge.progress = Math.min(challenge.target, challenge.progress + focusMinutes);
        break;
      case 'sessions':
        challenge.progress = Math.min(challenge.target, challenge.progress + 1);
        break;
      case 'streak':
        challenge.progress = profile.currentStreak > 0 ? 1 : 0;
        break;
    }

    if (challenge.progress >= challenge.target && !challenge.completed) {
      challenge.completed = true;
      xpFromChallenges += challenge.xpReward;
    }
  }

  // Save updated challenges
  localStorage.setItem(
    STORAGE_KEYS.CHALLENGES,
    JSON.stringify({
      date: getToday(),
      challenges,
    })
  );

  // Award XP from completed challenges
  if (xpFromChallenges > 0) {
    profile.totalXP += xpFromChallenges;
    profile.level = getLevelForXP(profile.totalXP).level;
    saveProfile(profile);
  }

  return challenges;
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

export const resetGamificationData = (): void => {
  localStorage.removeItem(STORAGE_KEYS.PROFILE);
  localStorage.removeItem(STORAGE_KEYS.STATS);
  localStorage.removeItem(STORAGE_KEYS.CHALLENGES);
  console.log('[Gamification] All data reset');
};

export const generateDemoProfile = (): GamificationProfile => {
  const profile: GamificationProfile = {
    id: `demo_${Date.now()}`,
    displayName: 'Demo User',
    totalXP: 1850,
    level: 6,
    currentStreak: 12,
    longestStreak: 18,
    lastActiveDate: getToday(),
    unlockedAchievements: [
      'first_focus',
      'hour_hero',
      'five_hours',
      'marathon_mind',
      'streak_starter',
      'week_streak',
      'getting_started',
      'double_digits',
      'fifty_sessions',
      'level_5',
      'xp_thousand',
    ],
    totalFocusMinutes: 1850,
    totalSessions: 87,
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
  };

  saveProfile(profile);

  updateStats({
    sessionsToday: 2,
    focusMinutesToday: 45,
    longestSessionMinutes: 75,
    daysActive: 45,
    nightOwlSessions: 8,
    earlyBirdSessions: 3,
    weekendSessions: 18,
  });

  return profile;
};

// ============================================
// EVENT SYSTEM FOR UI UPDATES
// ============================================

type GamificationEventType =
  | 'points-awarded'
  | 'level-up'
  | 'achievement-unlocked'
  | 'streak-updated'
  | 'challenge-completed';

type GamificationEventCallback = (data: unknown) => void;

const eventListeners: Map<GamificationEventType, Set<GamificationEventCallback>> = new Map();

export const onGamificationEvent = (
  event: GamificationEventType,
  callback: GamificationEventCallback
): (() => void) => {
  if (!eventListeners.has(event)) {
    eventListeners.set(event, new Set());
  }
  eventListeners.get(event)!.add(callback);

  // Return unsubscribe function
  return () => {
    eventListeners.get(event)?.delete(callback);
  };
};

export const emitGamificationEvent = (event: GamificationEventType, data: unknown): void => {
  const listeners = eventListeners.get(event);
  if (listeners) {
    listeners.forEach(callback => callback(data));
  }
};
