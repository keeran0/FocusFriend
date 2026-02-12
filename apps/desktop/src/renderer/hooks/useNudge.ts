/**
 * React hook for nudge system
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// Inline type definitions
interface Nudge {
  id: string;
  level: number;
  stage: number;
  title: string;
  message: string;
  timestamp: Date;
  notification: boolean;
  sound: boolean;
  overlay: boolean;
  autoPause: boolean;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  sessionId?: string;
}

interface NudgeEvent {
  nudge: Nudge;
  showOverlay: boolean;
  playSound: boolean;
  autoPause: boolean;
}

interface NudgeConfig {
  enabled: boolean;
  level: number;
  soundEnabled: boolean;
  idleThreshold: number;
  quietHoursEnabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

interface UseNudgeReturn {
  currentNudge: Nudge | null;
  nudgeHistory: Nudge[];
  showOverlay: boolean;
  acknowledgeNudge: (nudgeId: string) => Promise<void>;
  updateConfig: (config: Partial<NudgeConfig>) => Promise<void>;
  dismissOverlay: () => void;
}

export function useNudge(): UseNudgeReturn {
  const [currentNudge, setCurrentNudge] = useState<Nudge | null>(null);
  const [nudgeHistory, setNudgeHistory] = useState<Nudge[]>([]);
  const [showOverlay, setShowOverlay] = useState(false);

  const cleanupRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    if (!window.electronAPI?.nudge) {
      console.warn('Nudge API not available');
      return;
    }

    // Listen for nudge events
    const cleanupNudge = window.electronAPI.nudge.onNudgeReceived((event: NudgeEvent) => {
      console.log('[useNudge] Nudge received:', event.nudge.title);
      setCurrentNudge(event.nudge);
      setNudgeHistory((prev: Nudge[]) => [...prev, event.nudge]);

      if (event.showOverlay) {
        setShowOverlay(true);
      }

      if (event.playSound) {
        playNudgeSound(event.nudge.level);
      }
    });
    cleanupRef.current.push(cleanupNudge);

    // Listen for acknowledgments
    const cleanupAck = window.electronAPI.nudge.onNudgeAcknowledged((nudge: Nudge) => {
      setNudgeHistory((prev: Nudge[]) =>
        prev.map(n => (n.id === nudge.id ? { ...n, acknowledged: true } : n))
      );
    });
    cleanupRef.current.push(cleanupAck);

    return () => {
      cleanupRef.current.forEach(cleanup => cleanup());
      cleanupRef.current = [];
    };
  }, []);

  const acknowledgeNudge = useCallback(async (nudgeId: string) => {
    if (!window.electronAPI?.nudge) return;
    await window.electronAPI.nudge.acknowledge(nudgeId);
    setShowOverlay(false);
    setCurrentNudge(null);
  }, []);

  const updateConfig = useCallback(async (config: Partial<NudgeConfig>) => {
    if (!window.electronAPI?.nudge) return;
    await window.electronAPI.nudge.updateConfig(config);
  }, []);

  const dismissOverlay = useCallback(() => {
    setShowOverlay(false);
    if (currentNudge) {
      acknowledgeNudge(currentNudge.id);
    }
  }, [currentNudge, acknowledgeNudge]);

  return {
    currentNudge,
    nudgeHistory,
    showOverlay,
    acknowledgeNudge,
    updateConfig,
    dismissOverlay,
  };
}

// Play a sound based on nudge level
function playNudgeSound(level: number): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Different tones for different levels
    const frequencies: Record<number, number> = {
      1: 440, // A4 - gentle
      2: 523, // C5 - moderate
      3: 659, // E5 - urgent
    };

    oscillator.frequency.value = frequencies[level] || 440;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (error) {
    console.warn('Could not play nudge sound:', error);
  }
}
