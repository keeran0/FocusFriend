/**
 * Focus Sessions Component - Final Polished Version V3
 * Tutorial 15: Production Polish
 *
 * Updated with:
 * - Tasks feature
 * - Recent Activity feed
 * - Better spacing and layout
 * - Digital clock-style timer display
 * - RE-ADDED: Gamification (Level bar, Points popup, Level up modal, Achievement toasts)
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useActivity } from '../hooks/useActivity';
import {
  FocusWrappedButton,
  saveSession as saveSessionToWrapped,
  getDailyProgress,
  saveDailyProgress,
} from './focusWrapped';
import {
  // Data functions
  awardPointsForSession,
  updateChallengeProgress,
  getLevelForXP,
  // UI Components
  LevelProgressBar,
  PointsPopup,
  LevelUpModal,
  AchievementToast,
  // Types
  type PointsResult,
  type Level,
  type Achievement,
} from './gamification';

interface ActivityStatusProps {
  showDetails?: boolean;
  pendingAction?: 'resume' | 'end' | 'pause' | null;
  onSessionStateChange?: (isActive: boolean) => void;
}

type SessionMode = 'idle' | 'focus' | 'break' | 'paused';

// Constants
const BREAK_DURATION = 5;
const MIN_SESSION_FOR_BREAK = 30;
const FOCUS_PERIOD_TARGET = 25;
const MIN_DURATION = 15;
const MAX_DURATION = 240;
const STEP = 5;

interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

interface RecentActivity {
  id: string;
  type: 'completed' | 'started' | 'ended';
  duration: number;
  timestamp: string;
  label: string;
}

interface SessionSchedule {
  totalMinutes: number;
  focusPeriods: number;
  focusDuration: number;
  breakDuration: number;
  totalBreaks: number;
  schedule: Array<{ type: 'focus' | 'break'; duration: number }>;
}

function calculateSchedule(totalMinutes: number, skipBreaks: boolean = false): SessionSchedule {
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

  const cycleLength = FOCUS_PERIOD_TARGET + BREAK_DURATION;
  let numBreaks = Math.floor((totalMinutes - FOCUS_PERIOD_TARGET) / cycleLength);
  numBreaks = Math.max(0, numBreaks);

  const totalBreakTime = numBreaks * BREAK_DURATION;
  const totalFocusTime = totalMinutes - totalBreakTime;
  const numFocusPeriods = numBreaks + 1;
  const baseFocusDuration = Math.floor(totalFocusTime / numFocusPeriods);
  const extraMinutes = totalFocusTime - baseFocusDuration * numFocusPeriods;

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

interface DailyProgress {
  date: string;
  totalFocusMinutes: number;
  sessionsCompleted: number;
  goalMinutes: number;
  streak: number;
}

function getYesterdayMinutes(): number {
  try {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const sessions = JSON.parse(localStorage.getItem('focus-friend-sessions') || '[]');
    return Math.round(
      sessions
        .filter((s: any) => s.date === yesterday)
        .reduce((acc: number, s: any) => acc + (s.focusTime || s.duration * 60 || 0), 0) / 60
    );
  } catch {
    return 0;
  }
}

function loadTasks(): Task[] {
  try {
    return JSON.parse(localStorage.getItem('focus-friend-tasks') || '[]');
  } catch {
    return [];
  }
}

function saveTasks(tasks: Task[]) {
  localStorage.setItem('focus-friend-tasks', JSON.stringify(tasks));
}

function loadRecentActivity(): RecentActivity[] {
  try {
    const sessions = JSON.parse(localStorage.getItem('focus-friend-sessions') || '[]');
    return sessions
      .slice(-10)
      .reverse()
      .map((s: any) => ({
        id: s.id,
        type: s.completed ? 'completed' : 'ended',
        duration: Math.round((s.focusTime || 0) / 60),
        timestamp: s.endTime || s.startTime,
        label: s.completed ? 'Focus Session' : 'Session',
      }));
  } catch {
    return [];
  }
}

function formatTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return 'just now';
}

export function ActivityStatus({
  showDetails = true,
  pendingAction,
  onSessionStateChange,
}: ActivityStatusProps) {
  const { state, stats, isSessionActive, startSession, endSession, resumeSession, formatIdleTime } =
    useActivity({ autoStart: true });

  const [mode, setMode] = useState<SessionMode>('idle');
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [skipBreaks, setSkipBreaks] = useState(false);
  const [schedule, setSchedule] = useState<SessionSchedule>(() => calculateSchedule(60, false));

  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [phaseTimeRemaining, setPhaseTimeRemaining] = useState(0);
  const [phaseTimeTotal, setPhaseTimeTotal] = useState(0);
  const [totalTimeRemaining, setTotalTimeRemaining] = useState(0);
  const [totalFocusTime, setTotalFocusTime] = useState(0);
  const [totalBreakTime, setTotalBreakTime] = useState(0);

  const [dailyProgress, setDailyProgress] = useState<DailyProgress>(() => getDailyProgress());
  const [yesterdayMinutes, setYesterdayMinutes] = useState(0);

  // Tasks
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks());
  const [newTaskText, setNewTaskText] = useState('');

  // Editable daily goal state
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [editGoalValue, setEditGoalValue] = useState('');

  // Recent Activity
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>(() =>
    loadRecentActivity()
  );

  // === GAMIFICATION STATE (re-added) ===
  const [gamificationRefreshKey, setGamificationRefreshKey] = useState(0);
  const [showPointsPopup, setShowPointsPopup] = useState(false);
  const [pointsResult, setPointsResult] = useState<PointsResult | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{ previous: Level; new: Level } | null>(null);
  const [achievementQueue, setAchievementQueue] = useState<Achievement[]>([]);
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setYesterdayMinutes(getYesterdayMinutes());
  }, []);

  useEffect(() => {
    if (mode === 'idle') {
      const freshProgress = getDailyProgress();
      if (freshProgress.date !== dailyProgress.date) {
        setDailyProgress(freshProgress);
        setYesterdayMinutes(getYesterdayMinutes());
      }
      setRecentActivity(loadRecentActivity());
    }
  }, [mode]);

  useEffect(() => {
    if (mode === 'idle') {
      setSchedule(calculateSchedule(selectedDuration, skipBreaks));
    }
  }, [selectedDuration, skipBreaks, mode]);

  useEffect(() => {
    onSessionStateChange?.(mode !== 'idle' && mode !== 'paused');
  }, [mode, onSessionStateChange]);

  useEffect(() => {
    if (mode === 'idle' || mode === 'paused') {
      clearTimer();
      return;
    }

    timerRef.current = setInterval(() => {
      setTotalTimeRemaining(prev => Math.max(0, prev - 1));
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
    clearTimer();
    setMode('paused');
  }, [clearTimer]);

  // === GAMIFICATION HANDLERS ===
  const handleAwardPoints = useCallback((focusMinutes: number) => {
    if (focusMinutes <= 0) return;

    // Award points through gamification system
    const result = awardPointsForSession(focusMinutes);

    // Update daily challenges
    updateChallengeProgress(focusMinutes);

    // Show points popup
    setPointsResult(result);
    setShowPointsPopup(true);

    // Queue level up if it occurred
    if (result.leveledUp && result.previousLevel && result.newLevel) {
      setLevelUpData({
        previous: result.previousLevel,
        new: result.newLevel,
      });
    }

    // Queue any new achievements
    if (result.newAchievements && result.newAchievements.length > 0) {
      setAchievementQueue(prev => [...prev, ...result.newAchievements]);
    }

    // Refresh the level progress bar
    setGamificationRefreshKey(k => k + 1);
  }, []);

  const handlePointsPopupClose = useCallback(() => {
    setShowPointsPopup(false);
    setPointsResult(null);

    // Show level up modal if queued
    if (levelUpData) {
      setShowLevelUp(true);
    } else if (achievementQueue.length > 0) {
      // Otherwise show first achievement
      setCurrentAchievement(achievementQueue[0]);
      setAchievementQueue(prev => prev.slice(1));
    }
  }, [levelUpData, achievementQueue]);

  const handleLevelUpClose = useCallback(() => {
    setShowLevelUp(false);
    setLevelUpData(null);

    // Show first achievement if queued
    if (achievementQueue.length > 0) {
      setCurrentAchievement(achievementQueue[0]);
      setAchievementQueue(prev => prev.slice(1));
    }
  }, [achievementQueue]);

  const handleAchievementClose = useCallback(() => {
    setCurrentAchievement(null);

    // Show next achievement after a brief delay
    if (achievementQueue.length > 0) {
      setTimeout(() => {
        setCurrentAchievement(achievementQueue[0]);
        setAchievementQueue(prev => prev.slice(1));
      }, 300);
    }
  }, [achievementQueue]);

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
      isBreak ? `Take ${nextPhase.duration} minutes to rest.` : 'Back to focus mode!'
    );
  }, [currentPhaseIndex, schedule]);

  const handleStartSession = async () => {
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
    showNotification('🎯 Focus session started', `${selectedDuration} minutes. Let's go!`);
  };

  const handleSessionComplete = useCallback(() => {
    clearTimer();
    const focusMinutes = Math.round(totalFocusTime / 60);

    const newProgress = {
      ...dailyProgress,
      totalFocusMinutes: dailyProgress.totalFocusMinutes + focusMinutes,
      sessionsCompleted: dailyProgress.sessionsCompleted + 1,
    };
    setDailyProgress(newProgress);
    saveDailyProgress(newProgress);
    saveSessionToWrapped(totalFocusTime, totalBreakTime, selectedDuration, true);

    setMode('idle');
    endSession();
    setRecentActivity(loadRecentActivity());
    showNotification('🎉 Session complete!', `You focused for ${focusMinutes} minutes.`);

    // === AWARD GAMIFICATION POINTS ===
    handleAwardPoints(focusMinutes);
  }, [
    clearTimer,
    totalFocusTime,
    totalBreakTime,
    dailyProgress,
    selectedDuration,
    endSession,
    handleAwardPoints,
  ]);

  const handleEndSession = async () => {
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
      saveSessionToWrapped(totalFocusTime, totalBreakTime, selectedDuration, false);
      showNotification('✅ Session ended', `You focused for ${focusMinutes} minutes.`);
    }

    setMode('idle');
    await endSession();
    setRecentActivity(loadRecentActivity());

    // === AWARD GAMIFICATION POINTS (also when ending early) ===
    handleAwardPoints(focusMinutes);
  };

  const handleResume = async () => {
    const currentPhase = schedule.schedule[currentPhaseIndex];
    setMode(currentPhase?.type || 'focus');
    await resumeSession();
  };

  const handleSkipBreak = useCallback(() => {
    handlePhaseComplete();
  }, [handlePhaseComplete]);

  const showNotification = (title: string, body: string) => {
    window.electronAPI?.showNotification?.(title, body);
  };

  const adjustDuration = (delta: number) => {
    setSelectedDuration(prev => Math.min(MAX_DURATION, Math.max(MIN_DURATION, prev + delta)));
  };

  // Task handlers
  const addTask = () => {
    if (!newTaskText.trim()) return;
    const newTask: Task = {
      id: `task_${Date.now()}`,
      text: newTaskText.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };
    const updated = [...tasks, newTask];
    setTasks(updated);
    saveTasks(updated);
    setNewTaskText('');
  };

  const toggleTask = (id: string) => {
    const updated = tasks.map(t => (t.id === id ? { ...t, completed: !t.completed } : t));
    setTasks(updated);
    saveTasks(updated);
  };

  const deleteTask = (id: string) => {
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated);
    saveTasks(updated);
  };

  // Goal edit handlers
  const startEditingGoal = () => {
    setEditGoalValue(String(dailyProgress.goalMinutes));
    setIsEditingGoal(true);
  };

  const saveGoal = () => {
    const newGoal = parseInt(editGoalValue, 10);
    if (!isNaN(newGoal) && newGoal >= 5 && newGoal <= 1440) {
      const updated = { ...dailyProgress, goalMinutes: newGoal };
      setDailyProgress(updated);
      saveDailyProgress(updated);
    }
    setIsEditingGoal(false);
  };

  const cancelEditingGoal = () => {
    setIsEditingGoal(false);
  };

  // Calculations
  const goalProgress = Math.min(
    100,
    (dailyProgress.totalFocusMinutes / dailyProgress.goalMinutes) * 100
  );
  const completedHours = Math.floor(dailyProgress.totalFocusMinutes / 60);
  const completedMins = dailyProgress.totalFocusMinutes % 60;
  const breaksAvailable = selectedDuration >= MIN_SESSION_FOR_BREAK;

  // Format time display (digital clock style)
  const formatDigitalTime = (minutes: number) => {
    return minutes.toString().padStart(2, '0');
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`focus-dashboard ${mode !== 'idle' ? `mode-${mode}` : ''}`}>
      {/* Welcome Header */}
      <div className="welcome-header">
        <div className="welcome-text">
          <h2>Welcome back, Friend!</h2>
          <p>Your week is off to a great start.</p>
        </div>
      </div>

      {/* === LEVEL PROGRESS BAR (re-added) === */}
      <div className="level-section">
        <LevelProgressBar variant="compact" refreshKey={gamificationRefreshKey} />
      </div>

      {/* Main Grid */}
      <div className="dashboard-grid">
        {/* Timer Card */}
        <div className="card timer-card">
          {mode === 'idle' ? (
            <>
              <div className="card-header">
                <span>Ready to focus?</span>
              </div>

              <div className="digital-timer">
                <span className="digital-value">{formatDigitalTime(selectedDuration)}</span>
                <span className="digital-unit">min</span>
              </div>

              <div className="timer-controls">
                <button
                  className="control-btn"
                  onClick={() => adjustDuration(STEP)}
                  disabled={selectedDuration >= MAX_DURATION}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
                <button
                  className="control-btn"
                  onClick={() => adjustDuration(-STEP)}
                  disabled={selectedDuration <= MIN_DURATION}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 12h14" />
                  </svg>
                </button>

                {breaksAvailable && (
                  <button
                    className={`break-toggle-btn ${!skipBreaks ? 'active' : ''}`}
                    onClick={() => setSkipBreaks(!skipBreaks)}
                  >
                    <span className="toggle-indicator" />
                    {skipBreaks ? 'No breaks' : `${schedule.totalBreaks} break`}
                  </button>
                )}
              </div>

              <button className="start-btn" onClick={handleStartSession}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Start Session
              </button>
            </>
          ) : mode === 'paused' ? (
            <>
              <div className="paused-badge">PAUSED</div>
              <div className="digital-timer paused">
                <span className="digital-value">{formatTimer(phaseTimeRemaining)}</span>
              </div>
              <div className="paused-actions">
                <button className="start-btn" onClick={handleResume}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Resume
                </button>
                <button className="ghost-btn" onClick={handleEndSession}>
                  End Session
                </button>
              </div>
            </>
          ) : (
            <>
              <div className={`mode-badge ${mode}`}>
                {mode === 'break' ? '☕ BREAK' : '🎯 FOCUS'}
              </div>
              <div className={`digital-timer ${mode}`}>
                <span className="digital-value">{formatTimer(phaseTimeRemaining)}</span>
              </div>
              <div className="progress-bar-container">
                <div
                  className="progress-fill"
                  style={{
                    width: `${((phaseTimeTotal - phaseTimeRemaining) / phaseTimeTotal) * 100}%`,
                  }}
                />
              </div>
              <div className="timer-actions">
                {mode === 'break' && (
                  <button className="control-btn small" onClick={handleSkipBreak}>
                    Skip
                  </button>
                )}
                <button className="control-btn small" onClick={handlePause}>
                  Pause
                </button>
                <button className="control-btn small danger" onClick={handleEndSession}>
                  End
                </button>
              </div>
            </>
          )}
        </div>

        {/* Today's Progress Card */}
        <div className="card progress-card">
          <div className="card-header">
            <span>Today's Progress</span>
            <button className="edit-goal-btn" onClick={startEditingGoal} title="Edit daily goal">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          </div>

          <div className="progress-ring-wrapper">
            <svg className="progress-ring" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="var(--border-subtle)"
                strokeWidth="8"
              />
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="var(--accent-green)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray="314"
                strokeDashoffset={314 - (314 * goalProgress) / 100}
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div className="ring-text">
              <span className="ring-percent">{Math.round(goalProgress)}%</span>
              <span className="ring-label">of goal</span>
            </div>
          </div>

          <div className="time-summary">
            {completedHours > 0 ? `${completedHours}h ${completedMins}m` : `${completedMins}m`}
            {isEditingGoal ? (
              <span className="goal-edit-wrap">
                {' / '}
                <input
                  type="number"
                  className="goal-input"
                  value={editGoalValue}
                  onChange={e => setEditGoalValue(e.target.value)}
                  onBlur={saveGoal}
                  onKeyDown={e => {
                    if (e.key === 'Enter') saveGoal();
                    if (e.key === 'Escape') cancelEditingGoal();
                  }}
                  min={5}
                  max={1440}
                  autoFocus
                />
                <span className="goal-unit">min goal</span>
              </span>
            ) : (
              <span className="time-goal">
                {' '}
                / {Math.floor(dailyProgress.goalMinutes / 60)}h {dailyProgress.goalMinutes % 60}m
                goal
              </span>
            )}
          </div>

          <div className="stats-list">
            <div className="stat-row">
              <span className="stat-icon">🕐</span>
              <span className="stat-name">Sessions:</span>
              <span className="stat-value">{dailyProgress.sessionsCompleted}</span>
            </div>
            <div className="stat-row">
              <span className="stat-icon">📅</span>
              <span className="stat-name">Yesterday:</span>
              <span className="stat-value orange">
                {yesterdayMinutes > 0 ? `${Math.floor(yesterdayMinutes / 60)}h` : '0m'}
              </span>
            </div>
            <div className="stat-row">
              <span className="stat-icon">🔥</span>
              <span className="stat-name">Streak:</span>
              <span className="stat-value green">{dailyProgress.streak}</span>
            </div>
          </div>
        </div>

        {/* Recent Activity Card */}
        <div className="card activity-card">
          <div className="card-header">
            <span>Recent Activity</span>
          </div>

          {recentActivity.length === 0 ? (
            <div className="empty-state">
              <p>No sessions yet today</p>
              <span>Start a focus session to see your activity</span>
            </div>
          ) : (
            <div className="activity-list">
              {recentActivity.slice(0, 4).map(activity => (
                <div key={activity.id} className="activity-item">
                  <span className="activity-check">✓</span>
                  <div className="activity-info">
                    <span className="activity-label">
                      {activity.label} ({activity.duration}m)
                    </span>
                    <span className="activity-status">
                      {activity.type === 'completed' ? 'Completed' : 'Ended early'}
                    </span>
                  </div>
                  <span className="activity-time">{formatTimeAgo(activity.timestamp)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tasks Card */}
        <div className="card tasks-card">
          <div className="card-header">
            <span>Your Tasks</span>
          </div>

          <div className="task-input">
            <input
              type="text"
              placeholder="Add a task..."
              value={newTaskText}
              onChange={e => setNewTaskText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTask()}
            />
            <button className="add-task-btn" onClick={addTask}>
              +
            </button>
          </div>

          <div className="task-list">
            {tasks.slice(0, 5).map(task => (
              <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                <button className="task-checkbox" onClick={() => toggleTask(task.id)}>
                  {task.completed && '✓'}
                </button>
                <span className="task-text">{task.text}</span>
                <button className="task-delete" onClick={() => deleteTask(task.id)}>
                  ×
                </button>
              </div>
            ))}
            {tasks.length === 0 && (
              <div className="empty-state small">
                <p>No tasks yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Focus Wrapped Banner */}
      <div className="wrapped-banner">
        <FocusWrappedButton variant="banner" period="week" />
      </div>

      {/* === GAMIFICATION MODALS (re-added) === */}
      {showPointsPopup && pointsResult && (
        <PointsPopup
          result={pointsResult}
          level={getLevelForXP(pointsResult.newTotalXP)}
          onClose={handlePointsPopupClose}
          autoCloseDelay={4000}
        />
      )}

      {showLevelUp && levelUpData && (
        <LevelUpModal
          previousLevel={levelUpData.previous}
          newLevel={levelUpData.new}
          onClose={handleLevelUpClose}
        />
      )}

      {currentAchievement && (
        <AchievementToast achievement={currentAchievement} onClose={handleAchievementClose} />
      )}

      <style>{`
        /* === LAYOUT === */
        .focus-dashboard {
          max-width: 1100px;
          margin: 0 auto;
        }

        /* === WELCOME HEADER === */
        .welcome-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-4, 16px);
        }

        .welcome-text h2 {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary, #FFFFFF);
          margin-bottom: 2px;
        }

        .welcome-text p {
          font-size: 0.85rem;
          color: var(--text-muted, #737373);
        }

        /* === LEVEL SECTION === */
        .level-section {
          margin-bottom: var(--space-5, 20px);
        }

        /* === GRID === */
        .dashboard-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          grid-template-rows: auto auto;
          gap: var(--space-4, 16px);
        }

        @media (max-width: 800px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }

        /* === CARDS === */
        .card {
          background: var(--bg-card, #1A1A1A);
          border: 1px solid var(--border-subtle, #2A2A2A);
          border-radius: var(--radius-xl, 24px);
          padding: var(--space-5, 20px);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-4, 16px);
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-secondary, #A3A3A3);
        }

        /* === TIMER CARD === */
        .timer-card {
          grid-row: 1;
          grid-column: 1;
          text-align: center;
          border-color: rgba(74, 222, 128, 0.2);
        }

        .digital-timer {
          margin: var(--space-6, 24px) 0;
        }

        .digital-value {
          font-family: 'SF Mono', 'Consolas', monospace;
          font-size: 5rem;
          font-weight: 700;
          color: var(--accent-green, #4ADE80);
          letter-spacing: -2px;
          text-shadow: 0 0 30px rgba(74, 222, 128, 0.3);
        }

        .digital-unit {
          font-size: 1.5rem;
          color: var(--text-muted, #737373);
          margin-left: var(--space-2, 8px);
        }

        .digital-timer.paused .digital-value,
        .digital-timer.break .digital-value {
          color: var(--accent-orange, #FB923C);
          text-shadow: 0 0 30px rgba(251, 146, 60, 0.3);
        }

        .timer-controls {
          display: flex;
          justify-content: center;
          gap: var(--space-3, 12px);
          margin-bottom: var(--space-5, 20px);
        }

        .control-btn {
          width: 44px;
          height: 44px;
          background: var(--bg-elevated, #1C1C1C);
          border: 1px solid var(--border-subtle, #2A2A2A);
          border-radius: var(--radius-md, 12px);
          color: var(--text-secondary, #A3A3A3);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .control-btn:hover:not(:disabled) {
          border-color: var(--border-default, #333333);
          color: var(--text-primary, #FFFFFF);
        }

        .control-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .control-btn.small {
          width: auto;
          height: auto;
          padding: var(--space-2, 8px) var(--space-4, 16px);
          font-size: 0.85rem;
        }

        .control-btn.danger {
          border-color: rgba(248, 113, 113, 0.3);
          color: #F87171;
        }

        .break-toggle-btn {
          display: flex;
          align-items: center;
          gap: var(--space-2, 8px);
          padding: var(--space-2, 8px) var(--space-4, 16px);
          background: var(--bg-elevated, #1C1C1C);
          border: 1px solid var(--border-subtle, #2A2A2A);
          border-radius: var(--radius-full, 9999px);
          color: var(--text-secondary, #A3A3A3);
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .break-toggle-btn .toggle-indicator {
          width: 8px;
          height: 8px;
          background: var(--text-muted, #737373);
          border-radius: 50%;
          transition: background 0.2s ease;
        }

        .break-toggle-btn.active .toggle-indicator {
          background: var(--accent-green, #4ADE80);
        }

        .start-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2, 8px);
          padding: var(--space-4, 16px);
          background: var(--accent-green, #4ADE80);
          border: none;
          border-radius: var(--radius-lg, 16px);
          font-size: 1rem;
          font-weight: 600;
          color: var(--bg-base, #0C0C0C);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .start-btn:hover {
          background: #22C55E;
          box-shadow: 0 0 20px rgba(74, 222, 128, 0.3);
        }

        .progress-bar-container {
          height: 4px;
          background: var(--border-subtle, #2A2A2A);
          border-radius: 2px;
          margin: var(--space-4, 16px) 0;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--accent-green, #4ADE80), var(--accent-orange, #FB923C));
          border-radius: 2px;
          transition: width 0.3s ease;
        }

        .timer-actions {
          display: flex;
          justify-content: center;
          gap: var(--space-3, 12px);
        }

        .mode-badge, .paused-badge {
          display: inline-block;
          padding: var(--space-2, 8px) var(--space-4, 16px);
          border-radius: var(--radius-full, 9999px);
          font-size: 0.8rem;
          font-weight: 600;
          margin-bottom: var(--space-3, 12px);
        }

        .mode-badge.focus {
          background: rgba(74, 222, 128, 0.15);
          color: var(--accent-green, #4ADE80);
        }

        .mode-badge.break, .paused-badge {
          background: rgba(251, 146, 60, 0.15);
          color: var(--accent-orange, #FB923C);
        }

        .paused-actions {
          display: flex;
          flex-direction: column;
          gap: var(--space-3, 12px);
        }

        .ghost-btn {
          background: none;
          border: none;
          color: var(--text-muted, #737373);
          font-size: 0.9rem;
          cursor: pointer;
        }

        .ghost-btn:hover {
          color: var(--text-secondary, #A3A3A3);
        }

        /* === PROGRESS CARD === */
        .progress-card {
          grid-row: 1;
          grid-column: 2;
        }

        .progress-ring-wrapper {
          position: relative;
          width: 120px;
          height: 120px;
          margin: 0 auto var(--space-4, 16px);
        }

        .progress-ring {
          width: 100%;
          height: 100%;
        }

        .ring-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
        }

        .ring-percent {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary, #FFFFFF);
        }

        .ring-label {
          font-size: 0.75rem;
          color: var(--text-muted, #737373);
        }

        .time-summary {
          text-align: center;
          font-size: 0.9rem;
          color: var(--text-primary, #FFFFFF);
          margin-bottom: var(--space-4, 16px);
        }

        .time-goal {
          color: var(--text-muted, #737373);
        }

        .edit-goal-btn {
          background: none;
          border: none;
          color: var(--text-muted, #737373);
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .edit-goal-btn:hover {
          color: var(--accent-green, #4ADE80);
          background: rgba(74, 222, 128, 0.1);
        }

        .goal-edit-wrap {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: var(--text-muted, #737373);
        }

        .goal-input {
          width: 60px;
          padding: 2px 8px;
          background: var(--bg-elevated, #1C1C1C);
          border: 1px solid var(--accent-green, #4ADE80);
          border-radius: 6px;
          color: var(--text-primary, #FFFFFF);
          font-size: 0.9rem;
          font-weight: 600;
          text-align: center;
          outline: none;
          -moz-appearance: textfield;
        }

        .goal-input::-webkit-outer-spin-button,
        .goal-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        .goal-unit {
          font-size: 0.85rem;
          color: var(--text-muted, #737373);
        }

        .stats-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-3, 12px);
        }

        .stat-row {
          display: flex;
          align-items: center;
          gap: var(--space-3, 12px);
          padding: var(--space-3, 12px);
          background: var(--bg-elevated, #1C1C1C);
          border-radius: var(--radius-md, 12px);
        }

        .stat-icon {
          font-size: 1rem;
        }

        .stat-name {
          flex: 1;
          font-size: 0.85rem;
          color: var(--text-secondary, #A3A3A3);
        }

        .stat-value {
          font-weight: 600;
          color: var(--text-primary, #FFFFFF);
          padding: var(--space-1, 4px) var(--space-3, 12px);
          background: var(--bg-card, #1A1A1A);
          border-radius: var(--radius-sm, 8px);
        }

        .stat-value.orange { color: var(--accent-orange, #FB923C); }
        .stat-value.green { color: var(--accent-green, #4ADE80); }

        /* === ACTIVITY CARD === */
        .activity-card {
          grid-row: 2;
          grid-column: 1;
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-3, 12px);
        }

        .activity-item {
          display: flex;
          align-items: center;
          gap: var(--space-3, 12px);
        }

        .activity-check {
          width: 24px;
          height: 24px;
          background: rgba(74, 222, 128, 0.15);
          color: var(--accent-green, #4ADE80);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
        }

        .activity-info {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .activity-label {
          font-size: 0.9rem;
          color: var(--text-primary, #FFFFFF);
        }

        .activity-status {
          font-size: 0.75rem;
          color: var(--accent-green, #4ADE80);
        }

        .activity-time {
          font-size: 0.75rem;
          color: var(--text-muted, #737373);
        }

        /* === TASKS CARD === */
        .tasks-card {
          grid-row: 2;
          grid-column: 2;
        }

        .task-input {
          display: flex;
          gap: var(--space-2, 8px);
          margin-bottom: var(--space-4, 16px);
        }

        .task-input input {
          flex: 1;
          padding: var(--space-3, 12px);
          background: var(--bg-elevated, #1C1C1C);
          border: 1px solid var(--border-subtle, #2A2A2A);
          border-radius: var(--radius-md, 12px);
          color: var(--text-primary, #FFFFFF);
          font-size: 0.85rem;
        }

        .task-input input:focus {
          outline: none;
          border-color: var(--accent-green, #4ADE80);
        }

        .task-input input::placeholder {
          color: var(--text-muted, #737373);
        }

        .add-task-btn {
          width: 44px;
          height: 44px;
          background: var(--accent-green, #4ADE80);
          border: none;
          border-radius: var(--radius-md, 12px);
          color: var(--bg-base, #0C0C0C);
          font-size: 1.25rem;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .add-task-btn:hover {
          background: #22C55E;
        }

        .task-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-2, 8px);
        }

        .task-item {
          display: flex;
          align-items: center;
          gap: var(--space-3, 12px);
          padding: var(--space-3, 12px);
          background: var(--bg-elevated, #1C1C1C);
          border-radius: var(--radius-md, 12px);
        }

        .task-item.completed {
          opacity: 0.5;
        }

        .task-item.completed .task-text {
          text-decoration: line-through;
        }

        .task-checkbox {
          width: 20px;
          height: 20px;
          background: var(--bg-card, #1A1A1A);
          border: 1px solid var(--border-default, #333333);
          border-radius: 4px;
          color: var(--accent-green, #4ADE80);
          font-size: 0.75rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .task-item.completed .task-checkbox {
          background: var(--accent-green, #4ADE80);
          border-color: var(--accent-green, #4ADE80);
          color: var(--bg-base, #0C0C0C);
        }

        .task-text {
          flex: 1;
          font-size: 0.85rem;
          color: var(--text-primary, #FFFFFF);
        }

        .task-delete {
          background: none;
          border: none;
          color: var(--text-muted, #737373);
          font-size: 1rem;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .task-item:hover .task-delete {
          opacity: 1;
        }

        .task-delete:hover {
          color: #F87171;
        }

        /* === EMPTY STATE === */
        .empty-state {
          text-align: center;
          padding: var(--space-6, 24px);
          color: var(--text-muted, #737373);
        }

        .empty-state p {
          font-size: 0.9rem;
          margin-bottom: var(--space-2, 8px);
        }

        .empty-state span {
          font-size: 0.75rem;
        }

        .empty-state.small {
          padding: var(--space-4, 16px);
        }

        /* === WRAPPED BANNER === */
        .wrapped-banner {
          margin-top: var(--space-4, 16px);
        }
      `}</style>
    </div>
  );
}

export default ActivityStatus;
