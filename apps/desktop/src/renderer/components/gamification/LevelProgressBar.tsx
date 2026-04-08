/**
 * LevelProgressBar - XP Progress & Level Badge
 * Tutorial 11: Gamification System
 *
 * Location: apps/desktop/src/renderer/components/gamification/LevelProgressBar.tsx
 *
 * Three display modes:
 * - compact: Small inline badge for header/navbar
 * - standard: Medium card with XP bar
 * - expanded: Full card with all details
 */

import { useEffect, useState } from 'react';
import {
  getProfile,
  getLevelForXP,
  getLevelProgress,
  getXPToNextLevel,
  calculateMultiplier,
  type GamificationProfile,
  type Level,
} from './gamificationData';

// ============================================
// TYPES
// ============================================

interface LevelProgressBarProps {
  /** Display mode */
  variant?: 'compact' | 'standard' | 'expanded';
  /** Show XP numbers */
  showXP?: boolean;
  /** Show streak info */
  showStreak?: boolean;
  /** Animate on mount */
  animate?: boolean;
  /** Custom class name */
  className?: string;
  /** Refresh trigger - increment to force refresh */
  refreshKey?: number;
}

// ============================================
// COMPONENT
// ============================================

export function LevelProgressBar({
  variant = 'standard',
  showXP = true,
  showStreak = true,
  animate = true,
  className = '',
  refreshKey = 0,
}: LevelProgressBarProps) {
  const [profile, setProfile] = useState<GamificationProfile | null>(null);
  const [level, setLevel] = useState<Level | null>(null);
  const [progress, setProgress] = useState({ current: 0, max: 100, percent: 0 });
  const [xpToNext, setXpToNext] = useState(0);
  const [multiplier, setMultiplier] = useState({
    streakMultiplier: 1,
    levelMultiplier: 1,
    totalMultiplier: 1,
  });
  const [isAnimating, setIsAnimating] = useState(animate);

  // Load data
  useEffect(() => {
    const p = getProfile();
    const lvl = getLevelForXP(p.totalXP);
    const prog = getLevelProgress(p.totalXP);
    const xpNext = getXPToNextLevel(p.totalXP);
    const mult = calculateMultiplier(lvl, p.currentStreak);

    setProfile(p);
    setLevel(lvl);
    setXpToNext(xpNext);
    setMultiplier(mult);

    if (animate) {
      setIsAnimating(true);
      // Delay progress animation
      setTimeout(() => {
        setProgress(prog);
        setIsAnimating(false);
      }, 100);
    } else {
      setProgress(prog);
    }
  }, [animate, refreshKey]);

  if (!profile || !level) return null;

  const nextLevel = level.level < 10 ? getLevelForXP(level.xpRequired + level.xpToNext + 1) : null;
  const isMaxLevel = level.level === 10;

  // ========== COMPACT VARIANT ==========
  if (variant === 'compact') {
    return (
      <div className={`level-progress-compact ${className}`}>
        <div
          className="lpc-badge"
          style={{ background: `${level.color}20`, borderColor: `${level.color}40` }}
        >
          <span className="lpc-icon">{level.icon}</span>
          <span className="lpc-level" style={{ color: level.color }}>
            Lv.{level.level}
          </span>
        </div>
        <div className="lpc-bar-wrap">
          <div
            className="lpc-bar-fill"
            style={{
              width: isAnimating ? '0%' : `${progress.percent}%`,
              background: `linear-gradient(90deg, ${level.color}, ${level.color}cc)`,
            }}
          />
        </div>
        {showXP && <span className="lpc-xp">{profile.totalXP.toLocaleString()} XP</span>}

        <style>{`
          .level-progress-compact {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 14px;
            background: var(--bg-elevated, #1C1C1C);
            border: 1px solid var(--border-subtle, #222222);
            border-radius: 12px;
          }

          .lpc-badge {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 4px 10px;
            border: 1px solid;
            border-radius: 8px;
          }

          .lpc-icon {
            font-size: 1rem;
          }

          .lpc-level {
            font-size: 0.75rem;
            font-weight: 700;
            letter-spacing: 0.02em;
          }

          .lpc-bar-wrap {
            flex: 1;
            min-width: 60px;
            height: 6px;
            background: var(--bg-surface, #141414);
            border-radius: 3px;
            overflow: hidden;
          }

          .lpc-bar-fill {
            height: 100%;
            border-radius: 3px;
            transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);
          }

          .lpc-xp {
            font-size: 0.7rem;
            font-weight: 600;
            color: var(--text-muted, #737373);
            min-width: 65px;
            text-align: right;
          }
        `}</style>
      </div>
    );
  }

  // ========== STANDARD VARIANT ==========
  if (variant === 'standard') {
    return (
      <div className={`level-progress-standard ${className}`}>
        {/* Level Badge */}
        <div className="lps-header">
          <div
            className="lps-badge"
            style={{
              background: `linear-gradient(135deg, ${level.color}15 0%, ${level.color}08 100%)`,
              borderColor: `${level.color}30`,
              boxShadow: `0 0 20px ${level.glowColor}`,
            }}
          >
            <span className="lps-icon">{level.icon}</span>
            <div className="lps-badge-info">
              <span className="lps-badge-label">LEVEL {level.level}</span>
              <span className="lps-badge-title" style={{ color: level.color }}>
                {level.title}
              </span>
            </div>
          </div>

          {showXP && (
            <div className="lps-xp-display">
              <span className="lps-xp-value">{profile.totalXP.toLocaleString()}</span>
              <span className="lps-xp-label">XP</span>
            </div>
          )}
        </div>

        {/* XP Bar */}
        <div className="lps-bar-container">
          <div className="lps-bar-track">
            <div
              className="lps-bar-fill"
              style={{
                width: isAnimating ? '0%' : `${progress.percent}%`,
                background: `linear-gradient(90deg, ${level.color} 0%, ${level.color}dd 100%)`,
              }}
            />
            <div
              className="lps-bar-glow"
              style={{
                width: isAnimating ? '0%' : `${progress.percent}%`,
                background: level.color,
              }}
            />
          </div>

          <div className="lps-bar-labels">
            <span>
              {progress.current.toLocaleString()} / {progress.max.toLocaleString()} XP
            </span>
            <span>
              {isMaxLevel
                ? '🌟 MAX LEVEL'
                : `${xpToNext.toLocaleString()} XP to Level ${level.level + 1}`}
            </span>
          </div>
        </div>

        {/* Streak & Multiplier */}
        {showStreak && (
          <div className="lps-footer">
            <div className="lps-stat">
              <span className="lps-stat-icon">🔥</span>
              <span className="lps-stat-value">{profile.currentStreak}</span>
              <span className="lps-stat-label">day streak</span>
            </div>
            <div className="lps-stat lps-stat-multiplier">
              <span className="lps-stat-icon">⚡</span>
              <span className="lps-stat-value" style={{ color: level.color }}>
                {multiplier.totalMultiplier.toFixed(2)}x
              </span>
              <span className="lps-stat-label">multiplier</span>
            </div>
          </div>
        )}

        <style>{`
          .level-progress-standard {
            padding: 20px;
            background: linear-gradient(180deg, var(--bg-card, #1A1A1A) 0%, var(--bg-surface, #141414) 100%);
            border: 1px solid var(--border-subtle, #222222);
            border-radius: 16px;
          }

          .lps-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
          }

          .lps-badge {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            border: 1px solid;
            border-radius: 12px;
            transition: box-shadow 0.3s ease;
          }

          .lps-icon {
            font-size: 2rem;
          }

          .lps-badge-info {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .lps-badge-label {
            font-size: 0.65rem;
            font-weight: 600;
            color: var(--text-muted, #737373);
            text-transform: uppercase;
            letter-spacing: 0.1em;
          }

          .lps-badge-title {
            font-size: 1rem;
            font-weight: 700;
            letter-spacing: -0.01em;
          }

          .lps-xp-display {
            text-align: right;
          }

          .lps-xp-value {
            display: block;
            font-size: 1.5rem;
            font-weight: 800;
            color: var(--text-primary, #FFFFFF);
            letter-spacing: -0.02em;
          }

          .lps-xp-label {
            font-size: 0.65rem;
            font-weight: 600;
            color: var(--text-muted, #737373);
            text-transform: uppercase;
            letter-spacing: 0.1em;
          }

          .lps-bar-container {
            margin-bottom: 16px;
          }

          .lps-bar-track {
            position: relative;
            height: 10px;
            background: var(--bg-surface, #141414);
            border-radius: 5px;
            overflow: hidden;
          }

          .lps-bar-fill {
            position: relative;
            height: 100%;
            border-radius: 5px;
            transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);
            z-index: 2;
          }

          .lps-bar-glow {
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            filter: blur(8px);
            opacity: 0.4;
            z-index: 1;
            transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);
          }

          .lps-bar-labels {
            display: flex;
            justify-content: space-between;
            margin-top: 8px;
            font-size: 0.7rem;
            color: var(--text-muted, #737373);
          }

          .lps-footer {
            display: flex;
            gap: 20px;
            padding-top: 16px;
            border-top: 1px solid var(--border-subtle, #222222);
          }

          .lps-stat {
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .lps-stat-icon {
            font-size: 0.9rem;
          }

          .lps-stat-value {
            font-size: 0.9rem;
            font-weight: 700;
            color: var(--text-primary, #FFFFFF);
          }

          .lps-stat-label {
            font-size: 0.75rem;
            color: var(--text-muted, #737373);
          }

          .lps-stat-multiplier {
            margin-left: auto;
          }
        `}</style>
      </div>
    );
  }

  // ========== EXPANDED VARIANT ==========
  return (
    <div className={`level-progress-expanded ${className}`}>
      {/* Hero Section */}
      <div
        className="lpe-hero"
        style={{
          background: `radial-gradient(ellipse at top, ${level.color}15 0%, transparent 60%)`,
        }}
      >
        <div
          className="lpe-level-orb"
          style={{
            background: `linear-gradient(135deg, ${level.color}30 0%, ${level.color}10 100%)`,
            borderColor: `${level.color}50`,
            boxShadow: `0 0 40px ${level.glowColor}, inset 0 0 30px ${level.color}10`,
          }}
        >
          <span className="lpe-orb-icon">{level.icon}</span>
          <span className="lpe-orb-level">Level {level.level}</span>
        </div>

        <h2 className="lpe-title" style={{ color: level.color }}>
          {level.title}
        </h2>
        <p className="lpe-subtitle">{level.name}</p>
      </div>

      {/* XP Section */}
      <div className="lpe-xp-section">
        <div className="lpe-xp-header">
          <div className="lpe-xp-current">
            <span className="lpe-xp-number">{profile.totalXP.toLocaleString()}</span>
            <span className="lpe-xp-label">Total XP</span>
          </div>
          {!isMaxLevel && (
            <div className="lpe-xp-next">
              <span className="lpe-xp-number">{xpToNext.toLocaleString()}</span>
              <span className="lpe-xp-label">XP to Level {level.level + 1}</span>
            </div>
          )}
        </div>

        {/* Large XP Bar */}
        <div className="lpe-bar-container">
          <div className="lpe-bar-track">
            <div
              className="lpe-bar-fill"
              style={{
                width: isAnimating ? '0%' : `${progress.percent}%`,
                background: `linear-gradient(90deg, ${level.color} 0%, ${level.color}cc 50%, ${level.color} 100%)`,
              }}
            >
              <div className="lpe-bar-shimmer" />
            </div>
          </div>

          <div className="lpe-bar-markers">
            <span>0</span>
            <span style={{ left: '25%' }}>25%</span>
            <span style={{ left: '50%' }}>50%</span>
            <span style={{ left: '75%' }}>75%</span>
            <span style={{ left: '100%' }}>100%</span>
          </div>
        </div>

        {isMaxLevel && (
          <div className="lpe-max-level">
            <span className="lpe-max-icon">🌟</span>
            <span>Maximum Level Achieved!</span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="lpe-stats-grid">
        <div className="lpe-stat-card">
          <span className="lpe-stat-icon">🔥</span>
          <span className="lpe-stat-value">{profile.currentStreak}</span>
          <span className="lpe-stat-label">Day Streak</span>
        </div>
        <div className="lpe-stat-card">
          <span className="lpe-stat-icon">🏆</span>
          <span className="lpe-stat-value">{profile.longestStreak}</span>
          <span className="lpe-stat-label">Best Streak</span>
        </div>
        <div className="lpe-stat-card">
          <span className="lpe-stat-icon">⏱️</span>
          <span className="lpe-stat-value">{Math.floor(profile.totalFocusMinutes / 60)}h</span>
          <span className="lpe-stat-label">Focus Time</span>
        </div>
        <div className="lpe-stat-card">
          <span className="lpe-stat-icon">📊</span>
          <span className="lpe-stat-value">{profile.totalSessions}</span>
          <span className="lpe-stat-label">Sessions</span>
        </div>
      </div>

      {/* Multiplier Section */}
      <div className="lpe-multiplier-section">
        <h3 className="lpe-section-title">XP Multiplier</h3>
        <div className="lpe-multiplier-display">
          <span
            className="lpe-multiplier-value"
            style={{
              color: level.color,
              textShadow: `0 0 20px ${level.glowColor}`,
            }}
          >
            {multiplier.totalMultiplier.toFixed(2)}x
          </span>
        </div>
        <div className="lpe-multiplier-breakdown">
          <div className="lpe-mult-item">
            <span>🔥 Streak Bonus</span>
            <span>+{((multiplier.streakMultiplier - 1) * 100).toFixed(0)}%</span>
          </div>
          <div className="lpe-mult-item">
            <span>{level.icon} Level Bonus</span>
            <span>+{((multiplier.levelMultiplier - 1) * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* Next Level Preview */}
      {nextLevel && (
        <div className="lpe-next-level">
          <h3 className="lpe-section-title">Next Level</h3>
          <div className="lpe-next-preview">
            <span className="lpe-next-icon">{nextLevel.icon}</span>
            <div className="lpe-next-info">
              <span className="lpe-next-name" style={{ color: nextLevel.color }}>
                {nextLevel.title}
              </span>
              <span className="lpe-next-bonus">
                +
                {((nextLevel.streakMultiplierBonus - level.streakMultiplierBonus) * 100).toFixed(0)}
                % bonus multiplier
              </span>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .level-progress-expanded {
          background: linear-gradient(180deg, var(--bg-card, #1A1A1A) 0%, var(--bg-surface, #141414) 100%);
          border: 1px solid var(--border-subtle, #222222);
          border-radius: 20px;
          overflow: hidden;
        }

        /* Hero Section */
        .lpe-hero {
          padding: 32px 24px 24px;
          text-align: center;
        }

        .lpe-level-orb {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100px;
          height: 100px;
          border: 2px solid;
          border-radius: 50%;
          margin-bottom: 16px;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .lpe-level-orb:hover {
          transform: scale(1.05);
        }

        .lpe-orb-icon {
          font-size: 2.5rem;
          margin-bottom: 4px;
        }

        .lpe-orb-level {
          font-size: 0.65rem;
          font-weight: 700;
          color: var(--text-muted, #737373);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .lpe-title {
          font-size: 1.5rem;
          font-weight: 800;
          margin: 0 0 4px;
          letter-spacing: -0.02em;
        }

        .lpe-subtitle {
          font-size: 0.85rem;
          color: var(--text-muted, #737373);
          margin: 0;
        }

        /* XP Section */
        .lpe-xp-section {
          padding: 0 24px 24px;
        }

        .lpe-xp-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .lpe-xp-current,
        .lpe-xp-next {
          display: flex;
          flex-direction: column;
        }

        .lpe-xp-next {
          text-align: right;
        }

        .lpe-xp-number {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--text-primary, #FFFFFF);
        }

        .lpe-xp-label {
          font-size: 0.65rem;
          font-weight: 600;
          color: var(--text-muted, #737373);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .lpe-bar-container {
          position: relative;
        }

        .lpe-bar-track {
          height: 14px;
          background: var(--bg-surface, #141414);
          border-radius: 7px;
          overflow: hidden;
        }

        .lpe-bar-fill {
          position: relative;
          height: 100%;
          border-radius: 7px;
          transition: width 1s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
        }

        .lpe-bar-shimmer {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          animation: shimmer 2s infinite;
        }

        @keyframes shimmer {
          100% { left: 100%; }
        }

        .lpe-bar-markers {
          display: flex;
          justify-content: space-between;
          margin-top: 6px;
          font-size: 0.6rem;
          color: var(--text-muted, #737373);
        }

        .lpe-max-level {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 16px;
          padding: 12px;
          background: rgba(255, 217, 61, 0.1);
          border: 1px solid rgba(255, 217, 61, 0.3);
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #ffd93d;
        }

        .lpe-max-icon {
          font-size: 1.2rem;
        }

        /* Stats Grid */
        .lpe-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          padding: 0 24px 24px;
        }

        .lpe-stat-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 16px 8px;
          background: var(--bg-elevated, #1C1C1C);
          border: 1px solid var(--border-subtle, #222222);
          border-radius: 12px;
          transition: transform 0.2s ease, border-color 0.2s ease;
        }

        .lpe-stat-card:hover {
          transform: translateY(-2px);
          border-color: var(--border-default, #2A2A2A);
        }

        .lpe-stat-icon {
          font-size: 1.25rem;
          margin-bottom: 8px;
        }

        .lpe-stat-value {
          font-size: 1.1rem;
          font-weight: 800;
          color: var(--text-primary, #FFFFFF);
        }

        .lpe-stat-label {
          font-size: 0.6rem;
          font-weight: 600;
          color: var(--text-muted, #737373);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 2px;
        }

        /* Multiplier Section */
        .lpe-multiplier-section {
          padding: 20px 24px;
          background: var(--bg-elevated, #1C1C1C);
          border-top: 1px solid var(--border-subtle, #222222);
        }

        .lpe-section-title {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--text-muted, #737373);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin: 0 0 12px;
        }

        .lpe-multiplier-display {
          text-align: center;
          margin-bottom: 16px;
        }

        .lpe-multiplier-value {
          font-size: 2.5rem;
          font-weight: 900;
          letter-spacing: -0.02em;
        }

        .lpe-multiplier-breakdown {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .lpe-mult-item {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          color: var(--text-secondary, #A3A3A3);
        }

        .lpe-mult-item span:last-child {
          font-weight: 600;
          color: var(--accent-green, #4ADE80);
        }

        /* Next Level Preview */
        .lpe-next-level {
          padding: 20px 24px;
          border-top: 1px solid var(--border-subtle, #222222);
        }

        .lpe-next-preview {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: var(--bg-elevated, #1C1C1C);
          border: 1px dashed var(--border-subtle, #222222);
          border-radius: 12px;
        }

        .lpe-next-icon {
          font-size: 1.75rem;
        }

        .lpe-next-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .lpe-next-name {
          font-size: 0.95rem;
          font-weight: 700;
        }

        .lpe-next-bonus {
          font-size: 0.75rem;
          color: var(--text-muted, #737373);
        }
      `}</style>
    </div>
  );
}

export default LevelProgressBar;
