/**
 * Focus Sessions Component
 * Microsoft Clock style - adjustable timer with dynamic break calculation
 *
 * Breaks are automatic - user can only pause or end session
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useActivity } from '../hooks/useActivity';

interface ActivityStatusProps {
  showDetails?: boolean;
  pendingAction?: 'resume' | 'end' | 'pause' | null;
  onSessionStateChange?: (isActive: boolean) => void;
}

type SessionMode = 'idle' | 'focus' | 'break' | 'paused';

// Break calculation constants
const BREAK_DURATION = 5; // 5 minute breaks
const MIN_SESSION_FOR_BREAK = 30; // Only add breaks for sessions >= 30 min
const FOCUS_PERIOD_TARGET = 25; // Target focus period length (Pomodoro style)
const MIN_DURATION = 15;
const MAX_DURATION = 240;
const STEP = 5;

interface SessionSchedule {
  totalMinutes: number;
  focusPeriods: number;
  focusDuration: number;
  breakDuration: number;
  totalBreaks: number;
  schedule: Array<{ type: 'focus' | 'break'; duration: number }>;
}

// Calculate optimal session schedule based on total duration
function calculateSchedule(totalMinutes: number, skipBreaks: boolean = false): SessionSchedule {
  // No breaks for short sessions or if user skips breaks
  if (totalMinutes < MIN_SESSION_FOR_BREAK || skipBreaks) {
    return {
      totalMinutes,
      focusPeriods: 1,
      focusDuration: totalMinutes,
      breakDuration: 0,
      totalBreaks: 0,
      schedule: [{ type: 'focus', duration: totalMinutes }],
    };
  }

  // Calculate how many focus+break cycles we can fit
  const cycleLength = FOCUS_PERIOD_TARGET + BREAK_DURATION;

  // Calculate number of complete cycles that fit
  let numBreaks = Math.floor((totalMinutes - FOCUS_PERIOD_TARGET) / cycleLength);
  numBreaks = Math.max(0, numBreaks);

  // Recalculate to ensure we don't exceed total time
  const totalBreakTime = numBreaks * BREAK_DURATION;
  const totalFocusTime = totalMinutes - totalBreakTime;
  const numFocusPeriods = numBreaks + 1;

  // Distribute focus time evenly across periods
  const baseFocusDuration = Math.floor(totalFocusTime / numFocusPeriods);
  const extraMinutes = totalFocusTime - baseFocusDuration * numFocusPeriods;

  // Build the schedule
  const schedule: Array<{ type: 'focus' | 'break'; duration: number }> = [];

  for (let i = 0; i < numFocusPeriods; i++) {
    const thisFocusDuration = baseFocusDuration + (i < extraMinutes ? 1 : 0);
    schedule.push({ type: 'focus', duration: thisFocusDuration });

    if (i < numFocusPeriods - 1) {
      schedule.push({ type: 'break', duration: BREAK_DURATION });
    }
  }

  return {
    totalMinutes,
    focusPeriods: numFocusPeriods,
    focusDuration: baseFocusDuration,
    breakDuration: BREAK_DURATION,
    totalBreaks: numBreaks,
    schedule,
  };
}

// Daily progress storage
interface DailyProgress {
  date: string;
  totalFocusMinutes: number;
  sessionsCompleted: number;
  goalMinutes: number;
  streak: number;
}

function getDailyProgress(): DailyProgress {
  const today = new Date().toISOString().split('T')[0];
  const stored = localStorage.getItem('focus-friend-daily-progress');

  if (stored) {
    try {
      const data = JSON.parse(stored);
      if (data.date === today) {
        return data;
      }
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const newStreak =
        data.date === yesterday && data.totalFocusMinutes >= data.goalMinutes ? data.streak + 1 : 0;
      return {
        date: today,
        totalFocusMinutes: 0,
        sessionsCompleted: 0,
        goalMinutes: data.goalMinutes || 180,
        streak: newStreak,
      };
    } catch (e) {
      console.error('Error parsing daily progress:', e);
    }
  }

  return {
    date: today,
    totalFocusMinutes: 0,
    sessionsCompleted: 0,
    goalMinutes: 180,
    streak: 0,
  };
}

function saveDailyProgress(progress: DailyProgress): void {
  localStorage.setItem('focus-friend-daily-progress', JSON.stringify(progress));
}

function getYesterdayMinutes(): number {
  try {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const sessions = JSON.parse(localStorage.getItem('focus-friend-sessions') || '[]');
    return Math.round(
      sessions
        .filter((s: any) => s.date === yesterday)
        .reduce((acc: number, s: any) => acc + (s.focusTime || 0), 0) / 60
    );
  } catch (e) {
    return 0;
  }
}

export function ActivityStatus({
  showDetails = true,
  pendingAction,
  onSessionStateChange,
}: ActivityStatusProps) {
  const { state, stats, isSessionActive, startSession, endSession, resumeSession, formatIdleTime } =
    useActivity({ autoStart: true });

  // Session configuration state
  const [mode, setMode] = useState<SessionMode>('idle');
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [skipBreaks, setSkipBreaks] = useState(false);
  const [schedule, setSchedule] = useState<SessionSchedule>(() => calculateSchedule(60, false));

  // Timer state
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [phaseTimeRemaining, setPhaseTimeRemaining] = useState(0);
  const [phaseTimeTotal, setPhaseTimeTotal] = useState(0);
  const [totalTimeRemaining, setTotalTimeRemaining] = useState(0);
  const [totalFocusTime, setTotalFocusTime] = useState(0);
  const [totalBreakTime, setTotalBreakTime] = useState(0);

  // Daily progress
  const [dailyProgress, setDailyProgress] = useState<DailyProgress>(getDailyProgress);
  const [yesterdayMinutes, setYesterdayMinutes] = useState(0);

  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load yesterday's data on mount
  useEffect(() => {
    setYesterdayMinutes(getYesterdayMinutes());
  }, []);

  // Update schedule when duration or skipBreaks changes (only in idle mode)
  useEffect(() => {
    if (mode === 'idle') {
      const newSchedule = calculateSchedule(selectedDuration, skipBreaks);
      setSchedule(newSchedule);
    }
  }, [selectedDuration, skipBreaks, mode]);

  // Notify parent of session state changes
  useEffect(() => {
    onSessionStateChange?.(mode !== 'idle');
  }, [mode, onSessionStateChange]);

  // Handle pending actions from parent (overlay clicks)
  useEffect(() => {
    if (!pendingAction) return;

    console.log('[ActivityStatus] Handling pending action:', pendingAction);

    switch (pendingAction) {
      case 'resume':
        handleResume();
        break;
      case 'end':
        handleEndSession();
        break;
      case 'pause':
        handlePause();
        break;
    }
  }, [pendingAction]);

  // Listen for auto-pause events from nudge system
  useEffect(() => {
    if (!window.electronAPI?.activity?.onSessionAutoPaused) return;

    const cleanup = window.electronAPI.activity.onSessionAutoPaused(() => {
      console.log('[ActivityStatus] Session auto-paused by nudge system');
      handlePause();
    });

    return cleanup;
  }, []);

  // Main timer loop
  useEffect(() => {
    if (mode !== 'focus' && mode !== 'break') {
      return;
    }

    timerRef.current = setInterval(() => {
      setTotalTimeRemaining(prev => {
        if (prev <= 1) {
          handleSessionComplete();
          return 0;
        }
        return prev - 1;
      });

      setPhaseTimeRemaining(prev => {
        if (prev <= 1) {
          handlePhaseComplete();
          return 0;
        }
        return prev - 1;
      });

      if (mode === 'focus') {
        setTotalFocusTime(t => t + 1);
      } else {
        setTotalBreakTime(t => t + 1);
      }
    }, 1000);

    return () => clearTimer();
  }, [mode, currentPhaseIndex]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handlePause = useCallback(() => {
    console.log('[ActivityStatus] Pausing session');
    clearTimer();
    setMode('paused');
  }, [clearTimer]);

  const handlePhaseComplete = useCallback(() => {
    const nextIndex = currentPhaseIndex + 1;

    if (nextIndex >= schedule.schedule.length) {
      handleSessionComplete();
      return;
    }

    const nextPhase = schedule.schedule[nextIndex];
    const nextPhaseDuration = nextPhase.duration * 60;

    setCurrentPhaseIndex(nextIndex);
    setPhaseTimeRemaining(nextPhaseDuration);
    setPhaseTimeTotal(nextPhaseDuration);
    setMode(nextPhase.type);

    const isBreak = nextPhase.type === 'break';
    showNotification(
      isBreak ? '☕ Time for a break!' : '⏰ Break over!',
      isBreak
        ? `Take ${nextPhase.duration} minutes to rest and recharge.`
        : 'Back to focus mode! You got this!'
    );
  }, [currentPhaseIndex, schedule]);

  const handleStartSession = async () => {
    console.log(
      '[ActivityStatus] Starting session:',
      selectedDuration,
      'min, skipBreaks:',
      skipBreaks
    );

    const sessionSchedule = calculateSchedule(selectedDuration, skipBreaks);
    setSchedule(sessionSchedule);

    const firstPhaseDuration = sessionSchedule.schedule[0].duration * 60;
    setCurrentPhaseIndex(0);
    setPhaseTimeRemaining(firstPhaseDuration);
    setPhaseTimeTotal(firstPhaseDuration);
    setTotalTimeRemaining(selectedDuration * 60);
    setTotalFocusTime(0);
    setTotalBreakTime(0);

    setMode('focus');

    await startSession();
    showNotification('🎯 Focus session started', `${selectedDuration} minutes. Let's do this!`);
  };

  const handleSessionComplete = useCallback(() => {
    console.log('[ActivityStatus] Session complete');
    clearTimer();

    const focusMinutes = Math.round(totalFocusTime / 60);

    const newProgress = {
      ...dailyProgress,
      totalFocusMinutes: dailyProgress.totalFocusMinutes + focusMinutes,
      sessionsCompleted: dailyProgress.sessionsCompleted + 1,
    };
    setDailyProgress(newProgress);
    saveDailyProgress(newProgress);

    saveSession(focusMinutes, Math.round(totalBreakTime / 60));

    setMode('idle');
    endSession();

    showNotification(
      '🎉 Session complete!',
      `Great work! You focused for ${focusMinutes} minutes.`
    );
  }, [clearTimer, totalFocusTime, totalBreakTime, dailyProgress, endSession]);

  const handleEndSession = async () => {
    console.log('[ActivityStatus] Ending session early');
    clearTimer();

    const focusMinutes = Math.round(totalFocusTime / 60);

    if (focusMinutes > 0) {
      const newProgress = {
        ...dailyProgress,
        totalFocusMinutes: dailyProgress.totalFocusMinutes + focusMinutes,
        sessionsCompleted: dailyProgress.sessionsCompleted + 1,
      };
      setDailyProgress(newProgress);
      saveDailyProgress(newProgress);
      saveSession(focusMinutes, Math.round(totalBreakTime / 60));

      showNotification('✅ Session ended', `You focused for ${focusMinutes} minutes.`);
    }

    setMode('idle');
    await endSession();
  };

  const handleResume = async () => {
    console.log('[ActivityStatus] Resuming session');

    const currentPhase = schedule.schedule[currentPhaseIndex];
    setMode(currentPhase?.type || 'focus');

    await resumeSession();
  };

  const handleSkipBreak = useCallback(() => {
    console.log('[ActivityStatus] Skipping break');
    handlePhaseComplete();
  }, [handlePhaseComplete]);

  const showNotification = (title: string, body: string) => {
    console.log('[ActivityStatus] Notification:', title, body);
    window.electronAPI?.showNotification?.(title, body);
  };

  const saveSession = (focusMinutes: number, breakMinutes: number) => {
    try {
      const sessions = JSON.parse(localStorage.getItem('focus-friend-sessions') || '[]');
      sessions.push({
        date: new Date().toISOString().split('T')[0],
        endTime: new Date().toISOString(),
        focusTime: focusMinutes * 60,
        breakTime: breakMinutes * 60,
        duration: selectedDuration,
        completed: focusMinutes >= selectedDuration - 5,
      });
      if (sessions.length > 100) sessions.shift();
      localStorage.setItem('focus-friend-sessions', JSON.stringify(sessions));
    } catch (e) {
      console.error('Error saving session:', e);
    }
  };

  const adjustDuration = (delta: number) => {
    setSelectedDuration(prev => {
      const newValue = prev + delta;
      return Math.min(MAX_DURATION, Math.max(MIN_DURATION, newValue));
    });
  };

  // Calculate progress percentages
  const phaseProgress =
    phaseTimeTotal > 0 ? ((phaseTimeTotal - phaseTimeRemaining) / phaseTimeTotal) * 100 : 0;

  const totalProgress =
    selectedDuration * 60 > 0
      ? ((selectedDuration * 60 - totalTimeRemaining) / (selectedDuration * 60)) * 100
      : 0;

  // Daily goal calculations
  const goalProgress = Math.min(
    100,
    (dailyProgress.totalFocusMinutes / dailyProgress.goalMinutes) * 100
  );
  const goalHours = Math.floor(dailyProgress.goalMinutes / 60);
  const completedHours = Math.floor(dailyProgress.totalFocusMinutes / 60);
  const completedMins = dailyProgress.totalFocusMinutes % 60;

  const breaksAvailable = selectedDuration >= MIN_SESSION_FOR_BREAK;

  return (
    <div className="focus-sessions">
      {/* Left Panel - Session Setup / Timer */}
      <div className="panel session-panel">
        {mode === 'idle' ? (
          <>
            <div className="panel-header">
              <h2>Get ready to focus</h2>
              <p className="subtitle">
                We'll help you stay on track. For longer sessions, we'll add short breaks so you can
                recharge.
              </p>
            </div>

            {/* Duration Selector */}
            <div className="duration-selector">
              <button
                className="duration-btn up"
                onClick={() => adjustDuration(STEP)}
                disabled={selectedDuration >= MAX_DURATION}
                aria-label="Increase duration"
              >
                <span className="arrow">▲</span>
              </button>

              <div className="duration-display">
                <span className="duration-value">{selectedDuration}</span>
                <span className="duration-unit">mins</span>
              </div>

              <button
                className="duration-btn down"
                onClick={() => adjustDuration(-STEP)}
                disabled={selectedDuration <= MIN_DURATION}
                aria-label="Decrease duration"
              >
                <span className="arrow">▼</span>
              </button>
            </div>

            {/* Break Info */}
            <div className="break-info">
              {breaksAvailable ? (
                <>
                  <p>
                    {skipBreaks
                      ? 'No breaks (you chose to skip them)'
                      : schedule.totalBreaks > 0
                        ? `You'll have ${schedule.totalBreaks} break${schedule.totalBreaks > 1 ? 's' : ''}`
                        : 'No breaks needed for this duration'}
                  </p>

                  <label className="skip-breaks">
                    <input
                      type="checkbox"
                      checked={skipBreaks}
                      onChange={e => setSkipBreaks(e.target.checked)}
                    />
                    <span className="checkbox-custom"></span>
                    <span className="checkbox-label">Skip breaks</span>
                  </label>
                </>
              ) : (
                <p>No breaks for sessions under {MIN_SESSION_FOR_BREAK} minutes</p>
              )}
            </div>

            {/* Schedule Preview */}
            {schedule.totalBreaks > 0 && !skipBreaks && (
              <div className="schedule-preview">
                <p className="schedule-title">Session breakdown:</p>
                <div className="schedule-items">
                  {schedule.schedule.map((phase, i) => (
                    <div key={i} className={`schedule-item ${phase.type}`}>
                      <span className="schedule-icon">{phase.type === 'focus' ? '🎯' : '☕'}</span>
                      <span className="schedule-duration">{phase.duration}m</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button className="btn-start" onClick={handleStartSession}>
              <span className="play-icon">▶</span>
              Start focus session
            </button>
          </>
        ) : mode === 'paused' ? (
          <>
            <div className="panel-header">
              <h2>⏸️ Session Paused</h2>
              <p className="subtitle">
                {formatIdleTime(totalTimeRemaining)} remaining in your session
              </p>
            </div>

            <div className="paused-info">
              <div className="paused-stats">
                <div className="paused-stat">
                  <span className="paused-stat-value">{formatIdleTime(totalFocusTime)}</span>
                  <span className="paused-stat-label">Focus time</span>
                </div>
                <div className="paused-stat">
                  <span className="paused-stat-value">{formatIdleTime(totalBreakTime)}</span>
                  <span className="paused-stat-label">Break time</span>
                </div>
              </div>
            </div>

            <div className="paused-actions">
              <button className="btn-start" onClick={handleResume}>
                <span className="play-icon">▶</span>
                Resume session
              </button>

              <button className="btn-stop" onClick={handleEndSession}>
                End session
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Active Timer */}
            <div className="panel-header">
              <h2>{mode === 'break' ? '☕ Break time' : '🎯 Stay focused'}</h2>
              <p className="subtitle">
                {mode === 'break'
                  ? 'Take a moment to rest your eyes and stretch'
                  : `Focus period ${Math.floor(currentPhaseIndex / 2) + 1} of ${schedule.focusPeriods}`}
              </p>
            </div>

            <div className="timer-display">
              <div className={`timer-ring ${mode}`}>
                <svg viewBox="0 0 200 200">
                  <circle className="timer-bg" cx="100" cy="100" r="85" />
                  <circle
                    className="timer-progress"
                    cx="100"
                    cy="100"
                    r="85"
                    style={{
                      strokeDasharray: 534,
                      strokeDashoffset: 534 - (534 * phaseProgress) / 100,
                    }}
                  />
                </svg>
                <div className="timer-center">
                  <span className="timer-value">{formatIdleTime(phaseTimeRemaining)}</span>
                  <span className="timer-phase">{mode === 'break' ? 'Break' : 'Focus'}</span>
                </div>
              </div>
            </div>

            {/* Overall session progress */}
            <div className="session-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${totalProgress}%` }} />
              </div>
              <div className="progress-labels">
                <span className="progress-text">
                  {formatIdleTime(totalTimeRemaining)} remaining
                </span>
                <span className="progress-percent">{Math.round(totalProgress)}%</span>
              </div>
            </div>

            {/* Session stats during active session */}
            <div className="active-stats">
              <div className="active-stat">
                <span className="active-stat-icon">🎯</span>
                <span className="active-stat-value">{formatIdleTime(totalFocusTime)}</span>
                <span className="active-stat-label">Focused</span>
              </div>
              {totalBreakTime > 0 && (
                <div className="active-stat">
                  <span className="active-stat-icon">☕</span>
                  <span className="active-stat-value">{formatIdleTime(totalBreakTime)}</span>
                  <span className="active-stat-label">Breaks</span>
                </div>
              )}
            </div>

            <div className="timer-actions">
              {mode === 'break' && (
                <button className="btn-secondary" onClick={handleSkipBreak}>
                  ⏭️ Skip break
                </button>
              )}
              <button className="btn-pause" onClick={handlePause}>
                ⏸️ Pause
              </button>
              <button className="btn-stop" onClick={handleEndSession}>
                Stop session
              </button>
            </div>
          </>
        )}
      </div>

      {/* Right Panel - Daily Progress */}
      <div className="panel progress-panel">
        <div className="panel-header">
          <h2>Daily progress</h2>
        </div>

        <div className="progress-ring-container">
          <div className="stats-row">
            <div className="stat-item">
              <span className="stat-value">{yesterdayMinutes}</span>
              <span className="stat-label">Yesterday</span>
              <span className="stat-unit">minutes</span>
            </div>

            <div className="daily-goal-ring">
              <svg viewBox="0 0 160 160">
                <circle className="goal-bg" cx="80" cy="80" r="70" />
                <circle
                  className="goal-progress"
                  cx="80"
                  cy="80"
                  r="70"
                  style={{
                    strokeDasharray: 440,
                    strokeDashoffset: 440 - (440 * goalProgress) / 100,
                  }}
                />
              </svg>
              <div className="goal-center">
                <span className="goal-label">Daily goal</span>
                <span className="goal-value">{goalHours}</span>
                <span className="goal-unit">hours</span>
              </div>
            </div>

            <div className="stat-item">
              <span className="stat-value">{dailyProgress.streak}</span>
              <span className="stat-label">Streak</span>
              <span className="stat-unit">days</span>
            </div>
          </div>

          <p className="completed-text">
            Completed:{' '}
            {completedHours > 0 ? `${completedHours} hour${completedHours !== 1 ? 's' : ''}, ` : ''}
            {completedMins} minute{completedMins !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Goal Setting */}
        <div className="goal-setting">
          <label htmlFor="goal-select">Daily goal:</label>
          <select
            id="goal-select"
            value={dailyProgress.goalMinutes}
            onChange={e => {
              const newGoal = parseInt(e.target.value);
              const newProgress = { ...dailyProgress, goalMinutes: newGoal };
              setDailyProgress(newProgress);
              saveDailyProgress(newProgress);
            }}
          >
            <option value={30}>30 minutes</option>
            <option value={60}>1 hour</option>
            <option value={90}>1.5 hours</option>
            <option value={120}>2 hours</option>
            <option value={180}>3 hours</option>
            <option value={240}>4 hours</option>
            <option value={300}>5 hours</option>
            <option value={360}>6 hours</option>
          </select>
        </div>

        {/* Sessions Today */}
        <div className="sessions-summary">
          <div className="summary-item">
            <span className="summary-icon">📊</span>
            <span className="summary-text">
              <strong>{dailyProgress.sessionsCompleted}</strong> session
              {dailyProgress.sessionsCompleted !== 1 ? 's' : ''} today
            </span>
          </div>
          {dailyProgress.streak > 0 && (
            <div className="summary-item streak">
              <span className="summary-icon">🔥</span>
              <span className="summary-text">
                <strong>{dailyProgress.streak}</strong> day streak!
              </span>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .focus-sessions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-lg);
        }

        @media (max-width: 800px) {
          .focus-sessions {
            grid-template-columns: 1fr;
          }
        }

        .panel {
          background: var(--color-bg-card);
          border-radius: var(--radius-xl);
          padding: var(--spacing-xl);
          border: 1px solid var(--color-border);
        }

        .panel-header {
          margin-bottom: var(--spacing-lg);
        }

        .panel-header h2 {
          font-size: var(--font-size-xl);
          font-weight: 600;
          margin-bottom: var(--spacing-xs);
        }

        .subtitle {
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
          line-height: 1.5;
        }

        /* Duration Selector */
        .duration-selector {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin: var(--spacing-xl) 0;
        }

        .duration-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          padding: var(--spacing-sm) var(--spacing-lg);
          color: var(--color-text-secondary);
          transition: all var(--transition-fast);
          border-radius: var(--radius-md);
        }

        .duration-btn:hover:not(:disabled) {
          color: var(--color-text-primary);
          background: var(--color-bg-hover);
        }

        .duration-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .arrow {
          font-size: 1.2rem;
          display: block;
        }

        .duration-display {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-lg) var(--spacing-2xl);
          background: var(--color-bg-secondary);
          border-radius: var(--radius-lg);
          min-width: 140px;
          border: 2px solid var(--color-border);
          margin: var(--spacing-sm) 0;
        }

        .duration-value {
          font-size: 3.5rem;
          font-weight: 300;
          line-height: 1;
          font-variant-numeric: tabular-nums;
        }

        .duration-unit {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          margin-top: var(--spacing-xs);
        }

        /* Break Info */
        .break-info {
          text-align: center;
          margin-bottom: var(--spacing-lg);
        }

        .break-info > p {
          color: var(--color-text-secondary);
          margin-bottom: var(--spacing-md);
          font-size: var(--font-size-sm);
        }

        .skip-breaks {
          display: inline-flex;
          align-items: center;
          gap: var(--spacing-sm);
          cursor: pointer;
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
          padding: var(--spacing-xs) var(--spacing-sm);
          border-radius: var(--radius-md);
          transition: background var(--transition-fast);
        }

        .skip-breaks:hover {
          background: var(--color-bg-hover);
        }

        .skip-breaks input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: #0078d4;
          cursor: pointer;
        }

        .checkbox-label {
          user-select: none;
        }

        /* Schedule Preview */
        .schedule-preview {
          margin-bottom: var(--spacing-lg);
          padding: var(--spacing-md);
          background: var(--color-bg-secondary);
          border-radius: var(--radius-md);
        }

        .schedule-title {
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
          margin-bottom: var(--spacing-sm);
          text-align: center;
        }

        .schedule-items {
          display: flex;
          justify-content: center;
          gap: var(--spacing-xs);
          flex-wrap: wrap;
        }

        .schedule-item {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: var(--radius-sm);
          font-size: var(--font-size-xs);
          font-weight: 500;
        }

        .schedule-item.focus {
          background: rgba(74, 222, 128, 0.15);
          color: var(--color-success);
        }

        .schedule-item.break {
          background: rgba(96, 165, 250, 0.15);
          color: #60a5fa;
        }

        .schedule-icon {
          font-size: 0.7rem;
        }

        /* Buttons */
        .btn-start {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-sm);
          width: 100%;
          padding: var(--spacing-md) var(--spacing-xl);
          background: #0078d4;
          color: white;
          border: none;
          border-radius: var(--radius-md);
          font-size: var(--font-size-base);
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .btn-start:hover {
          background: #106ebe;
          transform: translateY(-1px);
        }

        .play-icon {
          font-size: 0.75rem;
        }

        .btn-secondary {
          padding: var(--spacing-sm) var(--spacing-lg);
          background: var(--color-bg-secondary);
          color: var(--color-text-primary);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          cursor: pointer;
          font-size: var(--font-size-sm);
          font-weight: 500;
          transition: all var(--transition-fast);
        }

        .btn-secondary:hover {
          background: var(--color-bg-hover);
          border-color: var(--color-text-secondary);
        }

        .btn-pause {
          padding: var(--spacing-sm) var(--spacing-lg);
          background: rgba(251, 191, 36, 0.1);
          color: var(--color-warning);
          border: 1px solid rgba(251, 191, 36, 0.3);
          border-radius: var(--radius-md);
          cursor: pointer;
          font-size: var(--font-size-sm);
          font-weight: 500;
          transition: all var(--transition-fast);
        }

        .btn-pause:hover {
          background: rgba(251, 191, 36, 0.2);
          border-color: var(--color-warning);
        }

        .btn-stop {
          padding: var(--spacing-sm) var(--spacing-lg);
          background: transparent;
          color: var(--color-text-secondary);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          cursor: pointer;
          font-size: var(--font-size-sm);
          transition: all var(--transition-fast);
        }

        .btn-stop:hover {
          color: var(--color-error);
          border-color: var(--color-error);
          background: rgba(239, 68, 68, 0.1);
        }

        /* Paused State */
        .paused-info {
          margin-bottom: var(--spacing-xl);
        }

        .paused-stats {
          display: flex;
          justify-content: center;
          gap: var(--spacing-xl);
        }

        .paused-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: var(--spacing-md);
          background: var(--color-bg-secondary);
          border-radius: var(--radius-md);
          min-width: 100px;
        }

        .paused-stat-value {
          font-size: var(--font-size-xl);
          font-weight: 600;
          font-variant-numeric: tabular-nums;
        }

        .paused-stat-label {
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
        }

        .paused-actions {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        /* Timer Display */
        .timer-display {
          display: flex;
          justify-content: center;
          margin: var(--spacing-lg) 0;
        }

        .timer-ring {
          position: relative;
          width: 200px;
          height: 200px;
        }

        .timer-ring svg {
          width: 100%;
          height: 100%;
          transform: rotate(-90deg);
        }

        .timer-bg {
          fill: none;
          stroke: var(--color-bg-secondary);
          stroke-width: 10;
        }

        .timer-progress {
          fill: none;
          stroke-width: 10;
          stroke-linecap: round;
          transition: stroke-dashoffset 1s linear;
        }

        .timer-ring.focus .timer-progress {
          stroke: var(--color-success);
        }

        .timer-ring.break .timer-progress {
          stroke: #60a5fa;
        }

        .timer-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
        }

        .timer-value {
          display: block;
          font-size: 2.75rem;
          font-weight: 300;
          font-variant-numeric: tabular-nums;
        }

        .timer-phase {
          display: block;
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          margin-top: var(--spacing-xs);
        }

        /* Session Progress */
        .session-progress {
          margin-bottom: var(--spacing-lg);
        }

        .progress-bar {
          height: 6px;
          background: var(--color-bg-secondary);
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: var(--spacing-sm);
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--color-accent) 0%, #ff6b81 100%);
          border-radius: 3px;
          transition: width 1s linear;
        }

        .progress-labels {
          display: flex;
          justify-content: space-between;
        }

        .progress-text, .progress-percent {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        /* Active Stats */
        .active-stats {
          display: flex;
          justify-content: center;
          gap: var(--spacing-xl);
          margin-bottom: var(--spacing-lg);
        }

        .active-stat {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .active-stat-icon {
          font-size: 1rem;
        }

        .active-stat-value {
          font-weight: 600;
          font-variant-numeric: tabular-nums;
        }

        .active-stat-label {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .timer-actions {
          display: flex;
          gap: var(--spacing-md);
          justify-content: center;
        }

        /* Daily Progress Panel */
        .progress-ring-container {
          text-align: center;
        }

        .stats-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--spacing-md);
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 70px;
        }

        .stat-value {
          font-size: var(--font-size-2xl);
          font-weight: 600;
          line-height: 1.2;
        }

        .stat-label {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .stat-unit {
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
        }

        .daily-goal-ring {
          position: relative;
          width: 160px;
          height: 160px;
        }

        .daily-goal-ring svg {
          width: 100%;
          height: 100%;
          transform: rotate(-90deg);
        }

        .goal-bg {
          fill: none;
          stroke: var(--color-bg-secondary);
          stroke-width: 10;
        }

        .goal-progress {
          fill: none;
          stroke: #2dd4bf;
          stroke-width: 10;
          stroke-linecap: round;
          transition: stroke-dashoffset 0.5s ease;
        }

        .goal-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
        }

        .goal-label {
          display: block;
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
        }

        .goal-value {
          display: block;
          font-size: 2.5rem;
          font-weight: 300;
          line-height: 1.1;
        }

        .goal-unit {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .completed-text {
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
          margin-top: var(--spacing-md);
        }

        .goal-setting {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-sm);
          margin-top: var(--spacing-lg);
          padding-top: var(--spacing-lg);
          border-top: 1px solid var(--color-border);
        }

        .goal-setting label {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .goal-setting select {
          padding: var(--spacing-xs) var(--spacing-sm);
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          color: var(--color-text-primary);
          font-size: var(--font-size-sm);
          cursor: pointer;
        }

        .goal-setting select:hover {
          border-color: var(--color-text-secondary);
        }

        /* Sessions Summary */
        .sessions-summary {
          margin-top: var(--spacing-lg);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .summary-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-sm) var(--spacing-md);
          background: var(--color-bg-secondary);
          border-radius: var(--radius-md);
        }

        .summary-item.streak {
          background: rgba(251, 191, 36, 0.1);
          border: 1px solid rgba(251, 191, 36, 0.3);
        }

        .summary-icon {
          font-size: 1rem;
        }

        .summary-text {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .summary-text strong {
          color: var(--color-text-primary);
        }
      `}</style>
    </div>
  );
}
