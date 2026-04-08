/**
 * AchievementBadge - Individual Achievement Display
 * Tutorial 11: Gamification System
 *
 * Location: apps/desktop/src/renderer/components/gamification/AchievementBadge.tsx
 *
 * Displays a single achievement badge with unlock state, rarity styling,
 * and optional animation for newly unlocked achievements.
 */

import { useState } from 'react';
import { RARITY_COLORS, type Achievement, type AchievementRarity } from './gamificationData';

// ============================================
// TYPES
// ============================================

interface AchievementBadgeProps {
  /** Achievement data */
  achievement: Achievement & { unlocked: boolean };
  /** Display size */
  size?: 'small' | 'medium' | 'large';
  /** Show as newly unlocked (with animation) */
  isNew?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Custom class name */
  className?: string;
}

// ============================================
// HELPERS
// ============================================

const getRarityLabel = (rarity: AchievementRarity): string => {
  return rarity.charAt(0).toUpperCase() + rarity.slice(1);
};

// ============================================
// COMPONENT
// ============================================

export function AchievementBadge({
  achievement,
  size = 'medium',
  isNew = false,
  onClick,
  className = '',
}: AchievementBadgeProps) {
  const [isHovered, setIsHovered] = useState(false);

  const colors = RARITY_COLORS[achievement.rarity];
  const isLocked = !achievement.unlocked;
  const isSecret = achievement.isSecret && isLocked;

  return (
    <div
      className={`achievement-badge size-${size} ${isLocked ? 'locked' : 'unlocked'} ${isNew ? 'is-new' : ''} ${className}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={
        {
          '--rarity-bg': colors.bg,
          '--rarity-border': colors.border,
          '--rarity-text': colors.text,
        } as React.CSSProperties
      }
    >
      {/* Glow effect for unlocked */}
      {!isLocked && <div className="ab-glow" style={{ background: colors.text }} />}

      {/* New badge indicator */}
      {isNew && <div className="ab-new-badge">NEW</div>}

      {/* Icon */}
      <div className="ab-icon-wrap">
        <span className="ab-icon">{isSecret ? '❓' : achievement.icon}</span>
        {isLocked && <div className="ab-lock">🔒</div>}
      </div>

      {/* Info */}
      <div className="ab-info">
        <h4 className="ab-name">{isSecret ? '???' : achievement.name}</h4>
        <p className="ab-description">
          {isSecret ? 'Complete hidden requirements to unlock' : achievement.description}
        </p>

        {/* Rarity & XP */}
        <div className="ab-meta">
          <span className="ab-rarity" style={{ color: colors.text }}>
            {getRarityLabel(achievement.rarity)}
          </span>
          <span className="ab-xp">+{achievement.xpReward} XP</span>
        </div>
      </div>

      {/* Tooltip on hover for small size */}
      {size === 'small' && isHovered && (
        <div className="ab-tooltip">
          <div className="ab-tooltip-name">{isSecret ? '???' : achievement.name}</div>
          <div className="ab-tooltip-desc">
            {isSecret ? 'Hidden achievement' : achievement.description}
          </div>
        </div>
      )}

      <style>{`
        .achievement-badge {
          position: relative;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: var(--rarity-bg);
          border: 1px solid var(--rarity-border);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          overflow: hidden;
        }

        .achievement-badge:hover {
          transform: translateY(-2px);
          border-color: var(--rarity-text);
        }

        .achievement-badge.locked {
          opacity: 0.6;
          filter: grayscale(0.5);
        }

        .achievement-badge.locked:hover {
          opacity: 0.8;
          filter: grayscale(0.3);
        }

        /* Sizes */
        .achievement-badge.size-small {
          padding: 8px;
          gap: 0;
        }

        .achievement-badge.size-small .ab-info {
          display: none;
        }

        .achievement-badge.size-small .ab-icon-wrap {
          width: 40px;
          height: 40px;
        }

        .achievement-badge.size-small .ab-icon {
          font-size: 1.25rem;
        }

        .achievement-badge.size-large {
          padding: 20px;
          gap: 16px;
        }

        .achievement-badge.size-large .ab-icon-wrap {
          width: 72px;
          height: 72px;
        }

        .achievement-badge.size-large .ab-icon {
          font-size: 2.5rem;
        }

        .achievement-badge.size-large .ab-name {
          font-size: 1.1rem;
        }

        .achievement-badge.size-large .ab-description {
          font-size: 0.9rem;
        }

        /* Glow */
        .ab-glow {
          position: absolute;
          top: 50%;
          left: 20%;
          width: 60%;
          height: 60%;
          filter: blur(30px);
          opacity: 0.15;
          pointer-events: none;
          transform: translateY(-50%);
        }

        /* New Badge */
        .ab-new-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          padding: 2px 8px;
          background: linear-gradient(135deg, #ffd93d 0%, #ff6b6b 100%);
          border-radius: 6px;
          font-size: 0.6rem;
          font-weight: 800;
          color: #0a0a0f;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          animation: newPulse 2s ease infinite;
        }

        @keyframes newPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        /* Is New Animation */
        .achievement-badge.is-new {
          animation: achievementUnlock 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes achievementUnlock {
          0% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }

        /* Icon */
        .ab-icon-wrap {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          background: rgba(20, 20, 25, 0.6);
          border: 1px solid var(--rarity-border);
          border-radius: 12px;
          flex-shrink: 0;
        }

        .ab-icon {
          font-size: 1.75rem;
          transition: transform 0.2s ease;
        }

        .achievement-badge:hover .ab-icon {
          transform: scale(1.1);
        }

        .ab-lock {
          position: absolute;
          bottom: -4px;
          right: -4px;
          font-size: 0.85rem;
          background: #1a1a25;
          border-radius: 50%;
          padding: 2px;
        }

        /* Info */
        .ab-info {
          flex: 1;
          min-width: 0;
        }

        .ab-name {
          margin: 0 0 4px;
          font-size: 0.95rem;
          font-weight: 700;
          color: #fafafa;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .ab-description {
          margin: 0 0 8px;
          font-size: 0.8rem;
          color: #a1a1aa;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .ab-meta {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .ab-rarity {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .ab-xp {
          font-size: 0.75rem;
          font-weight: 600;
          color: #6ee7b7;
        }

        /* Tooltip */
        .ab-tooltip {
          position: absolute;
          bottom: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
          width: 200px;
          padding: 12px;
          background: #1e1e2a;
          border: 1px solid #2a2a3a;
          border-radius: 10px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
          z-index: 100;
          pointer-events: none;
          animation: tooltipIn 0.2s ease;
        }

        @keyframes tooltipIn {
          from { opacity: 0; transform: translateX(-50%) translateY(4px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        .ab-tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 6px solid transparent;
          border-top-color: #2a2a3a;
        }

        .ab-tooltip-name {
          font-size: 0.85rem;
          font-weight: 700;
          color: #fafafa;
          margin-bottom: 4px;
        }

        .ab-tooltip-desc {
          font-size: 0.75rem;
          color: #a1a1aa;
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
}

export default AchievementBadge;
