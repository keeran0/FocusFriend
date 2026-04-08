/**
 * PointsPopup - Points Earned Notification
 * Tutorial 11: Gamification System
 *
 * Location: apps/desktop/src/renderer/components/gamification/PointsPopup.tsx
 *
 * Animated popup showing points earned after completing a session.
 * Displays base points, multiplier breakdown, and total with animations.
 */

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { PointsResult, Level } from './gamificationData';

// ============================================
// TYPES
// ============================================

interface PointsPopupProps {
  /** Points result from awardPointsForSession */
  result: PointsResult;
  /** Current level (for theming) */
  level: Level;
  /** Callback when popup closes */
  onClose: () => void;
  /** Auto-close delay in ms (0 = manual close only) */
  autoCloseDelay?: number;
}

// ============================================
// COMPONENT
// ============================================

export function PointsPopup({ result, level, onClose, autoCloseDelay = 4000 }: PointsPopupProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [displayedPoints, setDisplayedPoints] = useState(0);

  // Entry animation
  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  // Animate points counting up
  useEffect(() => {
    if (!isVisible) return;

    const duration = 800;
    const startTime = Date.now();
    const targetPoints = result.totalPoints;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayedPoints(Math.round(targetPoints * eased));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isVisible, result.totalPoints]);

  // Auto-close
  useEffect(() => {
    if (autoCloseDelay > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [autoCloseDelay]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(onClose, 300);
  };

  const popup = (
    <div
      className={`points-popup-overlay ${isVisible ? 'visible' : ''} ${isLeaving ? 'leaving' : ''}`}
      onClick={handleClose}
    >
      <div
        className="points-popup-card"
        onClick={e => e.stopPropagation()}
        style={
          {
            '--level-color': level.color,
            '--level-glow': level.glowColor,
          } as React.CSSProperties
        }
      >
        {/* Header */}
        <div className="pp-header">
          <span className="pp-icon">⚡</span>
          <span className="pp-title">Points Earned!</span>
        </div>

        {/* Main Points Display */}
        <div className="pp-points-display">
          <span className="pp-plus">+</span>
          <span className="pp-points">{displayedPoints}</span>
          <span className="pp-xp">XP</span>
        </div>

        {/* Breakdown */}
        <div className="pp-breakdown">
          <div className="pp-row">
            <span className="pp-row-label">
              <span className="pp-row-icon">⏱️</span>
              Focus Time
            </span>
            <span className="pp-row-value">+{result.basePoints}</span>
          </div>

          {result.bonusPoints > 0 && (
            <div className="pp-row pp-row-bonus">
              <span className="pp-row-label">
                <span className="pp-row-icon">✨</span>
                {result.totalMultiplier.toFixed(2)}x Multiplier
              </span>
              <span className="pp-row-value">+{result.bonusPoints}</span>
            </div>
          )}

          <div className="pp-divider" />

          <div className="pp-row pp-row-total">
            <span className="pp-row-label">Total</span>
            <span className="pp-row-value">+{result.totalPoints} XP</span>
          </div>
        </div>

        {/* New Total */}
        <div className="pp-footer">
          <span className="pp-footer-label">Total XP</span>
          <span className="pp-footer-value">{result.newTotalXP.toLocaleString()}</span>
        </div>

        {/* Close hint */}
        <button className="pp-close" onClick={handleClose}>
          Tap to dismiss
        </button>
      </div>

      <style>{`
        .points-popup-overlay {
          position: fixed;
          inset: 0;
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(10, 10, 15, 0.8);
          backdrop-filter: blur(8px);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .points-popup-overlay.visible {
          opacity: 1;
        }

        .points-popup-overlay.leaving {
          opacity: 0;
        }

        .points-popup-card {
          width: 320px;
          background: linear-gradient(180deg, #1e1e2a 0%, #141419 100%);
          border: 1px solid #2a2a3a;
          border-radius: 20px;
          padding: 24px;
          text-align: center;
          transform: scale(0.9) translateY(20px);
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 
            0 0 60px var(--level-glow),
            0 20px 40px rgba(0, 0, 0, 0.4);
        }

        .visible .points-popup-card {
          transform: scale(1) translateY(0);
        }

        .leaving .points-popup-card {
          transform: scale(0.9) translateY(-20px);
        }

        /* Header */
        .pp-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 20px;
        }

        .pp-icon {
          font-size: 1.5rem;
          animation: pulse 1s ease infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .pp-title {
          font-size: 1rem;
          font-weight: 700;
          color: var(--level-color);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        /* Points Display */
        .pp-points-display {
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 4px;
          margin-bottom: 24px;
        }

        .pp-plus {
          font-size: 2rem;
          font-weight: 300;
          color: var(--level-color);
        }

        .pp-points {
          font-size: 4rem;
          font-weight: 900;
          color: #fafafa;
          letter-spacing: -0.03em;
          text-shadow: 0 0 40px var(--level-glow);
          line-height: 1;
        }

        .pp-xp {
          font-size: 1.25rem;
          font-weight: 700;
          color: #71717a;
          margin-left: 4px;
        }

        /* Breakdown */
        .pp-breakdown {
          background: rgba(20, 20, 25, 0.6);
          border: 1px solid #2a2a3a;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
        }

        .pp-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
        }

        .pp-row-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: #a1a1aa;
        }

        .pp-row-icon {
          font-size: 1rem;
        }

        .pp-row-value {
          font-size: 0.9rem;
          font-weight: 700;
          color: #6ee7b7;
        }

        .pp-row-bonus .pp-row-value {
          color: var(--level-color);
        }

        .pp-divider {
          height: 1px;
          background: #2a2a3a;
          margin: 8px 0;
        }

        .pp-row-total {
          padding-top: 12px;
        }

        .pp-row-total .pp-row-label {
          font-weight: 700;
          color: #e4e4e7;
        }

        .pp-row-total .pp-row-value {
          font-size: 1.1rem;
          color: #fafafa;
        }

        /* Footer */
        .pp-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: var(--level-color)15;
          border: 1px solid var(--level-color)30;
          border-radius: 10px;
          margin-bottom: 16px;
        }

        .pp-footer-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #71717a;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .pp-footer-value {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--level-color);
        }

        /* Close */
        .pp-close {
          background: none;
          border: none;
          color: #52525b;
          font-size: 0.75rem;
          cursor: pointer;
          padding: 8px 16px;
          transition: color 0.2s ease;
        }

        .pp-close:hover {
          color: #a1a1aa;
        }
      `}</style>
    </div>
  );

  return createPortal(popup, document.body);
}

export default PointsPopup;
