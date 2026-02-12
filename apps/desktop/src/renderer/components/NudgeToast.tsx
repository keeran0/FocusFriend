/**
 * Nudge Toast Component
 * Slide-in notification for gentle/moderate nudges
 */

import { useEffect, useState } from 'react';

interface NudgeToastProps {
  nudge: {
    id: string;
    title: string;
    message: string;
    level: number;
  };
  onDismiss: () => void;
  duration?: number;
}

export function NudgeToast({ nudge, onDismiss, duration = 10000 }: NudgeToastProps) {
  const [progress, setProgress] = useState(100);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        handleDismiss();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [duration]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(onDismiss, 300);
  };

  const borderColor =
    nudge.level === 1
      ? 'var(--color-success)'
      : nudge.level === 2
        ? 'var(--color-accent)'
        : '#ef4444';

  return (
    <div className={`nudge-toast ${isExiting ? 'exiting' : ''}`}>
      <div className="toast-border" style={{ borderLeftColor: borderColor }} />

      <div className="toast-content">
        <div className="toast-header">
          <span className="toast-title">{nudge.title}</span>
          <button className="toast-close" onClick={handleDismiss}>
            ✕
          </button>
        </div>
        <p className="toast-message">{nudge.message}</p>
      </div>

      <div className="toast-progress">
        <div
          className="toast-progress-bar"
          style={{
            width: `${progress}%`,
            backgroundColor: borderColor,
          }}
        />
      </div>

      <style>{`
        .nudge-toast {
          position: fixed;
          top: 20px;
          right: 20px;
          width: 350px;
          background: var(--color-bg-card);
          border-radius: var(--radius-md);
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
          overflow: hidden;
          z-index: 9998;
          animation: slideIn 0.3s ease;
        }

        .nudge-toast.exiting {
          animation: slideOut 0.3s ease forwards;
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }

        .toast-border {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          border-left: 4px solid;
        }

        .toast-content {
          padding: var(--spacing-md);
          padding-left: calc(var(--spacing-md) + 4px);
        }

        .toast-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--spacing-xs);
        }

        .toast-title {
          font-weight: 600;
          font-size: var(--font-size-base);
        }

        .toast-close {
          background: none;
          border: none;
          color: var(--color-text-secondary);
          cursor: pointer;
          padding: 0;
          font-size: var(--font-size-sm);
          line-height: 1;
        }

        .toast-close:hover {
          color: var(--color-text-primary);
        }

        .toast-message {
          margin: 0;
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          line-height: 1.5;
        }

        .toast-progress {
          height: 3px;
          background: var(--color-bg-secondary);
        }

        .toast-progress-bar {
          height: 100%;
          transition: width 0.05s linear;
        }
      `}</style>
    </div>
  );
}
