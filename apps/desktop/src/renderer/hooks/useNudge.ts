/**
 * React hook for nudge system
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Nudge, NudgeConfig, NudgeEvent } from '../../shared/types/nudge';

interface UseNudgeReturn {
  // State
  currentNudge: NudgeEvent | null;
  nudgeHistory: Nudge[];
  showOverlay: boolean;

  // Actions
  acknowledgeNudge: (nudgeId: string) => Promise<void>;
  dismissNudge: () => void;
  updateConfig: (config: Partial<NudgeConfig>) => Promise<void>;
  triggerTestNudge: (type: string) => Promise<void>;
}

export function useNudge(): UseNudgeReturn {
  const [currentNudge, setCurrentNudge] = useState<NudgeEvent | null>(null);
  const [nudgeHistory, setNudgeHistory] = useState<Nudge[]>([]);
  const [showOverlay, setShowOverlay] = useState(false);

  const cleanupRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    if (!window.electronAPI?.nudge) {
      console.warn('Nudge API not available');
      return;
    }

    // Listen for nudges
    const cleanupNudge = window.electronAPI.nudge.onNudgeReceived(event => {
      setCurrentNudge(event);
      setShowOverlay(event.showOverlay);
      setNudgeHistory(prev => [...prev, event.nudge]);

      // Play sound if enabled
      if (event.playSound) {
        playNudgeSound(event.nudge.type);
      }
    });
    cleanupRef.current.push(cleanupNudge);

    // Listen for acknowledgments
    const cleanupAck = window.electronAPI.nudge.onNudgeAcknowledged(nudge => {
      setNudgeHistory(prev =>
        prev.map(n => (n.id === nudge.id ? { ...n, acknowledged: true } : n))
      );
    });
    cleanupRef.current.push(cleanupAck);

    // Load initial history
    window.electronAPI.nudge.getHistory().then(setNudgeHistory);

    return () => {
      cleanupRef.current.forEach(cleanup => cleanup());
      cleanupRef.current = [];
    };
  }, []);

  const acknowledgeNudge = useCallback(async (nudgeId: string) => {
    if (!window.electronAPI?.nudge) return;

    await window.electronAPI.nudge.acknowledge(nudgeId);
    setCurrentNudge(null);
    setShowOverlay(false);
  }, []);

  const dismissNudge = useCallback(() => {
    if (currentNudge) {
      acknowledgeNudge(currentNudge.nudge.id);
    }
  }, [currentNudge, acknowledgeNudge]);

  const updateConfig = useCallback(async (config: Partial<NudgeConfig>) => {
    if (!window.electronAPI?.nudge) return;
    await window.electronAPI.nudge.updateConfig(config);
  }, []);

  const triggerTestNudge = useCallback(async (type: string) => {
    if (!window.electronAPI?.nudge) return;
    await window.electronAPI.nudge.triggerTest(type);
  }, []);

  return {
    currentNudge,
    nudgeHistory,
    showOverlay,
    acknowledgeNudge,
    dismissNudge,
    updateConfig,
    triggerTestNudge,
  };
}

/**
 * Play appropriate sound for nudge type
 */
function playNudgeSound(type: string): void {
  // Create audio context for sound
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Different sounds for different types
    switch (type) {
      case 'gentle':
        oscillator.frequency.value = 440; // A4
        gainNode.gain.value = 0.1;
        break;
      case 'moderate':
        oscillator.frequency.value = 523; // C5
        gainNode.gain.value = 0.2;
        break;
      case 'urgent':
        oscillator.frequency.value = 659; // E5
        gainNode.gain.value = 0.3;
        break;
      default:
        oscillator.frequency.value = 440;
        gainNode.gain.value = 0.15;
    }

    oscillator.type = 'sine';
    oscillator.start();

    // Fade out
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (error) {
    console.warn('Could not play nudge sound:', error);
  }
}
