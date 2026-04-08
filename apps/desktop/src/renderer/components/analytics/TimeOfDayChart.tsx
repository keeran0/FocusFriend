/**
 * TimeOfDayChart - Focus Time Distribution by Hour
 * Tutorial 12: Analytics Dashboard
 * 
 * Location: apps/desktop/src/renderer/components/analytics/TimeOfDayChart.tsx
 * 
 * Shows when the user is most productive throughout the day.
 * Vapor Dusk aesthetic with period breakdown.
 */

import { useState, useEffect } from 'react';
import { getTimeOfDayStats, formatDuration, type TimeOfDayStats } from './analyticsData';

// ============================================
// TYPES
// ============================================

interface TimeOfDayChartProps {
  /** Number of days to analyze */
  days?: number;
  /** Chart variant */
  variant?: 'bars' | 'radial' | 'compact';
  /** Refresh trigger */
  refreshKey?: number;
  /** Custom class name */
  className?: string;
}

// ============================================
// CONSTANTS
// ============================================

const PERIOD_CONFIG = {
  morning: { 
    label: 'Morning', 
    icon: '🌅', 
    range: '5 AM - 12 PM',
    color: '#ffd93d',
    gradient: 'linear-gradient(135deg, #ffd93d 0%, #ffa07a 100%)',
  },
  afternoon: { 
    label: 'Afternoon', 
    icon: '☀️', 
    range: '12 PM - 5 PM',
    color: '#ff6b6b',
    gradient: 'linear-gradient(135deg, #ff6b6b 0%, #ffa07a 100%)',
  },
  evening: { 
    label: 'Evening', 
    icon: '🌆', 
    range: '5 PM - 9 PM',
    color: '#b4a0ff',
    gradient: 'linear-gradient(135deg, #b4a0ff 0%, #c084fc 100%)',
  },
  night: { 
    label: 'Night', 
    icon: '🌙', 
    range: '9 PM - 5 AM',
    color: '#7dd3fc',
    gradient: 'linear-gradient(135deg, #7dd3fc 0%, #60a5fa 100%)',
  },
};

// ============================================
// COMPONENT
// ============================================

export function TimeOfDayChart({
  days = 30,
  variant = 'bars',
  refreshKey = 0,
  className = '',
}: TimeOfDayChartProps) {
  const [data, setData] = useState<TimeOfDayStats | null>(null);

  useEffect(() => {
    setData(getTimeOfDayStats(days));
  }, [days, refreshKey]);

  if (!data) return null;

  const maxMinutes = Math.max(...data.hourly.map(h => h.totalMinutes), 1);
  const preferredConfig = PERIOD_CONFIG[data.preferredPeriod];

  const periodStats = [
    { key: 'morning' as const, minutes: data.morningMinutes },
    { key: 'afternoon' as const, minutes: data.afternoonMinutes },
    { key: 'evening' as const, minutes: data.eveningMinutes },
    { key: 'night' as const, minutes: data.nightMinutes },
  ];

  const totalMinutes = periodStats.reduce((sum, p) => sum + p.minutes, 0);

  return (
    <div className={`time-of-day-chart variant-${variant} ${className}`}>
      {/* Header */}
      <div className="tod-header">
        <div className="tod-title-section">
          <h3 className="tod-title">Time of Day</h3>
          <span className="tod-subtitle">Last {days} days</span>
        </div>

        {/* Preferred time badge */}
        <div 
          className="tod-preferred"
          style={{ background: preferredConfig.gradient }}
        >
          <span className="tod-preferred-icon">{preferredConfig.icon}</span>
          <span className="tod-preferred-text">{preferredConfig.label}</span>
        </div>
      </div>

      {/* Period breakdown */}
      <div className="tod-periods">
        {periodStats.map(({ key, minutes }) => {
          const config = PERIOD_CONFIG[key];
          const percentage = totalMinutes > 0 ? Math.round((minutes / totalMinutes) * 100) : 0;
          const isPreferred = key === data.preferredPeriod;
          
          return (
            <div 
              key={key}
              className={`tod-period ${isPreferred ? 'preferred' : ''}`}
              style={{ '--period-color': config.color } as React.CSSProperties}
            >
              <div className="tod-period-header">
                <span className="tod-period-icon">{config.icon}</span>
                <span className="tod-period-label">{config.label}</span>
              </div>
              <div className="tod-period-value">{formatDuration(minutes)}</div>
              <div className="tod-period-bar">
                <div 
                  className="tod-period-bar-fill"
                  style={{ width: `${percentage}%`, background: config.gradient }}
                />
              </div>
              <div className="tod-period-meta">
                <span className="tod-period-range">{config.range}</span>
                <span className="tod-period-percent">{percentage}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Hourly chart (non-compact) */}
      {variant !== 'compact' && (
        <div className="tod-hourly">
          <div className="tod-hourly-header">
            <span className="tod-hourly-title">Hourly Distribution</span>
            <span className="tod-hourly-peak">
              Peak: {data.peakLabel}
            </span>
          </div>

          <div className="tod-hourly-chart">
            {data.hourly.map((hour, index) => {
              const height = maxMinutes > 0 
                ? (hour.totalMinutes / maxMinutes) * 100 
                : 0;
              const isPeak = index === data.peakHour;
              
              // Determine period color
              let color = '#3a3a4a';
              if (index >= 5 && index < 12) color = PERIOD_CONFIG.morning.color;
              else if (index >= 12 && index < 17) color = PERIOD_CONFIG.afternoon.color;
              else if (index >= 17 && index < 21) color = PERIOD_CONFIG.evening.color;
              else color = PERIOD_CONFIG.night.color;
              
              return (
                <div 
                  key={index}
                  className={`tod-hour-bar ${isPeak ? 'peak' : ''} ${hour.totalMinutes === 0 ? 'empty' : ''}`}
                  style={{ 
                    '--bar-height': `${Math.max(4, height)}%`,
                    '--bar-color': color,
                  } as React.CSSProperties}
                >
                  <div className="tod-hour-fill" />
                  <div className="tod-hour-tooltip">
                    <div className="tod-hour-tooltip-time">{hour.label}</div>
                    <div className="tod-hour-tooltip-value">
                      {formatDuration(hour.totalMinutes)}
                    </div>
                    <div className="tod-hour-tooltip-sessions">
                      {hour.sessions} session{hour.sessions !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Hour labels */}
          <div className="tod-hourly-labels">
            <span>12a</span>
            <span>6a</span>
            <span>12p</span>
            <span>6p</span>
            <span>12a</span>
          </div>
        </div>
      )}

      <style>{`
        .time-of-day-chart {
          background: linear-gradient(180deg, #1a1a25 0%, #141419 100%);
          border: 1px solid #2a2a3a;
          border-radius: 20px;
          padding: 20px;
        }

        /* Header */
        .tod-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }

        .tod-title-section {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .tod-title {
          margin: 0;
          font-size: 1rem;
          font-weight: 700;
          color: #fafafa;
        }

        .tod-subtitle {
          font-size: 0.75rem;
          color: #71717a;
        }

        .tod-preferred {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 20px;
        }

        .tod-preferred-icon {
          font-size: 0.9rem;
        }

        .tod-preferred-text {
          font-size: 0.75rem;
          font-weight: 700;
          color: #0a0a0f;
        }

        /* Periods */
        .tod-periods {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }

        .tod-period {
          padding: 14px;
          background: #1e1e2a;
          border: 1px solid #2a2a3a;
          border-radius: 12px;
          transition: all 0.2s ease;
        }

        .tod-period:hover {
          transform: translateY(-2px);
          border-color: var(--period-color);
        }

        .tod-period.preferred {
          border-color: var(--period-color);
          box-shadow: 0 0 20px color-mix(in srgb, var(--period-color) 30%, transparent);
        }

        .tod-period-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .tod-period-icon {
          font-size: 1.1rem;
        }

        .tod-period-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: #a1a1aa;
        }

        .tod-period-value {
          font-size: 1.25rem;
          font-weight: 800;
          color: #fafafa;
          margin-bottom: 8px;
        }

        .tod-period-bar {
          height: 4px;
          background: #141419;
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .tod-period-bar-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.5s ease;
        }

        .tod-period-meta {
          display: flex;
          justify-content: space-between;
        }

        .tod-period-range,
        .tod-period-percent {
          font-size: 0.65rem;
          color: #52525b;
        }

        .tod-period-percent {
          font-weight: 600;
          color: var(--period-color);
        }

        /* Hourly */
        .tod-hourly {
          padding-top: 16px;
          border-top: 1px solid #2a2a3a;
        }

        .tod-hourly-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .tod-hourly-title {
          font-size: 0.75rem;
          font-weight: 600;
          color: #52525b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .tod-hourly-peak {
          font-size: 0.75rem;
          color: #6ee7b7;
          font-weight: 600;
        }

        .tod-hourly-chart {
          display: flex;
          align-items: flex-end;
          gap: 2px;
          height: 80px;
          margin-bottom: 8px;
        }

        .tod-hour-bar {
          flex: 1;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          position: relative;
        }

        .tod-hour-fill {
          width: 100%;
          height: var(--bar-height);
          background: var(--bar-color);
          border-radius: 2px 2px 0 0;
          transition: height 0.3s ease;
          opacity: 0.7;
        }

        .tod-hour-bar:hover .tod-hour-fill {
          opacity: 1;
        }

        .tod-hour-bar.peak .tod-hour-fill {
          opacity: 1;
          box-shadow: 0 0 10px var(--bar-color);
        }

        .tod-hour-bar.empty .tod-hour-fill {
          background: #2a2a3a;
          opacity: 0.3;
        }

        /* Hour tooltip */
        .tod-hour-tooltip {
          position: absolute;
          bottom: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
          padding: 8px 12px;
          background: #1e1e2a;
          border: 1px solid #2a2a3a;
          border-radius: 8px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
          z-index: 100;
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .tod-hour-bar:hover .tod-hour-tooltip {
          opacity: 1;
        }

        .tod-hour-tooltip-time {
          font-size: 0.7rem;
          font-weight: 600;
          color: #a1a1aa;
          margin-bottom: 2px;
        }

        .tod-hour-tooltip-value {
          font-size: 0.9rem;
          font-weight: 800;
          color: #fafafa;
        }

        .tod-hour-tooltip-sessions {
          font-size: 0.65rem;
          color: #71717a;
        }

        /* Hour labels */
        .tod-hourly-labels {
          display: flex;
          justify-content: space-between;
          padding: 0 2px;
        }

        .tod-hourly-labels span {
          font-size: 0.6rem;
          color: #52525b;
        }

        /* Compact variant */
        .time-of-day-chart.variant-compact .tod-periods {
          grid-template-columns: repeat(4, 1fr);
        }

        .time-of-day-chart.variant-compact .tod-period {
          padding: 10px;
        }

        .time-of-day-chart.variant-compact .tod-period-header {
          margin-bottom: 4px;
        }

        .time-of-day-chart.variant-compact .tod-period-label {
          display: none;
        }

        .time-of-day-chart.variant-compact .tod-period-value {
          font-size: 1rem;
          margin-bottom: 4px;
        }

        .time-of-day-chart.variant-compact .tod-period-meta {
          flex-direction: column;
          gap: 2px;
        }

        .time-of-day-chart.variant-compact .tod-period-range {
          display: none;
        }
      `}</style>
    </div>
  );
}

export default TimeOfDayChart;
