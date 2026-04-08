/**
 * WeeklyBarChart - Weekly Focus Time Bar Chart
 * Tutorial 12: Analytics Dashboard
 * 
 * Location: apps/desktop/src/renderer/components/analytics/WeeklyBarChart.tsx
 * 
 * Displays a bar chart showing focus time for each day of the week.
 * Vapor Dusk aesthetic with animated bars.
 */

import { useState, useEffect } from 'react';
import { getWeeklyStats, formatDuration, type WeeklyStats } from './analyticsData';

// ============================================
// TYPES
// ============================================

interface WeeklyBarChartProps {
  /** Week offset (0 = current week, -1 = last week) */
  weekOffset?: number;
  /** Chart height in pixels */
  height?: number;
  /** Show week navigation */
  showNavigation?: boolean;
  /** Refresh trigger */
  refreshKey?: number;
  /** Custom class name */
  className?: string;
}

// ============================================
// CONSTANTS
// ============================================

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const BAR_COLORS = [
  '#7dd3fc', // Monday - sky
  '#6ee7b7', // Tuesday - mint  
  '#b4a0ff', // Wednesday - lavender
  '#ffa07a', // Thursday - peach
  '#ff6b6b', // Friday - coral
  '#ffd93d', // Saturday - gold
  '#f472b6', // Sunday - pink
];

// ============================================
// COMPONENT
// ============================================

export function WeeklyBarChart({
  weekOffset: initialOffset = 0,
  height = 200,
  showNavigation = true,
  refreshKey = 0,
  className = '',
}: WeeklyBarChartProps) {
  const [weekOffset, setWeekOffset] = useState(initialOffset);
  const [data, setData] = useState<WeeklyStats | null>(null);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    setData(getWeeklyStats(weekOffset));
    // Trigger animation
    setAnimationKey(k => k + 1);
  }, [weekOffset, refreshKey]);

  if (!data) return null;

  // Find max value for scaling
  const maxMinutes = Math.max(...data.days.map(d => d.focusMinutes), 60);
  const scale = (height - 60) / maxMinutes;

  // Format week range for header
  const weekStart = new Date(data.weekStart);
  const weekEnd = new Date(data.weekEnd);
  const formatDate = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
  const weekLabel = `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;

  const isCurrentWeek = weekOffset === 0;
  const today = new Date().getDay();
  const todayIndex = today === 0 ? 6 : today - 1; // Convert to Mon=0 index

  return (
    <div className={`weekly-bar-chart ${className}`}>
      {/* Header */}
      <div className="wbc-header">
        <div className="wbc-title-section">
          <h3 className="wbc-title">Weekly Overview</h3>
          <span className="wbc-subtitle">{weekLabel}</span>
        </div>

        {showNavigation && (
          <div className="wbc-navigation">
            <button 
              className="wbc-nav-btn"
              onClick={() => setWeekOffset(w => w - 1)}
            >
              ←
            </button>
            <button 
              className="wbc-nav-btn wbc-nav-today"
              onClick={() => setWeekOffset(0)}
              disabled={isCurrentWeek}
            >
              Today
            </button>
            <button 
              className="wbc-nav-btn"
              onClick={() => setWeekOffset(w => w + 1)}
              disabled={weekOffset >= 0}
            >
              →
            </button>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="wbc-stats">
        <div className="wbc-stat">
          <span className="wbc-stat-value">{formatDuration(data.totalMinutes)}</span>
          <span className="wbc-stat-label">Total</span>
        </div>
        <div className="wbc-stat">
          <span className="wbc-stat-value">{data.activeDays}</span>
          <span className="wbc-stat-label">Active Days</span>
        </div>
        <div className="wbc-stat">
          <span className="wbc-stat-value">{formatDuration(data.avgDailyMinutes)}</span>
          <span className="wbc-stat-label">Daily Avg</span>
        </div>
      </div>

      {/* Chart */}
      <div className="wbc-chart" style={{ height: `${height}px` }}>
        {/* Y-axis grid lines */}
        <div className="wbc-grid">
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
            <div 
              key={i}
              className="wbc-grid-line"
              style={{ bottom: `${pct * (height - 40)}px` }}
            >
              <span className="wbc-grid-label">
                {Math.round(maxMinutes * (1 - pct))}m
              </span>
            </div>
          ))}
        </div>

        {/* Bars */}
        <div className="wbc-bars">
          {data.days.map((day, index) => {
            const barHeight = day.focusMinutes * scale;
            const isToday = isCurrentWeek && index === todayIndex;
            
            return (
              <div 
                key={`${animationKey}-${index}`}
                className={`wbc-bar-container ${isToday ? 'today' : ''}`}
              >
                <div 
                  className="wbc-bar"
                  style={{
                    height: `${barHeight}px`,
                    backgroundColor: BAR_COLORS[index],
                    boxShadow: `0 0 20px ${BAR_COLORS[index]}40`,
                    animationDelay: `${index * 0.05}s`,
                  }}
                >
                  {day.focusMinutes > 0 && (
                    <span className="wbc-bar-value">
                      {day.focusMinutes}m
                    </span>
                  )}
                </div>
                <span className={`wbc-bar-label ${isToday ? 'today' : ''}`}>
                  {DAY_LABELS[index]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Best day highlight */}
      {data.bestDay && data.bestDay.minutes > 0 && (
        <div className="wbc-best-day">
          <span className="wbc-best-icon">🏆</span>
          <span>Best: {DAY_LABELS[new Date(data.bestDay.date).getDay() === 0 ? 6 : new Date(data.bestDay.date).getDay() - 1]} with {formatDuration(data.bestDay.minutes)}</span>
        </div>
      )}

      <style>{`
        .weekly-bar-chart {
          background: linear-gradient(180deg, #1a1a25 0%, #141419 100%);
          border: 1px solid #2a2a3a;
          border-radius: 20px;
          padding: 20px;
          overflow: hidden;
        }

        /* Header */
        .wbc-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .wbc-title-section {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .wbc-title {
          margin: 0;
          font-size: 1rem;
          font-weight: 700;
          color: #fafafa;
        }

        .wbc-subtitle {
          font-size: 0.75rem;
          color: #71717a;
        }

        /* Navigation */
        .wbc-navigation {
          display: flex;
          gap: 4px;
        }

        .wbc-nav-btn {
          padding: 6px 12px;
          background: #1e1e2a;
          border: 1px solid #2a2a3a;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #a1a1aa;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .wbc-nav-btn:hover:not(:disabled) {
          background: #2a2a3a;
          color: #fafafa;
        }

        .wbc-nav-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .wbc-nav-today {
          color: #7dd3fc;
        }

        /* Stats */
        .wbc-stats {
          display: flex;
          gap: 24px;
          margin-bottom: 20px;
        }

        .wbc-stat {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .wbc-stat-value {
          font-size: 1.25rem;
          font-weight: 800;
          color: #fafafa;
        }

        .wbc-stat-label {
          font-size: 0.7rem;
          font-weight: 600;
          color: #52525b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* Chart */
        .wbc-chart {
          position: relative;
          padding-left: 40px;
          padding-bottom: 30px;
        }

        /* Grid */
        .wbc-grid {
          position: absolute;
          inset: 0;
          padding-left: 40px;
          padding-bottom: 30px;
        }

        .wbc-grid-line {
          position: absolute;
          left: 40px;
          right: 0;
          height: 1px;
          background: #2a2a3a;
        }

        .wbc-grid-label {
          position: absolute;
          right: calc(100% + 8px);
          transform: translateY(-50%);
          font-size: 0.65rem;
          color: #52525b;
          white-space: nowrap;
        }

        /* Bars */
        .wbc-bars {
          position: relative;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          height: 100%;
          padding: 0 10px;
        }

        .wbc-bar-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          flex: 1;
        }

        .wbc-bar {
          width: 100%;
          max-width: 36px;
          min-height: 4px;
          border-radius: 6px 6px 2px 2px;
          position: relative;
          animation: barGrow 0.6s cubic-bezier(0.16, 1, 0.3, 1) backwards;
        }

        @keyframes barGrow {
          from {
            height: 0 !important;
            opacity: 0;
          }
        }

        .wbc-bar-value {
          position: absolute;
          top: -20px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 0.65rem;
          font-weight: 700;
          color: #a1a1aa;
          white-space: nowrap;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .wbc-bar-container:hover .wbc-bar-value {
          opacity: 1;
        }

        .wbc-bar-label {
          font-size: 0.7rem;
          font-weight: 600;
          color: #52525b;
          transition: color 0.2s ease;
        }

        .wbc-bar-container:hover .wbc-bar-label {
          color: #a1a1aa;
        }

        .wbc-bar-label.today {
          color: #7dd3fc;
          font-weight: 700;
        }

        .wbc-bar-container.today .wbc-bar {
          box-shadow: 0 0 30px currentColor !important;
        }

        /* Best day */
        .wbc-best-day {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 16px;
          padding: 10px;
          background: rgba(255, 217, 61, 0.1);
          border: 1px solid rgba(255, 217, 61, 0.2);
          border-radius: 10px;
          font-size: 0.8rem;
          color: #ffd93d;
        }

        .wbc-best-icon {
          font-size: 1rem;
        }
      `}</style>
    </div>
  );
}

export default WeeklyBarChart;
