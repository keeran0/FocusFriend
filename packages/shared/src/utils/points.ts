/**
 * Points calculation utilities
 */

import { getLevelForPoints, getLevelProgress } from '../constants/levels.js';
import type { UserLevel } from '../types/user.js';

// Calculate focus score based on idle time and total time
export function calculateFocusScore(totalDuration: number, idleTime: number): number {
  if (totalDuration <= 0) return 0;

  const activeTime = totalDuration - idleTime;
  const score = Math.round((activeTime / totalDuration) * 100);

  return Math.max(0, Math.min(100, score));
}

// Get user level info from total points
export function getUserLevel(totalPoints: number): UserLevel {
  const progress = getLevelProgress(totalPoints);

  return {
    current: progress.level.level,
    name: progress.level.name,
    pointsInLevel: progress.pointsInLevel,
    pointsForNextLevel: progress.pointsForNextLevel,
    progressPercent: progress.progressPercent,
  };
}

// Check if user leveled up
export function didLevelUp(previousPoints: number, newPoints: number): boolean {
  const previousLevel = getLevelForPoints(previousPoints);
  const newLevel = getLevelForPoints(newPoints);

  return newLevel.level > previousLevel.level;
}

// Format points with thousands separator
export function formatPoints(points: number): string {
  return points.toLocaleString();
}

// Format rank (1st, 2nd, 3rd, etc.)
export function formatRank(rank: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const value = rank % 100;

  return rank + (suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0]);
}
