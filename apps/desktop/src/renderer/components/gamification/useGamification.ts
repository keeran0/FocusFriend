/**
 * useGamification - React Hook for Gamification Integration
 * Tutorial 11: Gamification System
 *
 * Location: apps/desktop/src/renderer/hooks/useGamification.ts
 *
 * This hook provides easy integration with the gamification system.
 * Use it in ActivityStatus to award points and show notifications.
 */

import { useState, useCallback, useEffect } from 'react';
import {
  getProfile,
  getLevelForXP,
  awardPointsForSession,
  updateChallengeProgress,
  type GamificationProfile,
  type Level,
  type PointsResult,
  type Achievement,
  type DailyChallenge,
} from './gamificationData';

// ============================================
// TYPES
// ============================================

interface UseGamificationReturn {
  // State
  profile: GamificationProfile | null;
  level: Level | null;
  isLoading: boolean;

  // Pending notifications
  pendingPointsResult: PointsResult | null;
  pendingLevelUp: { previous: Level; new: Level } | null;
  pendingAchievements: Achievement[];

  // Actions
  awardPoints: (focusMinutes: number) => PointsResult;
  refreshProfile: () => void;

  // Clear notifications
  clearPointsResult: () => void;
  clearLevelUp: () => void;
  clearAchievements: () => void;
  clearAllNotifications: () => void;

  // Helpers
  refreshKey: number;
}

// ============================================
// HOOK
// ============================================

export function useGamification(): UseGamificationReturn {
  const [profile, setProfile] = useState<GamificationProfile | null>(null);
  const [level, setLevel] = useState<Level | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Notification queues
  const [pendingPointsResult, setPendingPointsResult] = useState<PointsResult | null>(null);
  const [pendingLevelUp, setPendingLevelUp] = useState<{ previous: Level; new: Level } | null>(
    null
  );
  const [pendingAchievements, setPendingAchievements] = useState<Achievement[]>([]);

  // Load profile on mount
  useEffect(() => {
    refreshProfile();
  }, []);

  const refreshProfile = useCallback(() => {
    setIsLoading(true);
    const p = getProfile();
    const l = getLevelForXP(p.totalXP);
    setProfile(p);
    setLevel(l);
    setIsLoading(false);
    setRefreshKey(k => k + 1);
  }, []);

  const awardPoints = useCallback(
    (focusMinutes: number): PointsResult => {
      // Award points
      const result = awardPointsForSession(focusMinutes);

      // Update challenges
      updateChallengeProgress(focusMinutes);

      // Queue notifications
      setPendingPointsResult(result);

      if (result.leveledUp && result.previousLevel && result.newLevel) {
        setPendingLevelUp({
          previous: result.previousLevel,
          new: result.newLevel,
        });
      }

      if (result.newAchievements.length > 0) {
        setPendingAchievements(prev => [...prev, ...result.newAchievements]);
      }

      // Refresh profile
      refreshProfile();

      return result;
    },
    [refreshProfile]
  );

  const clearPointsResult = useCallback(() => {
    setPendingPointsResult(null);
  }, []);

  const clearLevelUp = useCallback(() => {
    setPendingLevelUp(null);
  }, []);

  const clearAchievements = useCallback(() => {
    setPendingAchievements([]);
  }, []);

  const clearAllNotifications = useCallback(() => {
    setPendingPointsResult(null);
    setPendingLevelUp(null);
    setPendingAchievements([]);
  }, []);

  return {
    profile,
    level,
    isLoading,
    pendingPointsResult,
    pendingLevelUp,
    pendingAchievements,
    awardPoints,
    refreshProfile,
    clearPointsResult,
    clearLevelUp,
    clearAchievements,
    clearAllNotifications,
    refreshKey,
  };
}

export default useGamification;
