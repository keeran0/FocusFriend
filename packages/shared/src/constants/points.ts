/**
 * Points system constants
 */

// Points earned for various actions
export const POINTS = {
  // Session completion
  SESSION_COMPLETE_BASE: 10, // Base points for completing a session
  SESSION_PER_MINUTE: 1, // Additional points per minute focused
  FOCUS_SCORE_MULTIPLIER: 0.01, // Multiply by focus score (0-100)

  // Bonuses
  PERFECT_SESSION_BONUS: 25, // 100% focus score
  FIRST_SESSION_OF_DAY: 15, // First session each day
  STREAK_BONUS_PER_DAY: 5, // Bonus per day of streak (capped)
  STREAK_BONUS_CAP: 50, // Maximum streak bonus

  // Achievements
  ACHIEVEMENT_BRONZE: 25,
  ACHIEVEMENT_SILVER: 50,
  ACHIEVEMENT_GOLD: 100,
  ACHIEVEMENT_PLATINUM: 200,
  ACHIEVEMENT_DIAMOND: 500,

  // Social
  REFERRAL_BONUS: 100,
  GROUP_SESSION_BONUS: 10,
} as const;

// Calculate points for a completed session
export function calculateSessionPoints(
  durationMinutes: number,
  focusScore: number,
  isFirstOfDay: boolean,
  streakDays: number
): number {
  let points = POINTS.SESSION_COMPLETE_BASE;

  // Duration bonus
  points += durationMinutes * POINTS.SESSION_PER_MINUTE;

  // Focus score multiplier
  points *= 1 + focusScore * POINTS.FOCUS_SCORE_MULTIPLIER;

  // Perfect session bonus
  if (focusScore === 100) {
    points += POINTS.PERFECT_SESSION_BONUS;
  }

  // First session of day
  if (isFirstOfDay) {
    points += POINTS.FIRST_SESSION_OF_DAY;
  }

  // Streak bonus
  const streakBonus = Math.min(streakDays * POINTS.STREAK_BONUS_PER_DAY, POINTS.STREAK_BONUS_CAP);
  points += streakBonus;

  return Math.round(points);
}
