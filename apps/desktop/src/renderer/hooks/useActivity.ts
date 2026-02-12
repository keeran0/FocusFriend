/**
 * React hook for activity monitoring
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// Inline type definitions to avoid import issues
interface ActivityState {
  isIdle: boolean;
  idleDuration: number;
  lastActivityTime: Date;
  activeWindow: { title: string; appName: string; url?: string } | null;
  sessionActive: boolean;
  isPaused?: boolean;
}

interface ActivityStats {
  totalTime: number;
  activeTime: number;
  idleTime: number;
  idleEvents: number;
  focusScore: number;
  longestActiveStreak: number;
  longestIdleStreak: number;
}

interface UseActivityOptions {
  autoStart?: boolean;
}

interface UseActivityReturn {
  state: ActivityState | null;
  stats: ActivityStats | null;
  isMonitoring: boolean;
  isSessionActive: boolean;
  startMonitoring: () => Promise<void>;
  stopMonitoring: () => Promise<void>;
  startSession: () => Promise<void>;
  endSession: () => Promise<ActivityStats | null>;
  resumeSession: () => Promise<void>;
  formatIdleTime: (seconds: number) => string;
}

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
  const { autoStart = false } = options;

  const [state, setState] = useState<ActivityState | null>(null);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);

  const cleanupRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    if (!window.electronAPI?.activity) {
      console.warn('Activity API not available');
      return;
    }

    // Set up activity update listener
    const cleanupUpdate = window.electronAPI.activity.onActivityUpdate(
      (newState: ActivityState) => {
        setState(newState);
      }
    );
    cleanupRef.current.push(cleanupUpdate);

    // Set up activity event listener
    const cleanupEvent = window.electronAPI.activity.onActivityEvent((event: { type: string }) => {
      if (event.type !== 'activity-update') {
        console.log('[useActivity] Activity event:', event.type);
      }
    });
    cleanupRef.current.push(cleanupEvent);

    // Auto-start monitoring if requested
    if (autoStart) {
      window.electronAPI.activity.startMonitoring().then(() => {
        setIsMonitoring(true);
      });
    }

    // Get initial state
    window.electronAPI.activity.getState().then(setState);

    return () => {
      cleanupRef.current.forEach(cleanup => cleanup());
      cleanupRef.current = [];
    };
  }, [autoStart]);

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

  const resumeSession = useCallback(async () => {
    if (!window.electronAPI?.activity) return;
    await window.electronAPI.activity.resumeSession();
  }, []);

  const formatIdleTime = useCallback((seconds: number): string => {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
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
    resumeSession,
    formatIdleTime,
  };
}
