/**
 * Activity Status Component
 * Displays current activity state and session statistics
 */

import { useEffect } from 'react';
import { useActivity } from '../hooks/useActivity';

interface ActivityStatusProps {
  showDetails?: boolean;
}

export function ActivityStatus({ showDetails = true }: ActivityStatusProps) {
  const { state, stats, isMonitoring, isSessionActive, startSession, endSession, formatIdleTime } =
    useActivity({ autoStart: true, idleThreshold: 120 });

  // Show notification when idle threshold is reached
  useEffect(() => {
    if (state?.isIdle && isSessionActive && window.electronAPI) {
      window.electronAPI.showNotification(
        '👋 Are you still there?',
        `You've been idle for ${formatIdleTime(state.idleDuration)}. Time to refocus!`
      );
    }
  }, [state?.isIdle, isSessionActive, state?.idleDuration, formatIdleTime]);

  const handleToggleSession = async () => {
    if (isSessionActive) {
      const finalStats = await endSession();
      if (finalStats) {
        window.electronAPI?.showNotification(
          '🎉 Session Complete!',
          `Focus Score: ${finalStats.focusScore}% | Active: ${formatIdleTime(finalStats.activeTime)}`
        );
      }
    } else {
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
            <div className="score-circle">
              <span className="score-value">{stats.focusScore}</span>
              <span className="score-label">%</span>
            </div>
            <span className="score-title">Focus Score</span>
          </div>

          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Total Time</span>
              <span className="stat-value">{formatIdleTime(stats.totalTime)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Active Time</span>
              <span className="stat-value">{formatIdleTime(stats.activeTime)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Idle Time</span>
              <span className="stat-value">{formatIdleTime(stats.idleTime)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Idle Events</span>
              <span className="stat-value">{stats.idleEvents}</span>
            </div>
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
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--color-accent), var(--color-accent-hover));
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
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
      `}</style>
    </div>
  );
}
