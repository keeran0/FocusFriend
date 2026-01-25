/**
 * Nudge Overlay Component
 * Full-screen overlay for urgent nudges
 */

import { useEffect, useState } from 'react';
import type { NudgeEvent } from '../../shared/types/nudge';

interface NudgeOverlayProps {
  nudgeEvent: NudgeEvent | null;
  onDismiss: () => void;
  onEndSession: () => void;
  onTakeBreak: () => void;
}

export function NudgeOverlay({
  nudgeEvent,
  onDismiss,
  onEndSession,
  onTakeBreak,
}: NudgeOverlayProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (nudgeEvent?.showOverlay) {
      setIsVisible(true);
    }
  }, [nudgeEvent]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300); // Wait for animation
  };

  if (!nudgeEvent || !isVisible) {
    return null;
  }

  const { nudge } = nudgeEvent;

  return (
    <div className={`nudge-overlay ${isVisible ? 'visible' : ''}`}>
      <div className="nudge-modal">
        <div className="nudge-icon">{nudge.type === 'urgent' ? '🚨' : '⏰'}</div>

        <h2 className="nudge-title">{nudge.title}</h2>
        <p className="nudge-message">{nudge.message}</p>

        <div className="nudge-actions">
          <button className="btn btn-primary" onClick={handleDismiss}>
            🎯 Back to Work
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => {
              handleDismiss();
              onTakeBreak();
            }}
          >
            ☕ Take 5-min Break
          </button>

          <button
            className="btn btn-danger"
            onClick={() => {
              handleDismiss();
              onEndSession();
            }}
          >
            ⏹ End Session
          </button>
        </div>

        <p className="nudge-hint">
          Press <kbd>Esc</kbd> or <kbd>Space</kbd> to dismiss
        </p>
      </div>

      <style>{`
        .nudge-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          opacity: 0;
          transition: opacity 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .nudge-overlay.visible {
          opacity: 1;
        }

        .nudge-modal {
          background: var(--color-bg-card);
          border-radius: var(--radius-lg);
          padding: var(--spacing-xl);
          max-width: 500px;
          width: 90%;
          text-align: center;
          border: 2px solid var(--color-accent);
          box-shadow: 0 0 60px rgba(233, 69, 96, 0.3);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 60px rgba(233, 69, 96, 0.3);
          }
          50% {
            box-shadow: 0 0 80px rgba(233, 69, 96, 0.5);
          }
        }

        .nudge-icon {
          font-size: 4rem;
          margin-bottom: var(--spacing-md);
          animation: bounce 1s infinite;
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .nudge-title {
          font-size: var(--font-size-xl);
          margin-bottom: var(--spacing-sm);
          color: var(--color-text-primary);
        }

        .nudge-message {
          font-size: var(--font-size-base);
          color: var(--color-text-secondary);
          margin-bottom: var(--spacing-lg);
          line-height: 1.6;
        }

        .nudge-actions {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .nudge-actions .btn {
          width: 100%;
          padding: var(--spacing-md);
          font-size: var(--font-size-base);
        }

        .nudge-hint {
          margin-top: var(--spacing-lg);
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .nudge-hint kbd {
          background: var(--color-bg-secondary);
          padding: 2px 6px;
          border-radius: var(--radius-sm);
          font-family: monospace;
        }
      `}</style>
    </div>
  );
}
