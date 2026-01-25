/**
 * Activity Status Component
 * Displays current activity state and session statistics
 */

import { useEffect, useRef } from 'react';
import { useActivity } from '../hooks/useActivity';

interface ActivityStatusProps {
  showDetails?: boolean;
}

export function ActivityStatus({ showDetails = true }: ActivityStatusProps) {
  const { state, stats, isMonitoring, isSessionActive, startSession, endSession, formatIdleTime } =
    useActivity({ autoStart: true, idleThreshold: 30 }); // 30s for testing

  // Track if we've already shown the idle notification THIS idle period
  const hasShownIdleNotification = useRef(false);
  // Track previous idle state to detect transitions
  const wasIdle = useRef(false);

  // Show notification ONLY ONCE when transitioning from active to idle
  useEffect(() => {
    if (!state || !isSessionActive) {
      return;
    }

    const isCurrentlyIdle = state.isIdle;

    // Detect transition: was active, now idle
    if (!wasIdle.current && isCurrentlyIdle && !hasShownIdleNotification.current) {
      console.log('[ActivityStatus] Showing idle notification (ONE TIME)');
      hasShownIdleNotification.current = true;

      window.electronAPI?.showNotification(
        '👋 Are you still there?',
        `You've been idle for ${formatIdleTime(state.idleDuration)}. Time to refocus!`
      );
    }

    // Reset notification flag when user becomes active again
    if (wasIdle.current && !isCurrentlyIdle) {
      console.log('[ActivityStatus] User active again, resetting notification flag');
      hasShownIdleNotification.current = false;
    }

    // Update previous state
    wasIdle.current = isCurrentlyIdle;
  }, [state?.isIdle, isSessionActive]); // Only trigger on isIdle changes, not every state update

  const handleToggleSession = async () => {
    if (isSessionActive) {
      const finalStats = await endSession();
      if (finalStats) {
        // Reset notification tracking
        hasShownIdleNotification.current = false;
        wasIdle.current = false;

        window.electronAPI?.showNotification(
          '🎉 Session Complete!',
          `Focus Score: ${finalStats.focusScore}% | Active: ${formatIdleTime(finalStats.activeTime)}`
        );
      }
    } else {
      // Reset notification tracking when starting new session
      hasShownIdleNotification.current = false;
      wasIdle.current = false;
      await startSession();
    }
  };

  return (
    <div className="activity-status">
      <div className="activity-header">
        <h2>Activity Monitor</h2>
        <div className={`status-indicator ${isMonitoring ? 'active' : 'inactive'}`}>
          {isMonitoring ? '● Monitoring' : '○ Stopped'}
        </div>
      </div>

      {/* Current State */}
      <div className="activity-state">
        <div className={`idle-status ${state?.isIdle ? 'idle' : 'active'}`}>
          <span className="status-icon">{state?.isIdle ? '😴' : '🎯'}</span>
          <span className="status-text">{state?.isIdle ? 'Idle' : 'Active'}</span>
        </div>

        {state?.isIdle && (
          <div className="idle-duration">Idle for: {formatIdleTime(state.idleDuration)}</div>
        )}
      </div>

      {/* Session Controls */}
      <div className="session-controls">
        <button
          className={`btn ${isSessionActive ? 'btn-danger' : 'btn-primary'}`}
          onClick={handleToggleSession}
        >
          {isSessionActive ? '⏹ End Session' : '▶ Start Session'}
        </button>
      </div>

      {/* Session Stats */}
      {showDetails && isSessionActive && stats && (
        <div className="session-stats">
          <h3>Session Statistics</h3>

          <div className="focus-score">
            <div
              className="score-circle"
              style={{
                background: `conic-gradient(
                  var(--color-accent) ${stats.focusScore * 3.6}deg,
                  var(--color-bg-secondary) ${stats.focusScore * 3.6}deg
                )`,
              }}
            >
              <div className="score-inner">
                <span className="score-value">{stats.focusScore}</span>
                <span className="score-label">%</span>
              </div>
            </div>
            <span className="score-title">Focus Score</span>
          </div>

          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Total Time</span>
              <span className="stat-value">{formatIdleTime(Math.round(stats.totalTime))}</span>
            </div>
            <div className="stat-item active">
              <span className="stat-label">Active Time</span>
              <span className="stat-value">{formatIdleTime(Math.round(stats.activeTime))}</span>
            </div>
            <div className="stat-item idle">
              <span className="stat-label">Idle Time</span>
              <span className="stat-value">{formatIdleTime(Math.round(stats.idleTime))}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Idle Events</span>
              <span className="stat-value">{stats.idleEvents}</span>
            </div>
          </div>

          {/* Debug info - remove in production */}
          <div className="debug-info">
            <small>
              Active: {Math.round(stats.activeTime)}s | Idle: {Math.round(stats.idleTime)}s | Score:{' '}
              {Math.round((stats.activeTime / Math.max(1, stats.totalTime)) * 100)}%
            </small>
          </div>
        </div>
      )}

      <style>{`
        .activity-status {
          background: var(--color-bg-card);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
          border: 1px solid var(--color-border);
        }

        .activity-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-md);
        }

        .activity-header h2 {
          margin: 0;
          font-size: var(--font-size-lg);
        }

        .status-indicator {
          font-size: var(--font-size-sm);
          padding: var(--spacing-xs) var(--spacing-sm);
          border-radius: var(--radius-sm);
        }

        .status-indicator.active {
          color: var(--color-success);
          background: rgba(74, 222, 128, 0.1);
        }

        .status-indicator.inactive {
          color: var(--color-text-secondary);
          background: rgba(160, 160, 160, 0.1);
        }

        .activity-state {
          text-align: center;
          padding: var(--spacing-lg) 0;
        }

        .idle-status {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-sm);
          font-size: var(--font-size-xl);
          font-weight: 600;
        }

        .idle-status.active {
          color: var(--color-success);
        }

        .idle-status.idle {
          color: var(--color-accent);
        }

        .status-icon {
          font-size: 2rem;
        }

        .idle-duration {
          margin-top: var(--spacing-sm);
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
        }

        .session-controls {
          display: flex;
          justify-content: center;
          margin: var(--spacing-lg) 0;
        }

        .session-stats {
          border-top: 1px solid var(--color-border);
          padding-top: var(--spacing-lg);
        }

        .session-stats h3 {
          margin: 0 0 var(--spacing-md) 0;
          font-size: var(--font-size-base);
          color: var(--color-text-secondary);
        }

        .focus-score {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: var(--spacing-lg);
        }

        .score-circle {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .score-inner {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: var(--color-bg-card);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .score-value {
          font-size: var(--font-size-2xl);
          font-weight: 700;
        }

        .score-label {
          font-size: var(--font-size-sm);
        }

        .score-title {
          margin-top: var(--spacing-sm);
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--spacing-md);
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: var(--spacing-sm);
          background: var(--color-bg-secondary);
          border-radius: var(--radius-md);
        }

        .stat-item.active {
          border-left: 3px solid var(--color-success);
        }

        .stat-item.idle {
          border-left: 3px solid var(--color-accent);
        }

        .stat-label {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .stat-value {
          font-size: var(--font-size-lg);
          font-weight: 600;
          margin-top: var(--spacing-xs);
        }

        .btn-danger {
          background-color: #ef4444;
        }

        .btn-danger:hover {
          background-color: #dc2626;
        }

        .debug-info {
          margin-top: var(--spacing-md);
          padding: var(--spacing-sm);
          background: var(--color-bg-secondary);
          border-radius: var(--radius-sm);
          text-align: center;
          color: var(--color-text-secondary);
        }
      `}</style>
    </div>
  );
}
