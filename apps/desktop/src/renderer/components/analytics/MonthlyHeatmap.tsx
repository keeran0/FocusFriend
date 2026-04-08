/**
 * MonthlyHeatmap - FIXED Cell Size Version
 * Tutorial 15: Production Polish
 *
 * FIXES:
 * - Fixed cell sizes (32x32px max)
 * - Compact layout
 * - Proper overflow handling
 */

import { useState, useEffect, useMemo } from 'react';
import { getMonthlyStats, formatDuration, type MonthlyStats } from './analyticsData';

interface MonthlyHeatmapProps {
  year?: number;
  month?: number;
  showNavigation?: boolean;
  refreshKey?: number;
  className?: string;
}

const INTENSITY_COLORS = [
  '#1A1A1A', // 0 - no activity
  '#1E3A2F', // 1 - very low
  '#236644', // 2 - low
  '#2A9D5A', // 3 - medium
  '#4ADE80', // 4 - high
];

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function MonthlyHeatmap({
  year,
  month,
  showNavigation = true,
  refreshKey = 0,
  className = '',
}: MonthlyHeatmapProps) {
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(year ?? now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(month ?? now.getMonth() + 1);
  const [data, setData] = useState<MonthlyStats | null>(null);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  useEffect(() => {
    setData(getMonthlyStats(currentYear, currentMonth));
  }, [currentYear, currentMonth, refreshKey]);

  const navigate = (delta: number) => {
    let newMonth = currentMonth + delta;
    let newYear = currentYear;
    if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }
    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  const goToToday = () => {
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth() + 1);
  };

  const getIntensity = (minutes: number): number => {
    if (minutes === 0) return 0;
    if (minutes < 15) return 1;
    if (minutes < 30) return 2;
    if (minutes < 60) return 3;
    return 4;
  };

  // Build calendar grid
  const calendarGrid = useMemo(() => {
    if (!data) return [];

    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;

    const weeks: ((typeof data.days)[0] | null)[][] = [];
    let currentWeek: ((typeof data.days)[0] | null)[] = new Array(startDay).fill(null);

    data.days.forEach((day, index) => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null);
      weeks.push(currentWeek);
    }

    return weeks;
  }, [data, currentYear, currentMonth]);

  if (!data) return null;

  const isCurrentMonth = currentYear === now.getFullYear() && currentMonth === now.getMonth() + 1;
  const todayDate = now.getDate();

  return (
    <div className={`mh ${className}`}>
      {/* Header */}
      <div className="mh-header">
        <div className="mh-title-section">
          <h3 className="mh-title">
            {data.monthName} {currentYear}
          </h3>
          <span className="mh-stats">
            {data.activeDays} active days • {formatDuration(data.totalMinutes)} total
          </span>
        </div>
        {showNavigation && (
          <div className="mh-nav">
            <button className="mh-nav-btn" onClick={() => navigate(-1)}>
              ←
            </button>
            <button className="mh-nav-btn" onClick={goToToday}>
              Today
            </button>
            <button className="mh-nav-btn" onClick={() => navigate(1)}>
              →
            </button>
          </div>
        )}
      </div>

      {/* Calendar */}
      <div className="mh-calendar">
        <div className="mh-weekdays">
          {WEEKDAYS.map(day => (
            <span key={day} className="mh-weekday">
              {day}
            </span>
          ))}
        </div>
        <div className="mh-grid">
          {calendarGrid.map((week, wi) => (
            <div key={wi} className="mh-week">
              {week.map((day, di) => {
                if (!day) return <div key={di} className="mh-cell mh-empty" />;

                const dayNum = parseInt(day.date.split('-')[2]);
                const intensity = getIntensity(day.focusMinutes);
                const isToday = isCurrentMonth && dayNum === todayDate;

                return (
                  <div
                    key={di}
                    className={`mh-cell ${isToday ? 'today' : ''}`}
                    style={{ backgroundColor: INTENSITY_COLORS[intensity] }}
                    onMouseEnter={() => setHoveredDay(dayNum)}
                    onMouseLeave={() => setHoveredDay(null)}
                  >
                    <span className="mh-day-num">{dayNum}</span>
                    {hoveredDay === dayNum && (
                      <div className="mh-tooltip">
                        <div className="mh-tooltip-date">
                          {data.monthName} {dayNum}
                        </div>
                        <div className="mh-tooltip-value">{formatDuration(day.focusMinutes)}</div>
                        <div className="mh-tooltip-sessions">
                          {day.sessions} session{day.sessions !== 1 ? 's' : ''}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mh-legend">
        <span>Less</span>
        <div className="mh-legend-scale">
          {INTENSITY_COLORS.map((color, i) => (
            <div key={i} className="mh-legend-cell" style={{ backgroundColor: color }} />
          ))}
        </div>
        <span>More</span>
      </div>

      <style>{`
        .mh {
          background: #1A1A1A;
          border-radius: 10px;
          padding: 12px;
        }

        .mh-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .mh-title-section {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .mh-title {
          margin: 0;
          font-size: 0.9rem;
          font-weight: 600;
          color: #FFFFFF;
        }

        .mh-stats {
          font-size: 0.7rem;
          color: #737373;
        }

        .mh-nav {
          display: flex;
          gap: 4px;
        }

        .mh-nav-btn {
          padding: 4px 10px;
          background: #2A2A2A;
          border: 1px solid #3A3A3A;
          border-radius: 5px;
          font-size: 0.7rem;
          font-weight: 500;
          color: #A3A3A3;
          cursor: pointer;
          transition: all 0.2s;
        }

        .mh-nav-btn:hover {
          background: #3A3A3A;
          color: #FFFFFF;
        }

        /* Calendar Grid */
        .mh-calendar {
          margin-bottom: 10px;
        }

        .mh-weekdays {
          display: grid;
          grid-template-columns: repeat(7, 32px);
          gap: 3px;
          margin-bottom: 4px;
          justify-content: center;
        }

        .mh-weekday {
          text-align: center;
          font-size: 0.6rem;
          font-weight: 600;
          color: #525252;
          text-transform: uppercase;
        }

        .mh-grid {
          display: flex;
          flex-direction: column;
          gap: 3px;
          align-items: center;
        }

        .mh-week {
          display: grid;
          grid-template-columns: repeat(7, 32px);
          gap: 3px;
        }

        /* FIXED: Cell sizes */
        .mh-cell {
          position: relative;
          width: 32px;
          height: 32px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s;
        }

        .mh-empty {
          background: transparent;
          cursor: default;
        }

        .mh-cell:not(.mh-empty):hover {
          transform: scale(1.15);
          z-index: 10;
        }

        .mh-cell.today {
          box-shadow: inset 0 0 0 2px #7DD3FC;
        }

        .mh-day-num {
          font-size: 0.65rem;
          font-weight: 500;
          color: #525252;
          opacity: 0;
          transition: opacity 0.15s;
        }

        .mh-cell:hover .mh-day-num {
          opacity: 1;
          color: #FFFFFF;
        }

        /* Tooltip */
        .mh-tooltip {
          position: absolute;
          bottom: calc(100% + 6px);
          left: 50%;
          transform: translateX(-50%);
          padding: 8px 10px;
          background: #2A2A2A;
          border: 1px solid #3A3A3A;
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          z-index: 100;
          white-space: nowrap;
          pointer-events: none;
        }

        .mh-tooltip-date {
          font-size: 0.7rem;
          font-weight: 600;
          color: #FFFFFF;
          margin-bottom: 2px;
        }

        .mh-tooltip-value {
          font-size: 0.8rem;
          font-weight: 700;
          color: #4ADE80;
        }

        .mh-tooltip-sessions {
          font-size: 0.65rem;
          color: #737373;
        }

        /* Legend */
        .mh-legend {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 0.6rem;
          color: #525252;
        }

        .mh-legend-scale {
          display: flex;
          gap: 2px;
        }

        .mh-legend-cell {
          width: 12px;
          height: 12px;
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}

export default MonthlyHeatmap;
