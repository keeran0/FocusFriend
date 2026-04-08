/**
 * DailyChallenges - Daily Challenge Progress
 * Tutorial 11: Gamification System
 *
 * Location: apps/desktop/src/renderer/components/gamification/DailyChallenges.tsx
 *
 * Displays daily challenges with progress tracking.
 */

import { useEffect, useState } from 'react';
import { getDailyChallenges, type DailyChallenge } from './gamificationData';

// ============================================
// TYPES
// ============================================

interface DailyChallengesProps {
  /** Compact mode */
  compact?: boolean;
  /** Refresh trigger */
  refreshKey?: number;
  /** Custom class name */
  className?: string;
}

// ============================================
// COMPONENT
// ============================================

export function DailyChallenges({
  compact = false,
  refreshKey = 0,
  className = '',
}: DailyChallengesProps) {
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);

  useEffect(() => {
    setChallenges(getDailyChallenges());
  }, [refreshKey]);

  const completedCount = challenges.filter(c => c.completed).length;
  const totalXP = challenges.reduce((sum, c) => sum + (c.completed ? c.xpReward : 0), 0);
  const potentialXP = challenges.reduce((sum, c) => sum + c.xpReward, 0);

  const getChallengeIcon = (type: DailyChallenge['type']): string => {
    switch (type) {
      case 'focus_time':
        return '⏱️';
      case 'sessions':
        return '📊';
      case 'streak':
        return '🔥';
      default:
        return '🎯';
    }
  };

  return (
    <div className={`daily-challenges ${compact ? 'compact' : ''} ${className}`}>
      {/* Header */}
      <div className="dc-header">
        <div className="dc-title-row">
          <h3 className="dc-title">Daily Challenges</h3>
          <div className="dc-completion">
            <span className="dc-completion-count">
              {completedCount}/{challenges.length}
            </span>
            <span className="dc-completion-xp">
              {totalXP}/{potentialXP} XP
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="dc-progress-bar">
          <div
            className="dc-progress-fill"
            style={{ width: `${(completedCount / challenges.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Challenges list */}
      <div className="dc-list">
        {challenges.map(challenge => {
          const progress = Math.min(100, (challenge.progress / challenge.target) * 100);

          return (
            <div key={challenge.id} className={`dc-item ${challenge.completed ? 'completed' : ''}`}>
              {/* Icon */}
              <div className="dc-item-icon">
                {challenge.completed ? '✅' : getChallengeIcon(challenge.type)}
              </div>

              {/* Content */}
              <div className="dc-item-content">
                <div className="dc-item-header">
                  <span className="dc-item-title">{challenge.title}</span>
                  <span className="dc-item-xp">+{challenge.xpReward} XP</span>
                </div>

                {!compact && <p className="dc-item-description">{challenge.description}</p>}

                {/* Progress bar */}
                <div className="dc-item-progress">
                  <div className="dc-item-progress-bar">
                    <div className="dc-item-progress-fill" style={{ width: `${progress}%` }} />
                  </div>
                  <span className="dc-item-progress-text">
                    {challenge.progress}/{challenge.target}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* All completed message */}
      {completedCount === challenges.length && (
        <div className="dc-all-complete">
          <span className="dc-all-complete-icon">🎉</span>
          <span>All challenges completed!</span>
        </div>
      )}

      <style>{`
        .daily-challenges {
          background: linear-gradient(180deg, #1a1a25 0%, #141419 100%);
          border: 1px solid #2a2a3a;
          border-radius: 16px;
          overflow: hidden;
        }

        /* Header */
        .dc-header {
          padding: 16px;
          border-bottom: 1px solid #2a2a3a;
        }

        .dc-title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .dc-title {
          margin: 0;
          font-size: 1rem;
          font-weight: 700;
          color: #fafafa;
        }

        .dc-completion {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .dc-completion-count {
          font-size: 0.85rem;
          font-weight: 700;
          color: #e4e4e7;
        }

        .dc-completion-xp {
          font-size: 0.75rem;
          font-weight: 600;
          color: #6ee7b7;
        }

        .dc-progress-bar {
          height: 4px;
          background: #141419;
          border-radius: 2px;
          overflow: hidden;
        }

        .dc-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #6ee7b7 0%, #7dd3fc 100%);
          border-radius: 2px;
          transition: width 0.5s ease;
        }

        /* List */
        .dc-list {
          padding: 8px;
        }

        .dc-item {
          display: flex;
          gap: 12px;
          padding: 12px;
          border-radius: 10px;
          transition: background 0.2s ease;
        }

        .dc-item:hover {
          background: rgba(255, 255, 255, 0.02);
        }

        .dc-item.completed {
          opacity: 0.7;
        }

        .dc-item-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: #1e1e2a;
          border: 1px solid #2a2a3a;
          border-radius: 10px;
          font-size: 1.25rem;
          flex-shrink: 0;
        }

        .dc-item.completed .dc-item-icon {
          background: rgba(110, 231, 183, 0.1);
          border-color: rgba(110, 231, 183, 0.3);
        }

        .dc-item-content {
          flex: 1;
          min-width: 0;
        }

        .dc-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .dc-item-title {
          font-size: 0.9rem;
          font-weight: 600;
          color: #fafafa;
        }

        .dc-item.completed .dc-item-title {
          text-decoration: line-through;
          color: #71717a;
        }

        .dc-item-xp {
          font-size: 0.75rem;
          font-weight: 600;
          color: #6ee7b7;
        }

        .dc-item.completed .dc-item-xp {
          color: #52525b;
        }

        .dc-item-description {
          margin: 0 0 8px;
          font-size: 0.8rem;
          color: #71717a;
        }

        .dc-item-progress {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .dc-item-progress-bar {
          flex: 1;
          height: 4px;
          background: #1e1e2a;
          border-radius: 2px;
          overflow: hidden;
        }

        .dc-item-progress-fill {
          height: 100%;
          background: #7dd3fc;
          border-radius: 2px;
          transition: width 0.3s ease;
        }

        .dc-item.completed .dc-item-progress-fill {
          background: #6ee7b7;
        }

        .dc-item-progress-text {
          font-size: 0.7rem;
          font-weight: 600;
          color: #52525b;
          min-width: 32px;
          text-align: right;
        }

        /* All complete */
        .dc-all-complete {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 16px;
          background: rgba(110, 231, 183, 0.1);
          border-top: 1px solid rgba(110, 231, 183, 0.2);
          font-size: 0.85rem;
          font-weight: 600;
          color: #6ee7b7;
        }

        .dc-all-complete-icon {
          font-size: 1.1rem;
        }

        /* Compact mode */
        .daily-challenges.compact .dc-header {
          padding: 12px;
        }

        .daily-challenges.compact .dc-title {
          font-size: 0.9rem;
        }

        .daily-challenges.compact .dc-item {
          padding: 8px;
        }

        .daily-challenges.compact .dc-item-icon {
          width: 32px;
          height: 32px;
          font-size: 1rem;
        }

        .daily-challenges.compact .dc-item-title {
          font-size: 0.8rem;
        }
      `}</style>
    </div>
  );
}

export default DailyChallenges;
