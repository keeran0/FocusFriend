/**
 * LevelUpModal - Level Up Celebration
 * Tutorial 11: Gamification System
 *
 * Location: apps/desktop/src/renderer/components/gamification/LevelUpModal.tsx
 *
 * Full-screen celebration modal when user reaches a new level.
 * Features confetti animation, level comparison, and new perks.
 */

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Level } from './gamificationData';

// ============================================
// TYPES
// ============================================

interface LevelUpModalProps {
  /** Previous level */
  previousLevel: Level;
  /** New level achieved */
  newLevel: Level;
  /** Callback when modal closes */
  onClose: () => void;
  /** Auto-close delay (0 = manual only) */
  autoCloseDelay?: number;
}

// ============================================
// CONFETTI PARTICLE
// ============================================

interface Particle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
  delay: number;
}

const CONFETTI_COLORS = [
  '#ff6b6b',
  '#ffa07a',
  '#ffd93d',
  '#6ee7b7',
  '#7dd3fc',
  '#b4a0ff',
  '#f472b6',
  '#c084fc',
];

const generateParticles = (count: number): Particle[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: -10 - Math.random() * 20,
    rotation: Math.random() * 360,
    scale: 0.5 + Math.random() * 0.5,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    delay: Math.random() * 0.5,
  }));
};

// ============================================
// COMPONENT
// ============================================

export function LevelUpModal({
  previousLevel,
  newLevel,
  onClose,
  autoCloseDelay = 0,
}: LevelUpModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [particles] = useState(() => generateParticles(50));
  const [showContent, setShowContent] = useState(false);

  // Entry animation sequence
  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
    setTimeout(() => setShowContent(true), 300);
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
    setTimeout(onClose, 400);
  };

  // Calculate multiplier increase
  const multiplierIncrease = (
    (newLevel.streakMultiplierBonus - previousLevel.streakMultiplierBonus) *
    100
  ).toFixed(0);

  const modal = (
    <div
      className={`levelup-modal-overlay ${isVisible ? 'visible' : ''} ${isLeaving ? 'leaving' : ''}`}
      onClick={handleClose}
    >
      {/* Confetti */}
      <div className="lum-confetti">
        {particles.map(p => (
          <div
            key={p.id}
            className="lum-particle"
            style={
              {
                left: `${p.x}%`,
                '--start-y': `${p.y}%`,
                '--rotation': `${p.rotation}deg`,
                '--scale': p.scale,
                '--color': p.color,
                '--delay': `${p.delay}s`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* Modal Card */}
      <div
        className={`lum-card ${showContent ? 'show-content' : ''}`}
        onClick={e => e.stopPropagation()}
        style={
          {
            '--new-color': newLevel.color,
            '--new-glow': newLevel.glowColor,
            '--prev-color': previousLevel.color,
          } as React.CSSProperties
        }
      >
        {/* Radial glow background */}
        <div className="lum-glow-bg" />

        {/* Header */}
        <div className="lum-header">
          <span className="lum-label">LEVEL UP!</span>
        </div>

        {/* Level transition */}
        <div className="lum-levels">
          {/* Previous level */}
          <div className="lum-level lum-level-prev">
            <span className="lum-level-icon">{previousLevel.icon}</span>
            <span className="lum-level-num">Lv.{previousLevel.level}</span>
          </div>

          {/* Arrow */}
          <div className="lum-arrow">
            <svg width="40" height="24" viewBox="0 0 40 24" fill="none">
              <path
                d="M0 12H36M36 12L26 2M36 12L26 22"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* New level */}
          <div className="lum-level lum-level-new">
            <span className="lum-level-icon">{newLevel.icon}</span>
            <span className="lum-level-num">Lv.{newLevel.level}</span>
          </div>
        </div>

        {/* New title */}
        <div className="lum-title-section">
          <h2 className="lum-title">{newLevel.title}</h2>
          <p className="lum-subtitle">{newLevel.name}</p>
        </div>

        {/* Perks unlocked */}
        <div className="lum-perks">
          <h3 className="lum-perks-title">Unlocked</h3>
          <div className="lum-perk-item">
            <span className="lum-perk-icon">⚡</span>
            <span className="lum-perk-text">+{multiplierIncrease}% XP Multiplier Bonus</span>
          </div>
          {newLevel.level === 5 && (
            <div className="lum-perk-item">
              <span className="lum-perk-icon">🎨</span>
              <span className="lum-perk-text">Custom Themes</span>
            </div>
          )}
          {newLevel.level === 10 && (
            <div className="lum-perk-item lum-perk-legendary">
              <span className="lum-perk-icon">🌟</span>
              <span className="lum-perk-text">Maximum Level Achieved!</span>
            </div>
          )}
        </div>

        {/* Continue button */}
        <button className="lum-continue" onClick={handleClose}>
          Continue
        </button>
      </div>

      <style>{`
        .levelup-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(10, 10, 15, 0.9);
          backdrop-filter: blur(12px);
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .levelup-modal-overlay.visible {
          opacity: 1;
        }

        .levelup-modal-overlay.leaving {
          opacity: 0;
        }

        /* Confetti */
        .lum-confetti {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        }

        .lum-particle {
          position: absolute;
          width: 10px;
          height: 10px;
          background: var(--color);
          border-radius: 2px;
          transform: translateY(var(--start-y)) rotate(var(--rotation)) scale(var(--scale));
          animation: confettiFall 3s ease-out var(--delay) forwards;
        }

        @keyframes confettiFall {
          to {
            transform: translateY(120vh) rotate(calc(var(--rotation) + 720deg)) scale(var(--scale));
            opacity: 0;
          }
        }

        /* Card */
        .lum-card {
          position: relative;
          width: 380px;
          background: linear-gradient(180deg, #1e1e2a 0%, #141419 100%);
          border: 1px solid #2a2a3a;
          border-radius: 24px;
          padding: 32px;
          text-align: center;
          transform: scale(0.8);
          transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
        }

        .visible .lum-card {
          transform: scale(1);
        }

        .leaving .lum-card {
          transform: scale(0.9) translateY(20px);
        }

        /* Glow background */
        .lum-glow-bg {
          position: absolute;
          top: -50%;
          left: 50%;
          transform: translateX(-50%);
          width: 200%;
          height: 200%;
          background: radial-gradient(ellipse at center, var(--new-glow) 0%, transparent 50%);
          opacity: 0.3;
          pointer-events: none;
        }

        /* Header */
        .lum-header {
          margin-bottom: 24px;
        }

        .lum-label {
          display: inline-block;
          padding: 8px 24px;
          background: linear-gradient(135deg, var(--new-color) 0%, var(--new-glow) 100%);
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 900;
          color: #0a0a0f;
          letter-spacing: 0.15em;
          animation: labelPulse 1.5s ease infinite;
        }

        @keyframes labelPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }

        /* Levels */
        .lum-levels {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          margin-bottom: 24px;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.5s ease 0.2s;
        }

        .show-content .lum-levels {
          opacity: 1;
          transform: translateY(0);
        }

        .lum-level {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .lum-level-icon {
          font-size: 3rem;
        }

        .lum-level-num {
          font-size: 0.85rem;
          font-weight: 700;
          color: #71717a;
        }

        .lum-level-prev {
          opacity: 0.5;
          filter: grayscale(0.5);
        }

        .lum-level-new .lum-level-icon {
          animation: iconBounce 0.6s ease 0.5s;
        }

        @keyframes iconBounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }

        .lum-level-new .lum-level-num {
          color: var(--new-color);
        }

        .lum-arrow {
          color: #3a3a4a;
        }

        /* Title */
        .lum-title-section {
          margin-bottom: 24px;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.5s ease 0.4s;
        }

        .show-content .lum-title-section {
          opacity: 1;
          transform: translateY(0);
        }

        .lum-title {
          margin: 0 0 4px;
          font-size: 1.75rem;
          font-weight: 900;
          color: var(--new-color);
          text-shadow: 0 0 30px var(--new-glow);
        }

        .lum-subtitle {
          margin: 0;
          font-size: 0.9rem;
          color: #71717a;
        }

        /* Perks */
        .lum-perks {
          background: rgba(20, 20, 25, 0.6);
          border: 1px solid #2a2a3a;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 24px;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.5s ease 0.6s;
        }

        .show-content .lum-perks {
          opacity: 1;
          transform: translateY(0);
        }

        .lum-perks-title {
          margin: 0 0 12px;
          font-size: 0.7rem;
          font-weight: 700;
          color: #52525b;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .lum-perk-item {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 8px 0;
        }

        .lum-perk-icon {
          font-size: 1.1rem;
        }

        .lum-perk-text {
          font-size: 0.9rem;
          font-weight: 600;
          color: #6ee7b7;
        }

        .lum-perk-legendary .lum-perk-text {
          color: #ffd93d;
        }

        /* Continue button */
        .lum-continue {
          width: 100%;
          padding: 14px 24px;
          background: linear-gradient(135deg, var(--new-color) 0%, var(--new-glow) 100%);
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 700;
          color: #0a0a0f;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.5s ease 0.8s, transform 0.2s ease, box-shadow 0.2s ease;
        }

        .show-content .lum-continue {
          opacity: 1;
          transform: translateY(0);
        }

        .lum-continue:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px var(--new-glow);
        }

        .lum-continue:active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );

  return createPortal(modal, document.body);
}

export default LevelUpModal;
