/**
 * Nudge Toast Component
 * Non-intrusive notification for gentle/moderate nudges
 */

import { useEffect, useState } from 'react';
import type { Nudge } from '../../shared/types/nudge';

interface NudgeToastProps {
  nudge: Nudge | null;
  onDismiss: () => void;
  autoDismissMs?: number;
}

export function NudgeToast({ nudge, onDismiss, autoDismissMs = 10000 }: NudgeToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (nudge) {
      setIsVisible(true);
      setProgress(100);

      // Auto-dismiss timer
      const dismissTimer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300);
      }, autoDismissMs);

      // Progress bar animation
      const startTime = Date.now();
      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 - (elapsed / autoDismissMs) * 100);
        setProgress(remaining);
      }, 50);

      return () => {
        clearTimeout(dismissTimer);
        clearInterval(progressInterval);
      };
    }
  }, [nudge, autoDismissMs, onDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  if (!nudge) {
    return null;
  }

  const typeColors: Record<string, string> = {
    gentle: '#4ade80',
    moderate: '#fbbf24',
    urgent: '#ef4444',
    motivational: '#8b5cf6',
    streak_reminder: '#f97316',
  };

  const borderColor = typeColors[nudge.type] || typeColors.moderate;

  return (
    <div className={`nudge-toast ${isVisible ? 'visible' : ''}`}>
      <div className="toast-content" style={{ borderLeftColor: borderColor }}>
        <div className="toast-header">
          <span className="toast-title">{nudge.title}</span>
          <button className="toast-close" onClick={handleDismiss} aria-label="Dismiss">
            ×
          </button>
        </div>

        <p className="toast-message">{nudge.message}</p>

        <div className="toast-progress">
          <div
            className="toast-progress-bar"
            style={{
              width: `${progress}%`,
              backgroundColor: borderColor,
            }}
          />
        </div>
      </div>

      <style>{`
        .nudge-toast {
          position: fixed;
          top: var(--spacing-lg);
          right: var(--spacing-lg);
          z-index: 1000;
          transform: translateX(120%);
          transition: transform 0.3s ease;
        }

        .nudge-toast.visible {
          transform: translateX(0);
        }

        .toast-content {
          background: var(--color-bg-card);
          border-radius: var(--radius-md);
          padding: var(--spacing-md);
          min-width: 300px;
          max-width: 400px;
          border-left: 4px solid;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }

        .toast-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-sm);
        }

        .toast-title {
          font-weight: 600;
          font-size: var(--font-size-base);
        }

        .toast-close {
          background: none;
          border: none;
          color: var(--color-text-secondary);
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0;
          line-height: 1;
        }

        .toast-close:hover {
          color: var(--color-text-primary);
        }

        .toast-message {
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
          margin: 0 0 var(--spacing-sm) 0;
          line-height: 1.5;
        }

        .toast-progress {
          height: 3px;
          background: var(--color-bg-secondary);
          border-radius: 2px;
          overflow: hidden;
        }

        .toast-progress-bar {
          height: 100%;
          transition: width 0.05s linear;
        }
      `}</style>
    </div>
  );
}
