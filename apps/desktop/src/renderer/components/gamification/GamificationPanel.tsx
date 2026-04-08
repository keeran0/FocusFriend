/**
 * GamificationPanel - Main Gamification Sidebar
 * Tutorial 11: Gamification System
 *
 * Location: apps/desktop/src/renderer/components/gamification/GamificationPanel.tsx
 *
 * Combined panel showing level progress, daily challenges, and achievements.
 * Can be used as a sidebar or modal content.
 */

import { useState, useEffect } from 'react';
import { LevelProgressBar } from './LevelProgressBar';
import { DailyChallenges } from './DailyChallenges';
import { AchievementsPanel } from './AchievementsPanel';
import { getProfile, getAchievementProgress, type GamificationProfile } from './gamificationData';

// ============================================
// TYPES
// ============================================

interface GamificationPanelProps {
  /** Active tab */
  initialTab?: 'overview' | 'achievements';
  /** Compact mode */
  compact?: boolean;
  /** Newly unlocked achievement IDs */
  newlyUnlocked?: string[];
  /** Refresh trigger */
  refreshKey?: number;
  /** Custom class name */
  className?: string;
}

// ============================================
// COMPONENT
// ============================================

export function GamificationPanel({
  initialTab = 'overview',
  compact = false,
  newlyUnlocked = [],
  refreshKey = 0,
  className = '',
}: GamificationPanelProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [profile, setProfile] = useState<GamificationProfile | null>(null);
  const [achievementProgress, setAchievementProgress] = useState({
    total: 0,
    unlocked: 0,
    percentage: 0,
  });

  useEffect(() => {
    setProfile(getProfile());
    setAchievementProgress(getAchievementProgress());
  }, [refreshKey]);

  if (!profile) return null;

  return (
    <div className={`gamification-panel ${compact ? 'compact' : ''} ${className}`}>
      {/* Tab navigation */}
      <div className="gp-tabs">
        <button
          className={`gp-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <span className="gp-tab-icon">📊</span>
          <span className="gp-tab-label">Overview</span>
        </button>
        <button
          className={`gp-tab ${activeTab === 'achievements' ? 'active' : ''}`}
          onClick={() => setActiveTab('achievements')}
        >
          <span className="gp-tab-icon">🏆</span>
          <span className="gp-tab-label">Achievements</span>
          {newlyUnlocked.length > 0 && <span className="gp-tab-badge">{newlyUnlocked.length}</span>}
        </button>
      </div>

      {/* Tab content */}
      <div className="gp-content">
        {activeTab === 'overview' && (
          <div className="gp-overview">
            {/* Level progress */}
            <section className="gp-section">
              <LevelProgressBar
                variant={compact ? 'standard' : 'expanded'}
                refreshKey={refreshKey}
              />
            </section>

            {/* Daily challenges */}
            <section className="gp-section">
              <DailyChallenges compact={compact} refreshKey={refreshKey} />
            </section>

            {/* Quick stats */}
            <section className="gp-section gp-quick-stats">
              <h3 className="gp-section-title">Statistics</h3>
              <div className="gp-stats-grid">
                <div className="gp-stat-card">
                  <span className="gp-stat-value">
                    {Math.floor(profile.totalFocusMinutes / 60)}h {profile.totalFocusMinutes % 60}m
                  </span>
                  <span className="gp-stat-label">Total Focus</span>
                </div>
                <div className="gp-stat-card">
                  <span className="gp-stat-value">{profile.totalSessions}</span>
                  <span className="gp-stat-label">Sessions</span>
                </div>
                <div className="gp-stat-card">
                  <span className="gp-stat-value">{profile.longestStreak}</span>
                  <span className="gp-stat-label">Best Streak</span>
                </div>
                <div className="gp-stat-card">
                  <span className="gp-stat-value">
                    {achievementProgress.unlocked}/{achievementProgress.total}
                  </span>
                  <span className="gp-stat-label">Achievements</span>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'achievements' && (
          <AchievementsPanel compact={compact} newlyUnlocked={newlyUnlocked} />
        )}
      </div>

      <style>{`
        .gamification-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: linear-gradient(180deg, #0a0a0f 0%, #0f0f14 100%);
        }

        /* Tabs */
        .gp-tabs {
          display: flex;
          gap: 4px;
          padding: 12px;
          background: #141419;
          border-bottom: 1px solid #2a2a3a;
        }

        .gp-tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 16px;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #71717a;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .gp-tab:hover {
          color: #a1a1aa;
          background: rgba(255, 255, 255, 0.03);
        }

        .gp-tab.active {
          color: #fafafa;
          background: #1e1e2a;
          border-color: #2a2a3a;
        }

        .gp-tab-icon {
          font-size: 1.1rem;
        }

        .gp-tab-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 6px;
          background: linear-gradient(135deg, #ff6b6b 0%, #ffa07a 100%);
          border-radius: 9px;
          font-size: 0.65rem;
          font-weight: 800;
          color: #0a0a0f;
        }

        /* Content */
        .gp-content {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }

        .gp-content::-webkit-scrollbar {
          width: 6px;
        }

        .gp-content::-webkit-scrollbar-track {
          background: transparent;
        }

        .gp-content::-webkit-scrollbar-thumb {
          background: #3a3a4a;
          border-radius: 3px;
        }

        /* Overview */
        .gp-overview {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .gp-section {
          /* sections are self-contained */
        }

        .gp-section-title {
          margin: 0 0 12px;
          font-size: 0.75rem;
          font-weight: 700;
          color: #52525b;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        /* Quick stats */
        .gp-quick-stats {
          padding: 16px;
          background: linear-gradient(180deg, #1a1a25 0%, #141419 100%);
          border: 1px solid #2a2a3a;
          border-radius: 16px;
        }

        .gp-stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .gp-stat-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 16px;
          background: #1e1e2a;
          border: 1px solid #2a2a3a;
          border-radius: 12px;
          transition: transform 0.2s ease;
        }

        .gp-stat-card:hover {
          transform: translateY(-2px);
        }

        .gp-stat-value {
          font-size: 1.25rem;
          font-weight: 800;
          color: #fafafa;
          margin-bottom: 4px;
        }

        .gp-stat-label {
          font-size: 0.7rem;
          font-weight: 600;
          color: #71717a;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* Compact mode */
        .gamification-panel.compact .gp-tabs {
          padding: 8px;
        }

        .gamification-panel.compact .gp-tab {
          padding: 8px 12px;
          font-size: 0.8rem;
        }

        .gamification-panel.compact .gp-tab-label {
          display: none;
        }

        .gamification-panel.compact .gp-content {
          padding: 12px;
        }

        .gamification-panel.compact .gp-stats-grid {
          grid-template-columns: repeat(4, 1fr);
        }

        .gamification-panel.compact .gp-stat-card {
          padding: 12px 8px;
        }

        .gamification-panel.compact .gp-stat-value {
          font-size: 1rem;
        }
      `}</style>
    </div>
  );
}

export default GamificationPanel;
