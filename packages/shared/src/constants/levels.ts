/**
 * Level system constants
 */

import type { Level } from '../types/achievement.js';

// Level definitions
export const LEVELS: Level[] = [
  { level: 1, name: 'Beginner', minPoints: 0, maxPoints: 99, icon: '🌱' },
  { level: 2, name: 'Novice', minPoints: 100, maxPoints: 299, icon: '🌿' },
  { level: 3, name: 'Apprentice', minPoints: 300, maxPoints: 599, icon: '🌳' },
  { level: 4, name: 'Focused', minPoints: 600, maxPoints: 999, icon: '⭐' },
  { level: 5, name: 'Dedicated', minPoints: 1000, maxPoints: 1499, icon: '🌟' },
  { level: 6, name: 'Committed', minPoints: 1500, maxPoints: 2199, icon: '💫' },
  { level: 7, name: 'Expert', minPoints: 2200, maxPoints: 2999, icon: '🔥' },
  { level: 8, name: 'Master', minPoints: 3000, maxPoints: 3999, icon: '💎' },
  { level: 9, name: 'Grandmaster', minPoints: 4000, maxPoints: 5499, icon: '👑' },
  { level: 10, name: 'Legend', minPoints: 5500, maxPoints: Infinity, icon: '🏆' },
];

// Get level for a given point total
export function getLevelForPoints(points: number): Level {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].minPoints) {
      return LEVELS[i];
    }
  }
  return LEVELS[0];
}

// Get progress within current level
export function getLevelProgress(points: number): {
  level: Level;
  pointsInLevel: number;
  pointsForNextLevel: number;
  progressPercent: number;
} {
  const level = getLevelForPoints(points);
  const nextLevel = LEVELS.find(l => l.level === level.level + 1);

  const pointsInLevel = points - level.minPoints;
  const pointsForNextLevel = nextLevel ? nextLevel.minPoints - level.minPoints : 0;
  const progressPercent = nextLevel ? Math.round((pointsInLevel / pointsForNextLevel) * 100) : 100;

  return {
    level,
    pointsInLevel,
    pointsForNextLevel,
    progressPercent,
  };
}
