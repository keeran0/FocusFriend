/**
 * Nudge Overlay - Vapor Dusk Edition
 * Full-screen overlay for focused mode auto-pause
 */

import { useEffect, useState } from 'react';
import type { Nudge } from '../../shared/types/nudge';

interface NudgeOverlayProps {
  nudge: Nudge;
  onAction: (action: 'resume' | 'end' | 'pause') => void;
}

export function NudgeOverlay({ nudge, onAction }: NudgeOverlayProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [idleTime, setIdleTime] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setIdleTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = (action: 'resume' | 'end' | 'pause') => {
    setIsVisible(false);
    setTimeout(() => onAction(action), 250);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  return (
    <div className={`nudge-overlay ${isVisible ? 'visible' : ''}`}>
      <div className="overlay-backdrop" />

      {/* Ambient glow effect */}
      <div className="overlay-glow" />

      <div className="overlay-content">
        <div className="overlay-icon">{nudge.stage === 'auto-pause' ? '⏸' : '👋'}</div>

        <h2 className="overlay-title">{nudge.title}</h2>
        <p className="overlay-message">{nudge.message}</p>

        {idleTime > 0 && (
          <div className="idle-indicator">
            <span className="idle-dot" />
            Idle for {formatTime(idleTime)}
          </div>
        )}

        <div className="overlay-actions">
          <button className="overlay-btn primary" onClick={() => handleAction('resume')}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M6 4l10 6-10 6V4z" fill="currentColor" />
            </svg>
            Resume Focus
          </button>

          <button className="overlay-btn secondary" onClick={() => handleAction('end')}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="4" y="4" width="12" height="12" rx="2" fill="currentColor" />
            </svg>
            End Session
          </button>
        </div>

        <p className="overlay-hint">Your session is paused · No focus time is being tracked</p>
      </div>

      <style>{`
        .nudge-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .nudge-overlay.visible {
          opacity: 1;
        }

        .overlay-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(10, 10, 15, 0.95);
          backdrop-filter: blur(20px);
        }

        .overlay-glow {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 600px;
          height: 400px;
          background: radial-gradient(ellipse at center, rgba(255, 107, 107, 0.15) 0%, transparent 70%);
          pointer-events: none;
        }

        .overlay-content {
          position: relative;
          z-index: 1;
          text-align: center;
          padding: 48px 40px;
          max-width: 440px;
          width: 90%;
          background: linear-gradient(180deg, 
            var(--dusk-surface, #1a1a25) 0%, 
            var(--dusk-deep, #12121a) 100%
          );
          border-radius: 24px;
          border: 1px solid var(--dusk-border, #2d2d3d);
          box-shadow: 
            0 25px 80px rgba(0, 0, 0, 0.5),
            0 0 0 1px rgba(255, 255, 255, 0.05) inset;
          transform: translateY(30px);
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .nudge-overlay.visible .overlay-content {
          animation-delay: 0.1s;
        }

        @keyframes slideUp {
          to {
            transform: translateY(0);
          }
        }

        .overlay-icon {
          font-size: 4rem;
          margin-bottom: 24px;
          animation: pulse 2s ease-in-out infinite;
          filter: drop-shadow(0 4px 20px rgba(255, 107, 107, 0.3));
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }

        .overlay-title {
          font-family: var(--font-display, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif);
          font-size: 1.75rem;
          font-weight: 700;
          font-stretch: 105%;
          margin-bottom: 12px;
          color: var(--text-bright, #fafafa);
          letter-spacing: -0.02em;
        }

        .overlay-message {
          font-size: 1rem;
          color: var(--text-secondary, #a1a1aa);
          margin-bottom: 24px;
          line-height: 1.6;
        }

        .idle-indicator {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 10px 20px;
          background: rgba(255, 217, 61, 0.1);
          border: 1px solid rgba(255, 217, 61, 0.2);
          border-radius: 12px;
          color: var(--sun-gold, #ffd93d);
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 32px;
          font-variant-numeric: tabular-nums;
        }

        .idle-dot {
          width: 8px;
          height: 8px;
          background: var(--sun-gold, #ffd93d);
          border-radius: 50%;
          animation: blink 1.5s ease-in-out infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .overlay-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }

        .overlay-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 16px 24px;
          border: none;
          border-radius: 14px;
          font-family: var(--font-body, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif);
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          width: 100%;
        }

        .overlay-btn.primary {
          background: linear-gradient(135deg, #ff6b6b 0%, #ffa07a 50%, #ffd93d 100%);
          color: var(--dusk-void, #0a0a0f);
          box-shadow: 0 8px 25px rgba(255, 107, 107, 0.3);
        }

        .overlay-btn.primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 35px rgba(255, 107, 107, 0.4);
        }

        .overlay-btn.secondary {
          background: var(--dusk-elevated, #242432);
          color: var(--text-primary, #e4e4e7);
          border: 1px solid var(--dusk-border, #2d2d3d);
        }

        .overlay-btn.secondary:hover {
          background: var(--dusk-surface, #1a1a25);
          border-color: var(--text-muted, #71717a);
          transform: translateY(-2px);
        }

        .overlay-hint {
          font-size: 0.75rem;
          color: var(--text-muted, #71717a);
          letter-spacing: 0.02em;
        }
      `}</style>
    </div>
  );
}
