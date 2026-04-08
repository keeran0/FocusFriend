/**
 * Focus Wrapped Button - Vapor Dusk Edition
 * Entry points to launch the recap experience
 */

import { useState } from 'react';
import { FocusWrapped } from './FocusWrapped';
import { calculateRecapStats } from './focusWrappedData';

type RecapPeriod = 'week' | 'month' | 'semester' | 'year';

interface FocusWrappedButtonProps {
  variant?: 'full' | 'compact' | 'mini';
  period?: RecapPeriod;
}

export function FocusWrappedButton({
  variant = 'full',
  period = 'month',
}: FocusWrappedButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const stats = calculateRecapStats(period);

  // Mini variant - icon button
  if (variant === 'mini') {
    return (
      <>
        <button
          className="wrapped-btn-mini"
          onClick={() => setIsOpen(true)}
          title="View Focus Wrapped"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M10 2L12.5 7.5L18 8.5L14 12.5L15 18L10 15L5 18L6 12.5L2 8.5L7.5 7.5L10 2Z"
              fill="currentColor"
            />
          </svg>
        </button>
        <FocusWrapped isOpen={isOpen} onClose={() => setIsOpen(false)} period={period} />

        <style>{`
          .wrapped-btn-mini {
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: none;
            background: linear-gradient(135deg, #ff6b6b 0%, #ffa07a 50%, #ffd93d 100%);
            border-radius: 10px;
            color: #0a0a0f;
            cursor: pointer;
            transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
          }

          .wrapped-btn-mini:hover {
            transform: scale(1.1) rotate(5deg);
            box-shadow: 0 8px 25px rgba(255, 107, 107, 0.4);
          }

          .wrapped-btn-mini:active {
            transform: scale(0.95);
          }
        `}</style>
      </>
    );
  }

  // Compact variant - horizontal button
  if (variant === 'compact') {
    return (
      <>
        <button className="wrapped-btn-compact" onClick={() => setIsOpen(true)}>
          <div className="wrapped-icon-wrapper">
            <span className="wrapped-icon">✨</span>
          </div>
          <div className="wrapped-text">
            <span className="wrapped-title">Focus Wrapped</span>
            <span className="wrapped-subtitle">
              {stats.totalFocusHours}h focused this {period}
            </span>
          </div>
          <svg className="wrapped-arrow" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M8 4l6 6-6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <FocusWrapped isOpen={isOpen} onClose={() => setIsOpen(false)} period={period} />

        <style>{`
          .wrapped-btn-compact {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 14px 18px;
            background: linear-gradient(135deg, rgba(255, 107, 107, 0.08) 0%, rgba(255, 217, 61, 0.08) 100%);
            border: 1px solid rgba(255, 107, 107, 0.2);
            border-radius: 14px;
            cursor: pointer;
            transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
            width: 100%;
            text-align: left;
          }

          .wrapped-btn-compact:hover {
            background: linear-gradient(135deg, rgba(255, 107, 107, 0.15) 0%, rgba(255, 217, 61, 0.15) 100%);
            border-color: rgba(255, 107, 107, 0.4);
            transform: translateX(4px);
          }

          .wrapped-icon-wrapper {
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #ff6b6b 0%, #ffa07a 100%);
            border-radius: 10px;
            flex-shrink: 0;
          }

          .wrapped-icon {
            font-size: 20px;
          }

          .wrapped-text {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-width: 0;
          }

          .wrapped-title {
            font-family: var(--font-display, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif);
            font-weight: 600;
            color: var(--text-bright, #fafafa);
            font-size: 14px;
          }

          .wrapped-subtitle {
            font-size: 12px;
            color: var(--text-secondary, #a1a1aa);
            margin-top: 2px;
          }

          .wrapped-arrow {
            color: var(--sun-coral, #ff6b6b);
            flex-shrink: 0;
            transition: transform 0.2s ease;
          }

          .wrapped-btn-compact:hover .wrapped-arrow {
            transform: translateX(4px);
          }
        `}</style>
      </>
    );
  }

  // Full variant - promotional card
  return (
    <>
      <button className="wrapped-btn-full" onClick={() => setIsOpen(true)}>
        <div className="wrapped-card-bg" />
        <div className="wrapped-card-glow" />
        <div className="wrapped-card-noise" />

        <div className="wrapped-card-content">
          <div className="wrapped-badge">✨ NEW</div>
          <div className="wrapped-emoji">🎁</div>
          <h3 className="wrapped-heading">Your Focus Wrapped</h3>
          <p className="wrapped-desc">
            See your {period === 'week' ? 'weekly' : period === 'month' ? 'monthly' : period}{' '}
            journey
          </p>

          <div className="wrapped-preview">
            <div className="preview-stat">
              <span className="preview-value">{stats.totalFocusHours}h</span>
              <span className="preview-label">Focused</span>
            </div>
            <div className="preview-divider" />
            <div className="preview-stat">
              <span className="preview-value">{stats.totalSessions}</span>
              <span className="preview-label">Sessions</span>
            </div>
            <div className="preview-divider" />
            <div className="preview-stat">
              <span className="preview-value">{stats.longestStreak}</span>
              <span className="preview-label">Streak</span>
            </div>
          </div>

          <div className="wrapped-cta">
            View Your Wrapped
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M6 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </button>
      <FocusWrapped isOpen={isOpen} onClose={() => setIsOpen(false)} period={period} />

      <style>{`
        .wrapped-btn-full {
          position: relative;
          width: 100%;
          padding: 0;
          border: none;
          border-radius: 20px;
          overflow: hidden;
          cursor: pointer;
          text-align: center;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .wrapped-btn-full:hover {
          transform: translateY(-4px);
        }

        .wrapped-card-bg {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #ff6b6b 0%, #ffa07a 25%, #ffd93d 50%, #6ee7b7 75%, #7dd3fc 100%);
          background-size: 300% 300%;
          animation: gradientShift 8s ease infinite;
        }

        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .wrapped-card-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.3) 0%, transparent 50%);
        }

        .wrapped-card-noise {
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          opacity: 0.05;
          pointer-events: none;
        }

        .wrapped-card-content {
          position: relative;
          z-index: 1;
          padding: 32px 28px;
          color: #0a0a0f;
        }

        .wrapped-badge {
          display: inline-block;
          padding: 6px 14px;
          background: rgba(10, 10, 15, 0.15);
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.05em;
          margin-bottom: 16px;
        }

        .wrapped-emoji {
          font-size: 52px;
          margin-bottom: 16px;
          animation: float 3s ease-in-out infinite;
          filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.2));
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        .wrapped-heading {
          font-family: var(--font-display, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif);
          font-size: 24px;
          font-weight: 700;
          font-stretch: 105%;
          margin-bottom: 8px;
        }

        .wrapped-desc {
          font-size: 14px;
          opacity: 0.8;
          margin-bottom: 24px;
        }

        .wrapped-preview {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 20px;
          margin-bottom: 24px;
          padding: 16px 20px;
          background: rgba(10, 10, 15, 0.1);
          border-radius: 14px;
          backdrop-filter: blur(10px);
        }

        .preview-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .preview-value {
          font-family: var(--font-display, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif);
          font-size: 26px;
          font-weight: 700;
        }

        .preview-label {
          font-size: 11px;
          opacity: 0.7;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 2px;
        }

        .preview-divider {
          width: 1px;
          height: 32px;
          background: rgba(10, 10, 15, 0.2);
        }

        .wrapped-cta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 28px;
          background: rgba(10, 10, 15, 0.9);
          color: white;
          font-weight: 600;
          font-size: 14px;
          border-radius: 25px;
          transition: all 0.25s ease;
        }

        .wrapped-btn-full:hover .wrapped-cta {
          transform: scale(1.05);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </>
  );
}

// Weekly Recap Card
export function WeeklyRecapCard() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const stats = calculateRecapStats('week');

  const today = new Date().getDay();
  const isSunday = today === 0;
  const hasEnoughData = stats.totalSessions >= 3;

  if (isDismissed || (!isSunday && !hasEnoughData)) {
    return null;
  }

  return (
    <>
      <div className="weekly-recap-card">
        <button className="dismiss-btn" onClick={() => setIsDismissed(true)} aria-label="Dismiss">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M12 4L4 12M4 4l8 8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="recap-icon-wrapper">
          <span className="recap-icon">📊</span>
        </div>

        <div className="recap-content">
          <h4>Your Week in Focus</h4>
          <p>
            <strong>{stats.totalFocusHours}h</strong> across{' '}
            <strong>{stats.totalSessions} sessions</strong>
          </p>
        </div>

        <button className="view-btn" onClick={() => setIsOpen(true)}>
          View
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M5 3l4 4-4 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      <FocusWrapped isOpen={isOpen} onClose={() => setIsOpen(false)} period="week" />

      <style>{`
        .weekly-recap-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 20px;
          background: linear-gradient(135deg, rgba(180, 160, 255, 0.08) 0%, rgba(125, 211, 252, 0.08) 100%);
          border: 1px solid rgba(180, 160, 255, 0.2);
          border-radius: 16px;
          position: relative;
          margin-bottom: 24px;
          animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .weekly-recap-card .dismiss-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: transparent;
          color: var(--text-muted, #71717a);
          cursor: pointer;
          opacity: 0.5;
          transition: all 0.2s ease;
          padding: 0;
          border-radius: 6px;
        }

        .weekly-recap-card .dismiss-btn:hover {
          opacity: 1;
          background: rgba(255, 255, 255, 0.05);
        }

        .recap-icon-wrapper {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #b4a0ff 0%, #7dd3fc 100%);
          border-radius: 12px;
          flex-shrink: 0;
        }

        .recap-icon {
          font-size: 22px;
        }

        .recap-content {
          flex: 1;
          min-width: 0;
        }

        .recap-content h4 {
          font-family: var(--font-display, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif);
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 4px 0;
          color: var(--text-bright, #fafafa);
        }

        .recap-content p {
          font-size: 13px;
          color: var(--text-secondary, #a1a1aa);
          margin: 0;
        }

        .recap-content strong {
          color: var(--twilight-lavender, #b4a0ff);
        }

        .view-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 18px;
          background: linear-gradient(135deg, #b4a0ff 0%, #7dd3fc 100%);
          border: none;
          color: #0a0a0f;
          font-size: 13px;
          font-weight: 600;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.25s ease;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .view-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 20px rgba(180, 160, 255, 0.3);
        }
      `}</style>
    </>
  );
}
