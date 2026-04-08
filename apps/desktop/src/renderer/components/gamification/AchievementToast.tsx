/**
 * AchievementToast - Achievement Unlocked Notification
 * Tutorial 11: Gamification System
 *
 * Location: apps/desktop/src/renderer/components/gamification/AchievementToast.tsx
 *
 * Slide-in toast notification when an achievement is unlocked.
 */

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { RARITY_COLORS, type Achievement } from './gamificationData';

// ============================================
// TYPES
// ============================================

interface AchievementToastProps {
  /** Achievement that was unlocked */
  achievement: Achievement;
  /** Callback when toast closes */
  onClose: () => void;
  /** Auto-close delay in ms */
  autoCloseDelay?: number;
  /** Position on screen */
  position?: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center';
}

// ============================================
// COMPONENT
// ============================================

export function AchievementToast({
  achievement,
  onClose,
  autoCloseDelay = 5000,
  position = 'top-right',
}: AchievementToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const colors = RARITY_COLORS[achievement.rarity];

  // Entry animation
  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  // Auto-close
  useEffect(() => {
    if (autoCloseDelay > 0) {
      const timer = setTimeout(handleClose, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [autoCloseDelay]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(onClose, 300);
  };

  const toast = (
    <div
      className={`achievement-toast position-${position} ${isVisible ? 'visible' : ''} ${isLeaving ? 'leaving' : ''}`}
      onClick={handleClose}
      style={
        {
          '--rarity-bg': colors.bg,
          '--rarity-border': colors.border,
          '--rarity-text': colors.text,
        } as React.CSSProperties
      }
    >
      {/* Accent bar */}
      <div className="at-accent" style={{ background: colors.text }} />

      {/* Icon */}
      <div className="at-icon-wrap">
        <span className="at-icon">{achievement.icon}</span>
        <div className="at-sparkle">✨</div>
      </div>

      {/* Content */}
      <div className="at-content">
        <div className="at-header">
          <span className="at-label">Achievement Unlocked!</span>
          <span className="at-xp">+{achievement.xpReward} XP</span>
        </div>
        <h4 className="at-name">{achievement.name}</h4>
        <p className="at-description">{achievement.description}</p>
        <span className="at-rarity" style={{ color: colors.text }}>
          {achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)}
        </span>
      </div>

      {/* Close button */}
      <button className="at-close" onClick={handleClose}>
        ✕
      </button>

      {/* Progress bar (auto-close indicator) */}
      {autoCloseDelay > 0 && (
        <div className="at-progress">
          <div
            className="at-progress-fill"
            style={{
              animationDuration: `${autoCloseDelay}ms`,
              background: colors.text,
            }}
          />
        </div>
      )}

      <style>{`
        .achievement-toast {
          position: fixed;
          z-index: 99998;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          width: 360px;
          padding: 16px 16px 16px 20px;
          background: linear-gradient(135deg, #1e1e2a 0%, #141419 100%);
          border: 1px solid var(--rarity-border);
          border-radius: 16px;
          box-shadow: 
            0 0 40px var(--rarity-bg),
            0 20px 40px rgba(0, 0, 0, 0.4);
          cursor: pointer;
          overflow: hidden;
          transform: translateX(120%);
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Positions */
        .achievement-toast.position-top-right {
          top: 24px;
          right: 24px;
        }

        .achievement-toast.position-top-center {
          top: 24px;
          left: 50%;
          transform: translateX(-50%) translateY(-120%);
        }

        .achievement-toast.position-bottom-right {
          bottom: 24px;
          right: 24px;
        }

        .achievement-toast.position-bottom-center {
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%) translateY(120%);
        }

        /* Visible states */
        .achievement-toast.visible {
          transform: translateX(0);
        }

        .achievement-toast.position-top-center.visible,
        .achievement-toast.position-bottom-center.visible {
          transform: translateX(-50%) translateY(0);
        }

        /* Leaving states */
        .achievement-toast.leaving {
          transform: translateX(120%);
          opacity: 0;
        }

        .achievement-toast.position-top-center.leaving {
          transform: translateX(-50%) translateY(-120%);
          opacity: 0;
        }

        .achievement-toast.position-bottom-center.leaving {
          transform: translateX(-50%) translateY(120%);
          opacity: 0;
        }

        /* Accent bar */
        .at-accent {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
        }

        /* Icon */
        .at-icon-wrap {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          background: var(--rarity-bg);
          border: 1px solid var(--rarity-border);
          border-radius: 12px;
          flex-shrink: 0;
        }

        .at-icon {
          font-size: 1.5rem;
          animation: iconPop 0.5s ease 0.3s both;
        }

        @keyframes iconPop {
          0% { transform: scale(0); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }

        .at-sparkle {
          position: absolute;
          top: -8px;
          right: -8px;
          font-size: 1rem;
          animation: sparkle 1s ease infinite;
        }

        @keyframes sparkle {
          0%, 100% { opacity: 1; transform: scale(1) rotate(0deg); }
          50% { opacity: 0.5; transform: scale(0.8) rotate(180deg); }
        }

        /* Content */
        .at-content {
          flex: 1;
          min-width: 0;
        }

        .at-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .at-label {
          font-size: 0.65rem;
          font-weight: 700;
          color: var(--rarity-text);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .at-xp {
          font-size: 0.7rem;
          font-weight: 700;
          color: #6ee7b7;
        }

        .at-name {
          margin: 0 0 4px;
          font-size: 1rem;
          font-weight: 800;
          color: #fafafa;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .at-description {
          margin: 0 0 6px;
          font-size: 0.8rem;
          color: #a1a1aa;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .at-rarity {
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* Close button */
        .at-close {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 24px;
          height: 24px;
          background: transparent;
          border: none;
          color: #52525b;
          font-size: 0.75rem;
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .at-close:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #a1a1aa;
        }

        /* Progress bar */
        .at-progress {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: rgba(255, 255, 255, 0.05);
        }

        .at-progress-fill {
          height: 100%;
          animation: progressShrink linear forwards;
        }

        @keyframes progressShrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );

  return createPortal(toast, document.body);
}

export default AchievementToast;
