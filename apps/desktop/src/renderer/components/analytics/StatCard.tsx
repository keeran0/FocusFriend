/**
 * StatCard - Reusable Statistic Card
 * Tutorial 12: Analytics Dashboard
 * 
 * Location: apps/desktop/src/renderer/components/analytics/StatCard.tsx
 * 
 * Displays a single statistic with optional comparison and trend.
 * Vapor Dusk aesthetic.
 */

import { ReactNode } from 'react';

// ============================================
// TYPES
// ============================================

interface StatCardProps {
  /** Card title/label */
  label: string;
  /** Main value to display */
  value: string | number;
  /** Optional icon */
  icon?: string;
  /** Optional comparison value */
  comparison?: {
    value: number;
    label: string;
    trend?: 'up' | 'down' | 'stable';
  };
  /** Card accent color */
  color?: string;
  /** Card size */
  size?: 'small' | 'medium' | 'large';
  /** Custom class name */
  className?: string;
  /** Optional children for custom content */
  children?: ReactNode;
}

// ============================================
// COMPONENT
// ============================================

export function StatCard({
  label,
  value,
  icon,
  comparison,
  color = '#7dd3fc',
  size = 'medium',
  className = '',
  children,
}: StatCardProps) {
  const trendIcon = comparison?.trend === 'up' ? '↑' : comparison?.trend === 'down' ? '↓' : '→';
  const trendColor = comparison?.trend === 'up' ? '#6ee7b7' : comparison?.trend === 'down' ? '#ff6b6b' : '#71717a';

  return (
    <div 
      className={`stat-card size-${size} ${className}`}
      style={{ '--accent-color': color } as React.CSSProperties}
    >
      {/* Glow effect */}
      <div className="sc-glow" />
      
      {/* Header */}
      <div className="sc-header">
        {icon && <span className="sc-icon">{icon}</span>}
        <span className="sc-label">{label}</span>
      </div>

      {/* Value */}
      <div className="sc-value">{value}</div>

      {/* Comparison */}
      {comparison && (
        <div className="sc-comparison">
          <span className="sc-comparison-trend" style={{ color: trendColor }}>
            {trendIcon} {comparison.value > 0 ? '+' : ''}{comparison.value}%
          </span>
          <span className="sc-comparison-label">{comparison.label}</span>
        </div>
      )}

      {/* Custom content */}
      {children && <div className="sc-content">{children}</div>}

      <style>{`
        .stat-card {
          position: relative;
          padding: 16px;
          background: linear-gradient(180deg, #1a1a25 0%, #141419 100%);
          border: 1px solid #2a2a3a;
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.2s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          border-color: var(--accent-color);
        }

        /* Glow */
        .sc-glow {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 3px;
          background: var(--accent-color);
          opacity: 0.5;
        }

        /* Header */
        .sc-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .sc-icon {
          font-size: 1.1rem;
        }

        .sc-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #71717a;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* Value */
        .sc-value {
          font-size: 1.75rem;
          font-weight: 900;
          color: #fafafa;
          line-height: 1.1;
        }

        /* Comparison */
        .sc-comparison {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 8px;
        }

        .sc-comparison-trend {
          font-size: 0.8rem;
          font-weight: 700;
        }

        .sc-comparison-label {
          font-size: 0.7rem;
          color: #52525b;
        }

        /* Custom content */
        .sc-content {
          margin-top: 12px;
        }

        /* Sizes */
        .stat-card.size-small {
          padding: 12px;
        }

        .stat-card.size-small .sc-icon {
          font-size: 0.9rem;
        }

        .stat-card.size-small .sc-label {
          font-size: 0.65rem;
        }

        .stat-card.size-small .sc-value {
          font-size: 1.25rem;
        }

        .stat-card.size-large {
          padding: 24px;
        }

        .stat-card.size-large .sc-icon {
          font-size: 1.5rem;
        }

        .stat-card.size-large .sc-label {
          font-size: 0.85rem;
        }

        .stat-card.size-large .sc-value {
          font-size: 2.5rem;
        }
      `}</style>
    </div>
  );
}

export default StatCard;
