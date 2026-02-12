/**
 * Nudge Overlay Component
 * Full-screen overlay for focused mode auto-pause
 * Only shows Resume and End Session options (breaks are automatic)
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

  // Animate in
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Track idle time
  useEffect(() => {
    const interval = setInterval(() => {
      setIdleTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = (action: 'resume' | 'end' | 'pause') => {
    setIsVisible(false);
    setTimeout(() => onAction(action), 200);
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

      <div className="overlay-content">
        <div className="overlay-icon">{nudge.stage === 'auto-pause' ? '⏸️' : '👋'}</div>

        <h2 className="overlay-title">{nudge.title}</h2>
        <p className="overlay-message">{nudge.message}</p>

        {idleTime > 0 && <p className="idle-indicator">Idle for {formatTime(idleTime)}</p>}

        <div className="overlay-actions">
          <button className="overlay-btn primary" onClick={() => handleAction('resume')}>
            <span className="btn-icon">▶️</span>
            Resume Focus
          </button>

          <button className="overlay-btn secondary" onClick={() => handleAction('end')}>
            <span className="btn-icon">⏹️</span>
            End Session
          </button>
        </div>

        <p className="overlay-hint">Your session is paused. No focus time is being tracked.</p>
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
          background: rgba(15, 15, 26, 0.95);
          backdrop-filter: blur(10px);
        }

        .overlay-content {
          position: relative;
          z-index: 1;
          text-align: center;
          padding: var(--spacing-2xl);
          max-width: 480px;
          width: 90%;
          background: var(--color-bg-card);
          border-radius: var(--radius-xl);
          border: 1px solid var(--color-border);
          box-shadow: var(--shadow-lg);
          transform: translateY(20px);
          animation: slideUp 0.3s ease forwards;
        }

        @keyframes slideUp {
          to {
            transform: translateY(0);
          }
        }

        .overlay-icon {
          font-size: 4rem;
          margin-bottom: var(--spacing-lg);
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .overlay-title {
          font-size: var(--font-size-2xl);
          font-weight: 700;
          margin-bottom: var(--spacing-md);
          color: var(--color-text-primary);
        }

        .overlay-message {
          font-size: var(--font-size-base);
          color: var(--color-text-secondary);
          margin-bottom: var(--spacing-lg);
          line-height: 1.6;
        }

        .idle-indicator {
          display: inline-block;
          padding: var(--spacing-xs) var(--spacing-md);
          background: rgba(251, 191, 36, 0.1);
          border: 1px solid rgba(251, 191, 36, 0.3);
          border-radius: var(--radius-lg);
          color: var(--color-warning);
          font-size: var(--font-size-sm);
          font-weight: 500;
          margin-bottom: var(--spacing-xl);
          font-variant-numeric: tabular-nums;
        }

        .overlay-actions {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-lg);
        }

        .overlay-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-md) var(--spacing-xl);
          border: none;
          border-radius: var(--radius-md);
          font-size: var(--font-size-base);
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
          width: 100%;
        }

        .overlay-btn .btn-icon {
          font-size: 1.1rem;
        }

        .overlay-btn.primary {
          background: linear-gradient(135deg, #0078d4 0%, #106ebe 100%);
          color: white;
          box-shadow: 0 4px 14px rgba(0, 120, 212, 0.4);
        }

        .overlay-btn.primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 120, 212, 0.5);
        }

        .overlay-btn.secondary {
          background: var(--color-bg-secondary);
          color: var(--color-text-primary);
          border: 1px solid var(--color-border);
        }

        .overlay-btn.secondary:hover {
          background: var(--color-bg-hover);
          border-color: var(--color-text-secondary);
        }

        .overlay-hint {
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
}
