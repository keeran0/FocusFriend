/**
 * AchievementsPanel - Achievement Grid & Progress
 * Tutorial 11: Gamification System
 *
 * Location: apps/desktop/src/renderer/components/gamification/AchievementsPanel.tsx
 *
 * Displays all achievements in a categorized grid with progress tracking.
 */

import { useState, useEffect } from 'react';
import {
  getAllAchievements,
  getAchievementProgress,
  RARITY_COLORS,
  type Achievement,
  type AchievementCategory,
  type AchievementRarity,
} from './gamificationData';
import { AchievementBadge } from './AchievementBadge';

// ============================================
// TYPES
// ============================================

interface AchievementsPanelProps {
  /** Initially selected category */
  initialCategory?: AchievementCategory | 'all';
  /** Compact mode - fewer details */
  compact?: boolean;
  /** Newly unlocked achievement IDs (for animation) */
  newlyUnlocked?: string[];
  /** Custom class name */
  className?: string;
}

// ============================================
// CONSTANTS
// ============================================

const CATEGORIES: { id: AchievementCategory | 'all'; label: string; icon: string }[] = [
  { id: 'all', label: 'All', icon: '🏆' },
  { id: 'time', label: 'Focus Time', icon: '⏱️' },
  { id: 'streak', label: 'Streaks', icon: '🔥' },
  { id: 'sessions', label: 'Sessions', icon: '📊' },
  { id: 'level', label: 'Levels', icon: '⭐' },
  { id: 'special', label: 'Special', icon: '✨' },
];

const RARITY_ORDER: AchievementRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

// ============================================
// COMPONENT
// ============================================

export function AchievementsPanel({
  initialCategory = 'all',
  compact = false,
  newlyUnlocked = [],
  className = '',
}: AchievementsPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>(
    initialCategory
  );
  const [achievements, setAchievements] = useState<(Achievement & { unlocked: boolean })[]>([]);
  const [progress, setProgress] = useState({
    total: 0,
    unlocked: 0,
    percentage: 0,
    byRarity: {} as Record<AchievementRarity, { total: number; unlocked: number }>,
  });

  useEffect(() => {
    setAchievements(getAllAchievements());
    setProgress(getAchievementProgress());
  }, []);

  // Filter achievements by category
  const filteredAchievements =
    selectedCategory === 'all'
      ? achievements
      : achievements.filter(a => a.category === selectedCategory);

  // Sort: unlocked first, then by rarity
  const sortedAchievements = [...filteredAchievements].sort((a, b) => {
    // Unlocked first
    if (a.unlocked && !b.unlocked) return -1;
    if (!a.unlocked && b.unlocked) return 1;
    // Then by rarity (legendary first)
    return RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity);
  });

  return (
    <div className={`achievements-panel ${compact ? 'compact' : ''} ${className}`}>
      {/* Header with progress */}
      <div className="ap-header">
        <div className="ap-title-row">
          <h2 className="ap-title">Achievements</h2>
          <div className="ap-progress-badge">
            <span className="ap-progress-count">
              {progress.unlocked}/{progress.total}
            </span>
            <span className="ap-progress-percent">{progress.percentage}%</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="ap-progress-bar">
          <div className="ap-progress-fill" style={{ width: `${progress.percentage}%` }} />
        </div>

        {/* Rarity breakdown */}
        {!compact && (
          <div className="ap-rarity-breakdown">
            {RARITY_ORDER.map(rarity => {
              const data = progress.byRarity[rarity];
              if (!data) return null;
              const colors = RARITY_COLORS[rarity];
              return (
                <div
                  key={rarity}
                  className="ap-rarity-item"
                  style={{ '--rarity-color': colors.text } as React.CSSProperties}
                >
                  <span className="ap-rarity-dot" style={{ background: colors.text }} />
                  <span className="ap-rarity-label">{rarity}</span>
                  <span className="ap-rarity-count">
                    {data.unlocked}/{data.total}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Category tabs */}
      <div className="ap-tabs">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={`ap-tab ${selectedCategory === cat.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            <span className="ap-tab-icon">{cat.icon}</span>
            {!compact && <span className="ap-tab-label">{cat.label}</span>}
          </button>
        ))}
      </div>

      {/* Achievements grid */}
      <div className={`ap-grid ${compact ? 'compact-grid' : ''}`}>
        {sortedAchievements.map(achievement => (
          <AchievementBadge
            key={achievement.id}
            achievement={achievement}
            size={compact ? 'small' : 'medium'}
            isNew={newlyUnlocked.includes(achievement.id)}
          />
        ))}

        {sortedAchievements.length === 0 && (
          <div className="ap-empty">
            <span className="ap-empty-icon">🔍</span>
            <span>No achievements in this category</span>
          </div>
        )}
      </div>

      <style>{`
        .achievements-panel {
          background: linear-gradient(180deg, #1a1a25 0%, #141419 100%);
          border: 1px solid #2a2a3a;
          border-radius: 20px;
          overflow: hidden;
        }

        /* Header */
        .ap-header {
          padding: 24px 24px 20px;
          border-bottom: 1px solid #2a2a3a;
        }

        .ap-title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .ap-title {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 800;
          color: #fafafa;
        }

        .ap-progress-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          background: #1e1e2a;
          border: 1px solid #2a2a3a;
          border-radius: 20px;
        }

        .ap-progress-count {
          font-size: 0.85rem;
          font-weight: 700;
          color: #e4e4e7;
        }

        .ap-progress-percent {
          font-size: 0.75rem;
          font-weight: 600;
          color: #6ee7b7;
        }

        /* Progress bar */
        .ap-progress-bar {
          height: 6px;
          background: #141419;
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 16px;
        }

        .ap-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #6ee7b7 0%, #7dd3fc 50%, #b4a0ff 100%);
          border-radius: 3px;
          transition: width 0.5s ease;
        }

        /* Rarity breakdown */
        .ap-rarity-breakdown {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
        }

        .ap-rarity-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .ap-rarity-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .ap-rarity-label {
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--rarity-color);
          text-transform: capitalize;
        }

        .ap-rarity-count {
          font-size: 0.7rem;
          color: #71717a;
        }

        /* Tabs */
        .ap-tabs {
          display: flex;
          gap: 4px;
          padding: 12px 16px;
          background: #1e1e2a;
          border-bottom: 1px solid #2a2a3a;
          overflow-x: auto;
        }

        .ap-tab {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          color: #71717a;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
        }

        .ap-tab:hover {
          color: #a1a1aa;
          background: rgba(255, 255, 255, 0.03);
        }

        .ap-tab.active {
          color: #fafafa;
          background: rgba(255, 255, 255, 0.05);
          border-color: #3a3a4a;
        }

        .ap-tab-icon {
          font-size: 1rem;
        }

        /* Grid */
        .ap-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 12px;
          padding: 20px;
          max-height: 500px;
          overflow-y: auto;
        }

        .ap-grid.compact-grid {
          grid-template-columns: repeat(auto-fill, minmax(56px, 1fr));
          gap: 8px;
          max-height: 300px;
        }

        /* Scrollbar */
        .ap-grid::-webkit-scrollbar {
          width: 6px;
        }

        .ap-grid::-webkit-scrollbar-track {
          background: transparent;
        }

        .ap-grid::-webkit-scrollbar-thumb {
          background: #3a3a4a;
          border-radius: 3px;
        }

        .ap-grid::-webkit-scrollbar-thumb:hover {
          background: #4a4a5a;
        }

        /* Empty state */
        .ap-empty {
          grid-column: 1 / -1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 40px;
          color: #52525b;
        }

        .ap-empty-icon {
          font-size: 2rem;
          opacity: 0.5;
        }

        /* Compact mode */
        .achievements-panel.compact .ap-header {
          padding: 16px;
        }

        .achievements-panel.compact .ap-title {
          font-size: 1rem;
        }

        .achievements-panel.compact .ap-rarity-breakdown {
          display: none;
        }

        .achievements-panel.compact .ap-tab {
          padding: 6px 10px;
        }

        .achievements-panel.compact .ap-tab-label {
          display: none;
        }
      `}</style>
    </div>
  );
}

export default AchievementsPanel;
