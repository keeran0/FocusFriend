/**
 * Nudge Toast - Vapor Dusk Edition
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

  // Vapor Dusk color scheme based on level
  const getColors = () => {
    switch (nudge.level) {
      case 1:
        return {
          gradient: 'linear-gradient(135deg, #6ee7b7 0%, #34d399 100%)',
          glow: 'rgba(110, 231, 183, 0.3)',
          icon: '🌱',
        };
      case 2:
        return {
          gradient: 'linear-gradient(135deg, #ff6b6b 0%, #ffa07a 100%)',
          glow: 'rgba(255, 107, 107, 0.3)',
          icon: '⚡',
        };
      case 3:
      default:
        return {
          gradient: 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)',
          glow: 'rgba(248, 113, 113, 0.4)',
          icon: '🔥',
        };
    }
  };

  const colors = getColors();

  return (
    <div className={`nudge-toast ${isExiting ? 'exiting' : ''}`}>
      {/* Accent bar */}
      <div className="toast-accent" style={{ background: colors.gradient }} />

      <div className="toast-content">
        <div className="toast-icon" style={{ background: colors.gradient }}>
          {colors.icon}
        </div>

        <div className="toast-body">
          <div className="toast-header">
            <span className="toast-title">{nudge.title}</span>
            <button className="toast-close" onClick={handleDismiss} aria-label="Dismiss">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M12 4L4 12M4 4l8 8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
          <p className="toast-message">{nudge.message}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="toast-progress">
        <div
          className="toast-progress-fill"
          style={{
            width: `${progress}%`,
            background: colors.gradient,
          }}
        />
      </div>

      <style>{`
        .nudge-toast {
          position: fixed;
          top: 20px;
          right: 20px;
          width: 380px;
          background: linear-gradient(180deg, 
            var(--dusk-surface, #1a1a25) 0%, 
            var(--dusk-deep, #12121a) 100%
          );
          border: 1px solid var(--dusk-border, #2d2d3d);
          border-radius: 16px;
          overflow: hidden;
          z-index: 9998;
          animation: toastSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 
            0 20px 50px rgba(0, 0, 0, 0.4),
            0 0 0 1px rgba(255, 255, 255, 0.05) inset;
        }

        .nudge-toast.exiting {
          animation: toastSlideOut 0.3s ease forwards;
        }

        @keyframes toastSlideIn {
          from {
            transform: translateX(120%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes toastSlideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(120%);
            opacity: 0;
          }
        }

        .toast-accent {
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
        }

        .toast-content {
          display: flex;
          gap: 14px;
          padding: 16px 16px 16px 20px;
        }

        .toast-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          font-size: 1.25rem;
          flex-shrink: 0;
        }

        .toast-body {
          flex: 1;
          min-width: 0;
        }

        .toast-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 6px;
        }

        .toast-title {
          font-family: var(--font-display, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif);
          font-weight: 600;
          font-size: 0.9375rem;
          color: var(--text-bright, #fafafa);
        }

        .toast-close {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          color: var(--text-muted, #71717a);
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.2s ease;
          margin: -4px -4px 0 0;
        }

        .toast-close:hover {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-primary, #e4e4e7);
        }

        .toast-message {
          margin: 0;
          font-size: 0.8125rem;
          color: var(--text-secondary, #a1a1aa);
          line-height: 1.5;
        }

        .toast-progress {
          height: 3px;
          background: var(--dusk-elevated, #242432);
        }

        .toast-progress-fill {
          height: 100%;
          transition: width 0.05s linear;
          border-radius: 0 2px 2px 0;
        }

        @media (max-width: 480px) {
          .nudge-toast {
            left: 16px;
            right: 16px;
            width: auto;
          }
        }
      `}</style>
    </div>
  );
}
