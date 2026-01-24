/**
 * React hook for activity monitoring
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ActivityState, ActivityStats } from '../../shared/types/activity';

interface UseActivityOptions {
  autoStart?: boolean;
  idleThreshold?: number;
}

interface UseActivityReturn {
  // State
  state: ActivityState | null;
  stats: ActivityStats | null;
  isMonitoring: boolean;
  isSessionActive: boolean;

  // Actions
  startMonitoring: () => Promise<void>;
  stopMonitoring: () => Promise<void>;
  startSession: () => Promise<void>;
  endSession: () => Promise<ActivityStats | null>;

  // Helpers
  formatIdleTime: (seconds: number) => string;
}

const initialState: ActivityState = {
  isIdle: false,
  idleDuration: 0,
  lastActivityTime: new Date(),
  activeWindow: null,
  sessionActive: false,
};

const initialStats: ActivityStats = {
  totalTime: 0,
  activeTime: 0,
  idleTime: 0,
  idleEvents: 0,
  focusScore: 100,
  longestActiveStreak: 0,
  longestIdleStreak: 0,
};

export function useActivity(options: UseActivityOptions = {}): UseActivityReturn {
  const { autoStart = false, idleThreshold = 120 } = options;

  const [state, setState] = useState<ActivityState | null>(null);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);

  // Track cleanup functions
  const cleanupRef = useRef<(() => void)[]>([]);

  // Initialize and set up listeners
  useEffect(() => {
    if (!window.electronAPI?.activity) {
      console.warn('Activity API not available');
      return;
    }

    // Set up activity update listener
    const cleanupUpdate = window.electronAPI.activity.onActivityUpdate(newState => {
      setState(newState);
    });
    cleanupRef.current.push(cleanupUpdate);

    // Set up activity event listener
    const cleanupEvent = window.electronAPI.activity.onActivityEvent(event => {
      console.log('Activity event:', event);
    });
    cleanupRef.current.push(cleanupEvent);

    // Set up idle detected listener
    const cleanupIdle = window.electronAPI.activity.onIdleDetected(data => {
      console.log('Idle detected:', data.duration, 'seconds');
    });
    cleanupRef.current.push(cleanupIdle);

    // Set up activity resumed listener
    const cleanupResumed = window.electronAPI.activity.onActivityResumed(() => {
      console.log('Activity resumed');
    });
    cleanupRef.current.push(cleanupResumed);

    // Update config with custom idle threshold
    window.electronAPI.activity.updateConfig({ idleThreshold });

    // Auto-start monitoring if requested
    if (autoStart) {
      startMonitoring();
    }

    // Get initial state
    window.electronAPI.activity.getState().then(setState);

    // Cleanup on unmount
    return () => {
      cleanupRef.current.forEach(cleanup => cleanup());
      cleanupRef.current = [];
    };
  }, [autoStart, idleThreshold]);

  // Poll for stats updates when session is active
  useEffect(() => {
    if (!isSessionActive || !window.electronAPI?.activity) {
      return;
    }

    const interval = setInterval(async () => {
      const currentStats = await window.electronAPI.activity.getStats();
      setStats(currentStats);
    }, 1000);

    return () => clearInterval(interval);
  }, [isSessionActive]);

  const startMonitoring = useCallback(async () => {
    if (!window.electronAPI?.activity) return;

    await window.electronAPI.activity.startMonitoring();
    setIsMonitoring(true);
  }, []);

  const stopMonitoring = useCallback(async () => {
    if (!window.electronAPI?.activity) return;

    await window.electronAPI.activity.stopMonitoring();
    setIsMonitoring(false);
  }, []);

  const startSession = useCallback(async () => {
    if (!window.electronAPI?.activity) return;

    await window.electronAPI.activity.startSession();
    setIsSessionActive(true);
    setStats(initialStats);
  }, []);

  const endSession = useCallback(async () => {
    if (!window.electronAPI?.activity) return null;

    const finalStats = await window.electronAPI.activity.endSession();
    setIsSessionActive(false);
    setStats(finalStats);
    return finalStats;
  }, []);

  const formatIdleTime = useCallback((seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }, []);

  return {
    state,
    stats,
    isMonitoring,
    isSessionActive,
    startMonitoring,
    stopMonitoring,
    startSession,
    endSession,
    formatIdleTime,
  };
}
