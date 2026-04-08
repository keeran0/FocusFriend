/**
 * Focus Wrapped - Data Service
 * 
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  Location: apps/desktop/src/renderer/components/focusWrapped/  │
 * │            focusWrappedData.ts                                  │
 * └─────────────────────────────────────────────────────────────────┘
 * 
 * This service handles:
 * ✓ Session storage with enhanced metadata (time of day, day of week)
 * ✓ Daily stats history (up to 365 days)
 * ✓ Lifetime statistics tracking
 * ✓ Recap calculations for different time periods
 * ✓ Data export/import functionality
 * ✓ Demo data generation for testing
 * 
 * @example Basic usage
 * ```tsx
 * import { saveSession, calculateRecapStats } from './focusWrappedData';
 * 
 * // Save a completed session
 * saveSession(1800, 300, 30, true); // 30 min focus, 5 min break
 * 
 * // Get monthly recap
 * const stats = calculateRecapStats('month');
 * console.log(`You focused for ${stats.totalFocusHours} hours!`);
 * ```
 */

// ============================================
// TYPE DEFINITIONS
// ============================================

/**
 * Enhanced focus session with metadata for analytics
 */
export interface FocusSession {
  /** Unique session identifier (e.g., "session_1234567890_abc123") */
  id: string;
  /** Date in YYYY-MM-DD format */
  date: string;
  /** ISO timestamp when session started */
  startTime: string;
  /** ISO timestamp when session ended */
  endTime: string;
  /** Total focus time in seconds */
  focusTime: number;
  /** Total break time in seconds */
  breakTime: number;
  /** What user originally selected (in minutes) */
  plannedDuration: number;
  /** Whether the session was completed fully */
  completed: boolean;
  /** Hour of day (0-23) for "most productive time" analysis */
  hourOfDay: number;
  /** Day of week (0=Sunday, 6=Saturday) for "most productive day" analysis */
  dayOfWeek: number;
}

/**
 * Daily aggregated statistics
 */
export interface DailyStats {
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Total focus time for the day in minutes */
  totalFocusMinutes: number;
  /** Number of sessions completed */
  sessionsCompleted: number;
  /** User's daily goal in minutes */
  goalMinutes: number;
  /** Whether user met their goal */
  goalMet: boolean;
  /** Longest session of the day in minutes */
  longestSession: number;
  /** Streak count as of this day */
  streak: number;
}

/**
 * Calculated recap statistics for a given time period
 * Used by the FocusWrapped slideshow
 */
export interface RecapStats {
  // === Time Statistics ===
  /** Total minutes focused in the period */
  totalFocusMinutes: number;
  /** Total hours focused (for display, 1 decimal place) */
  totalFocusHours: number;
  /** Number of sessions completed */
  totalSessions: number;
  /** Average session length in minutes */
  averageSessionMinutes: number;
  /** Longest single session in minutes */
  longestSessionMinutes: number;
  
  // === Streak Statistics ===
  /** Current active streak */
  currentStreak: number;
  /** Best streak achieved ever */
  longestStreak: number;
  /** Number of days with at least one session */
  totalDaysActive: number;
  
  // === Productivity Patterns ===
  /** Most productive day (e.g., "Tuesday") */
  mostProductiveDay: string;
  /** Most productive hour (e.g., "9 PM") */
  mostProductiveHour: string;
  /** Percentage of focus time on most productive day */
  mostProductiveDayPercent: number;
  /** Most commonly selected duration in minutes */
  favoriteSessionDuration: number;
  
  // === Goal Tracking ===
  /** Number of days goal was met */
  daysGoalMet: number;
  /** Percentage of days goal was met */
  goalCompletionRate: number;
  
  // === Gamification (for future integration) ===
  /** Total points earned (1 point per minute) */
  totalPointsEarned: number;
  
  // === Fun Comparisons ===
  /** Equivalent number of ~2 hour movies */
  equivalentMovies: number;
  /** Equivalent number of ~6 hour books */
  equivalentBooks: number;
  /** Equivalent number of ~4 hour marathons */
  equivalentMarathons: number;
  
  // === Period Information ===
  /** Start date of the period (YYYY-MM-DD) */
  periodStart: string;
  /** End date of the period (YYYY-MM-DD) */
  periodEnd: string;
  /** Human-readable label (e.g., "This Month") */
  periodLabel: string;
}

/**
 * Lifetime accumulated statistics (internal use)
 */
interface LifetimeStats {
  totalFocusMinutes: number;
  totalSessions: number;
  longestStreak: number;
  longestSession: number;
  firstSessionDate: string;
}

// ============================================
// STORAGE KEYS
// ============================================

const STORAGE_KEYS = {
  /** All session records */
  SESSIONS: 'focus-friend-sessions',
  /** Daily aggregated stats */
  DAILY_STATS: 'focus-friend-daily-stats',
  /** Current day progress (backward compatible) */
  DAILY_PROGRESS: 'focus-friend-daily-progress',
  /** Cached recap calculations */
  RECAP_CACHE: 'focus-friend-recap-cache',
  /** Lifetime accumulated stats */
  LIFETIME_STATS: 'focus-friend-lifetime-stats',
} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

/** Generate a unique session ID */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/** Get today's date in YYYY-MM-DD format */
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/** Get yesterday's date in YYYY-MM-DD format */
function getYesterdayDate(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

/** Convert hour (0-23) to readable format (e.g., "9 PM") */
function getHourLabel(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

/** Day names for display */
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ============================================
// SESSION STORAGE FUNCTIONS
// ============================================

/**
 * Save a completed focus session with enhanced metadata
 * 
 * This function:
 * 1. Creates a session record with timestamps and metadata
 * 2. Stores it in localStorage
 * 3. Updates daily stats
 * 4. Updates lifetime stats
 * 5. Invalidates recap cache
 * 
 * @param focusSeconds - Total seconds spent focusing
 * @param breakSeconds - Total seconds spent on breaks
 * @param plannedDuration - Originally planned duration in minutes
 * @param completed - Whether the session was completed fully
 * @returns The saved session object
 * 
 * @example
 * ```ts
 * // After a 30-minute session with 5-minute break:
 * const session = saveSession(1800, 300, 30, true);
 * console.log(session.id); // "session_1234567890_abc123"
 * ```
 */
export function saveSession(
  focusSeconds: number,
  breakSeconds: number,
  plannedDuration: number,
  completed: boolean
): FocusSession {
  const now = new Date();
  
  const session: FocusSession = {
    id: generateSessionId(),
    date: now.toISOString().split('T')[0],
    startTime: new Date(now.getTime() - (focusSeconds + breakSeconds) * 1000).toISOString(),
    endTime: now.toISOString(),
    focusTime: focusSeconds,
    breakTime: breakSeconds,
    plannedDuration,
    completed,
    hourOfDay: now.getHours(),
    dayOfWeek: now.getDay(),
  };

  try {
    // Get existing sessions and add new one
    const sessions = getSessions();
    sessions.push(session);
    
    // Keep last 1000 sessions (~3 months of heavy use)
    // This prevents localStorage from growing too large
    if (sessions.length > 1000) {
      sessions.splice(0, sessions.length - 1000);
    }
    
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    
    // Update related stats
    updateDailyStats(session);
    updateLifetimeStats(session);
    
    // Invalidate recap cache since data changed
    invalidateRecapCache();
    
    console.log('[FocusWrapped] Session saved:', session.id);
  } catch (error) {
    console.error('[FocusWrapped] Error saving session:', error);
  }

  return session;
}

/**
 * Get all stored sessions
 * @returns Array of all focus sessions
 */
export function getSessions(): FocusSession[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('[FocusWrapped] Error reading sessions:', error);
    return [];
  }
}

/**
 * Get sessions within a specific date range
 * 
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 * @returns Filtered array of sessions
 */
export function getSessionsInRange(startDate: string, endDate: string): FocusSession[] {
  const sessions = getSessions();
  return sessions.filter(s => s.date >= startDate && s.date <= endDate);
}

/**
 * Get sessions for a predefined time period
 * 
 * @param period - One of: 'week', 'month', 'semester', 'year', 'all'
 * @returns Filtered array of sessions
 */
export function getSessionsForPeriod(
  period: 'week' | 'month' | 'semester' | 'year' | 'all'
): FocusSession[] {
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case 'week':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'semester':
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 4);
      break;
    case 'year':
      startDate = new Date(now);
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    case 'all':
    default:
      return getSessions();
  }

  const startStr = startDate.toISOString().split('T')[0];
  const endStr = now.toISOString().split('T')[0];
  
  return getSessionsInRange(startStr, endStr);
}

// ============================================
// DAILY STATS FUNCTIONS
// ============================================

/**
 * Update daily stats when a session is saved
 * Called automatically by saveSession()
 */
function updateDailyStats(session: FocusSession): void {
  try {
    const allDailyStats = getDailyStatsHistory();
    const today = session.date;
    
    // Find or create today's stats
    let todayStats = allDailyStats.find(d => d.date === today);
    
    if (!todayStats) {
      const progress = getDailyProgress();
      todayStats = {
        date: today,
        totalFocusMinutes: 0,
        sessionsCompleted: 0,
        goalMinutes: progress.goalMinutes,
        goalMet: false,
        longestSession: 0,
        streak: progress.streak,
      };
      allDailyStats.push(todayStats);
    }
    
    // Update stats
    const sessionMinutes = Math.round(session.focusTime / 60);
    todayStats.totalFocusMinutes += sessionMinutes;
    todayStats.sessionsCompleted += 1;
    todayStats.longestSession = Math.max(todayStats.longestSession, sessionMinutes);
    todayStats.goalMet = todayStats.totalFocusMinutes >= todayStats.goalMinutes;
    
    // Keep only last 365 days
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];
    const filtered = allDailyStats.filter(d => d.date >= cutoffStr);
    
    localStorage.setItem(STORAGE_KEYS.DAILY_STATS, JSON.stringify(filtered));
  } catch (error) {
    console.error('[FocusWrapped] Error updating daily stats:', error);
  }
}

/**
 * Get daily stats history (up to 365 days)
 * @returns Array of daily stats records
 */
export function getDailyStatsHistory(): DailyStats[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.DAILY_STATS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('[FocusWrapped] Error reading daily stats:', error);
    return [];
  }
}

/**
 * Get current daily progress
 * Handles streak calculation when day changes
 * 
 * This maintains backward compatibility with the existing
 * focus-friend-daily-progress localStorage key used by ActivityStatus
 */
export function getDailyProgress(): {
  date: string;
  totalFocusMinutes: number;
  sessionsCompleted: number;
  goalMinutes: number;
  streak: number;
} {
  const today = getTodayDate();
  const stored = localStorage.getItem(STORAGE_KEYS.DAILY_PROGRESS);
  
  if (stored) {
    try {
      const data = JSON.parse(stored);
      
      // Same day - return as is
      if (data.date === today) {
        return data;
      }
      
      // New day - calculate streak
      const yesterday = getYesterdayDate();
      let newStreak = 0;
      
      if (data.date === yesterday) {
        // Yesterday exists - continue or reset streak based on goal
        newStreak = data.totalFocusMinutes >= data.goalMinutes 
          ? data.streak + 1 
          : 0;
      }
      // If more than one day gap, streak resets to 0
      
      return {
        date: today,
        totalFocusMinutes: 0,
        sessionsCompleted: 0,
        goalMinutes: data.goalMinutes || 180,
        streak: newStreak,
      };
    } catch (error) {
      console.error('[FocusWrapped] Error parsing daily progress:', error);
    }
  }
  
  // Default values for new users
  return {
    date: today,
    totalFocusMinutes: 0,
    sessionsCompleted: 0,
    goalMinutes: 180, // 3 hours default
    streak: 0,
  };
}

/**
 * Save daily progress
 * Call this when session ends or goal setting changes
 */
export function saveDailyProgress(progress: {
  date: string;
  totalFocusMinutes: number;
  sessionsCompleted: number;
  goalMinutes: number;
  streak: number;
}): void {
  localStorage.setItem(STORAGE_KEYS.DAILY_PROGRESS, JSON.stringify(progress));
}

// ============================================
// LIFETIME STATS FUNCTIONS
// ============================================

/**
 * Update lifetime stats when a session is saved
 * Called automatically by saveSession()
 */
function updateLifetimeStats(session: FocusSession): void {
  try {
    const stats = getLifetimeStats();
    const sessionMinutes = Math.round(session.focusTime / 60);
    
    stats.totalFocusMinutes += sessionMinutes;
    stats.totalSessions += 1;
    stats.longestSession = Math.max(stats.longestSession, sessionMinutes);
    
    if (!stats.firstSessionDate) {
      stats.firstSessionDate = session.date;
    }
    
    // Update longest streak from current progress
    const progress = getDailyProgress();
    stats.longestStreak = Math.max(stats.longestStreak, progress.streak);
    
    localStorage.setItem(STORAGE_KEYS.LIFETIME_STATS, JSON.stringify(stats));
  } catch (error) {
    console.error('[FocusWrapped] Error updating lifetime stats:', error);
  }
}

/**
 * Get lifetime accumulated statistics
 */
export function getLifetimeStats(): LifetimeStats {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.LIFETIME_STATS);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('[FocusWrapped] Error reading lifetime stats:', error);
  }
  
  return {
    totalFocusMinutes: 0,
    totalSessions: 0,
    longestStreak: 0,
    longestSession: 0,
    firstSessionDate: '',
  };
}

// ============================================
// RECAP CACHE FUNCTIONS
// ============================================

/** Invalidate all cached recap calculations */
export function invalidateRecapCache(): void {
  const periods = ['week', 'month', 'semester', 'year', 'all'];
  periods.forEach(period => {
    localStorage.removeItem(`${STORAGE_KEYS.RECAP_CACHE}_${period}`);
  });
  console.log('[FocusWrapped] Recap cache invalidated');
}

// ============================================
// RECAP CALCULATIONS
// ============================================

/**
 * Calculate comprehensive recap statistics for a given time period
 * 
 * This is the main function used by the FocusWrapped slideshow to
 * generate all the statistics displayed on each card.
 * 
 * Results are cached for 1 hour (except 'week' which is always fresh).
 * 
 * @param period - Time period: 'week', 'month', 'semester', 'year', or 'all'
 * @returns RecapStats object with all calculated metrics
 * 
 * @example
 * ```ts
 * const stats = calculateRecapStats('month');
 * console.log(`You focused for ${stats.totalFocusHours} hours this month!`);
 * console.log(`Your most productive day is ${stats.mostProductiveDay}`);
 * ```
 */
export function calculateRecapStats(
  period: 'week' | 'month' | 'semester' | 'year' | 'all'
): RecapStats {
  // Skip cache - always calculate fresh for debugging
  // This helps identify data issues vs cache issues

  // Get data for the period
  const sessions = getSessionsForPeriod(period);
  const dailyStats = getDailyStatsHistory();
  const lifetimeStats = getLifetimeStats();
  
  // Debug logging
  console.log(`[FocusWrapped] calculateRecapStats(${period}):`, {
    allSessionsCount: getSessions().length,
    filteredSessionsCount: sessions.length,
    dailyStatsCount: dailyStats.length,
    sampleSession: sessions[0] || 'none',
    // Add more detail about focusTime values
    focusTimeValues: sessions.slice(0, 3).map(s => ({ 
      focusTime: s.focusTime, 
      date: s.date,
      type: typeof s.focusTime 
    })),
  });
  
  // Determine period dates and label
  const now = new Date();
  let periodStart: Date;
  let periodLabel: string;
  
  switch (period) {
    case 'week':
      periodStart = new Date(now);
      periodStart.setDate(now.getDate() - 7);
      periodLabel = 'This Week';
      break;
    case 'month':
      periodStart = new Date(now);
      periodStart.setMonth(now.getMonth() - 1);
      periodLabel = 'This Month';
      break;
    case 'semester':
      periodStart = new Date(now);
      periodStart.setMonth(now.getMonth() - 4);
      periodLabel = 'This Semester';
      break;
    case 'year':
      periodStart = new Date(now);
      periodStart.setFullYear(now.getFullYear() - 1);
      periodLabel = 'This Year';
      break;
    case 'all':
    default:
      periodStart = lifetimeStats.firstSessionDate 
        ? new Date(lifetimeStats.firstSessionDate)
        : new Date();
      periodLabel = 'All Time';
  }

  // === Calculate Time Statistics ===
  // Handle both old and new session formats
  // Old format might have 'duration' instead of 'focusTime', or focusTime in minutes
  const totalFocusSeconds = sessions.reduce((acc, s) => {
    // Try focusTime first (new format, in seconds)
    if (typeof s.focusTime === 'number' && s.focusTime > 0) {
      return acc + s.focusTime;
    }
    // Fallback: check for 'duration' field (old format, might be in minutes)
    const anySession = s as any;
    if (typeof anySession.duration === 'number' && anySession.duration > 0) {
      // Old format stored duration in minutes, convert to seconds
      return acc + (anySession.duration * 60);
    }
    return acc;
  }, 0);
  
  console.log('[FocusWrapped] Total focus seconds calculated:', totalFocusSeconds);
  
  const totalFocusMinutes = Math.round(totalFocusSeconds / 60);
  const totalFocusHours = Math.round(totalFocusMinutes / 60 * 10) / 10;
  const totalSessions = sessions.length;
  const averageSessionMinutes = totalSessions > 0 
    ? Math.round(totalFocusMinutes / totalSessions) 
    : 0;
  
  // Handle longest session with same fallback logic
  const longestSessionMinutes = sessions.length > 0
    ? Math.round(Math.max(...sessions.map(s => {
        if (typeof s.focusTime === 'number' && s.focusTime > 0) {
          return s.focusTime;
        }
        const anySession = s as any;
        if (typeof anySession.duration === 'number') {
          return anySession.duration * 60;
        }
        return 0;
      })) / 60)
    : 0;

  // === Calculate Streak Statistics ===
  const currentStreak = getDailyProgress().streak;
  const longestStreak = Math.max(lifetimeStats.longestStreak, currentStreak);
  
  // Count unique active days
  const uniqueDays = new Set(sessions.map(s => s.date));
  const totalDaysActive = uniqueDays.size;

  // === Calculate Productivity Patterns ===
  
  // Most productive day of week
  const dayTotals = [0, 0, 0, 0, 0, 0, 0];
  sessions.forEach(s => {
    dayTotals[s.dayOfWeek] += s.focusTime;
  });
  const maxDayIndex = dayTotals.indexOf(Math.max(...dayTotals));
  const mostProductiveDay = DAY_NAMES[maxDayIndex];
  const totalAllDays = dayTotals.reduce((a, b) => a + b, 0);
  const mostProductiveDayPercent = totalAllDays > 0 
    ? Math.round(dayTotals[maxDayIndex] / totalAllDays * 100)
    : 0;

  // Most productive hour
  const hourTotals: number[] = new Array(24).fill(0);
  sessions.forEach(s => {
    hourTotals[s.hourOfDay] += s.focusTime;
  });
  const maxHourIndex = hourTotals.indexOf(Math.max(...hourTotals));
  const mostProductiveHour = getHourLabel(maxHourIndex);

  // Favorite session duration
  const durationCounts: Record<number, number> = {};
  sessions.forEach(s => {
    durationCounts[s.plannedDuration] = (durationCounts[s.plannedDuration] || 0) + 1;
  });
  const sortedDurations = Object.entries(durationCounts).sort((a, b) => b[1] - a[1]);
  const favoriteSessionDuration = sortedDurations.length > 0 
    ? parseInt(sortedDurations[0][0])
    : 30;

  // === Calculate Goal Statistics ===
  const periodStartStr = periodStart.toISOString().split('T')[0];
  const relevantDailyStats = dailyStats.filter(d => d.date >= periodStartStr);
  const daysGoalMet = relevantDailyStats.filter(d => d.goalMet).length;
  const goalCompletionRate = relevantDailyStats.length > 0
    ? Math.round(daysGoalMet / relevantDailyStats.length * 100)
    : 0;

  // === Calculate Points ===
  const totalPointsEarned = totalFocusMinutes;

  // === Calculate Fun Comparisons ===
  const equivalentMovies = Math.round(totalFocusHours / 2 * 10) / 10;
  const equivalentBooks = Math.round(totalFocusHours / 6 * 10) / 10;
  const equivalentMarathons = Math.round(totalFocusHours / 4 * 10) / 10;

  // Build the stats object
  const stats: RecapStats = {
    totalFocusMinutes,
    totalFocusHours,
    totalSessions,
    averageSessionMinutes,
    longestSessionMinutes,
    currentStreak,
    longestStreak,
    totalDaysActive,
    mostProductiveDay,
    mostProductiveHour,
    mostProductiveDayPercent,
    favoriteSessionDuration,
    daysGoalMet,
    goalCompletionRate,
    totalPointsEarned,
    equivalentMovies,
    equivalentBooks,
    equivalentMarathons,
    periodStart: periodStart.toISOString().split('T')[0],
    periodEnd: now.toISOString().split('T')[0],
    periodLabel,
  };

  // Caching disabled for debugging - always return fresh stats
  return stats;
}

// ============================================
// DATA EXPORT / IMPORT
// ============================================

/**
 * Export all Focus Wrapped data as JSON string
 * Useful for backup or transferring to another device
 * 
 * @returns Pretty-printed JSON string of all data
 * 
 * @example
 * ```ts
 * const json = exportData();
 * // Save to file or copy to clipboard
 * navigator.clipboard.writeText(json);
 * ```
 */
export function exportData(): string {
  const data = {
    sessions: getSessions(),
    dailyStats: getDailyStatsHistory(),
    lifetimeStats: getLifetimeStats(),
    dailyProgress: getDailyProgress(),
    exportedAt: new Date().toISOString(),
    version: '1.0',
  };
  
  return JSON.stringify(data, null, 2);
}

/**
 * Import Focus Wrapped data from JSON string
 * 
 * @param jsonString - JSON data to import (from exportData())
 * @returns true if successful, false otherwise
 * 
 * @example
 * ```ts
 * const success = importData(jsonFromFile);
 * if (success) {
 *   console.log('Data imported!');
 * }
 * ```
 */
export function importData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    
    if (data.sessions && Array.isArray(data.sessions)) {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(data.sessions));
    }
    if (data.dailyStats && Array.isArray(data.dailyStats)) {
      localStorage.setItem(STORAGE_KEYS.DAILY_STATS, JSON.stringify(data.dailyStats));
    }
    if (data.lifetimeStats) {
      localStorage.setItem(STORAGE_KEYS.LIFETIME_STATS, JSON.stringify(data.lifetimeStats));
    }
    if (data.dailyProgress) {
      localStorage.setItem(STORAGE_KEYS.DAILY_PROGRESS, JSON.stringify(data.dailyProgress));
    }
    
    invalidateRecapCache();
    
    console.log('[FocusWrapped] Data imported successfully');
    return true;
  } catch (error) {
    console.error('[FocusWrapped] Error importing data:', error);
    return false;
  }
}

// ============================================
// DEMO DATA GENERATION
// ============================================

/**
 * Generate demo data for testing and preview
 * Creates 30 days of realistic-looking session data
 * 
 * Use this during development or to show users a preview
 * of what Focus Wrapped looks like with data.
 * 
 * @example
 * ```ts
 * // Generate demo data
 * generateDemoData();
 * 
 * // Now calculate stats
 * const stats = calculateRecapStats('month');
 * console.log(stats); // Shows realistic demo stats
 * ```
 */
export function generateDemoData(): void {
  const sessions: FocusSession[] = [];
  const now = new Date();
  
  // Generate 30 days of demo data
  for (let daysAgo = 30; daysAgo >= 0; daysAgo--) {
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    const dateStr = date.toISOString().split('T')[0];
    
    // Random sessions per day (0-4, weighted toward 1-2)
    const numSessions = Math.random() < 0.1 ? 0 : Math.floor(Math.random() * 4) + 1;
    
    for (let i = 0; i < numSessions; i++) {
      const hour = 8 + Math.floor(Math.random() * 14); // 8 AM - 10 PM
      const durations = [15, 30, 30, 45, 45, 60, 60, 60, 90, 120];
      const plannedDuration = durations[Math.floor(Math.random() * durations.length)];
      const actualMinutes = plannedDuration * (0.7 + Math.random() * 0.4);
      const focusTime = Math.round(actualMinutes * 60);
      const breakTime = plannedDuration >= 30 ? Math.round(plannedDuration / 6 * 60) : 0;
      
      sessions.push({
        id: generateSessionId(),
        date: dateStr,
        startTime: new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour).toISOString(),
        endTime: new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, actualMinutes).toISOString(),
        focusTime,
        breakTime,
        plannedDuration,
        completed: Math.random() > 0.2,
        hourOfDay: hour,
        dayOfWeek: date.getDay(),
      });
    }
  }
  
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  
  // Build daily stats
  const dailyStats: DailyStats[] = [];
  const dateGroups: Record<string, FocusSession[]> = {};
  
  sessions.forEach(s => {
    if (!dateGroups[s.date]) dateGroups[s.date] = [];
    dateGroups[s.date].push(s);
  });
  
  let streak = 0;
  const sortedDates = Object.keys(dateGroups).sort();
  
  sortedDates.forEach((date, index) => {
    const daySessions = dateGroups[date];
    const totalMinutes = Math.round(daySessions.reduce((acc, s) => acc + s.focusTime, 0) / 60);
    const goalMinutes = 60;
    const goalMet = totalMinutes >= goalMinutes;
    
    if (index > 0) {
      const prevDate = new Date(sortedDates[index - 1]);
      const currDate = new Date(date);
      const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / 86400000);
      
      if (diffDays === 1 && dailyStats[index - 1]?.goalMet) {
        streak = dailyStats[index - 1].streak + 1;
      } else {
        streak = goalMet ? 1 : 0;
      }
    } else {
      streak = goalMet ? 1 : 0;
    }
    
    dailyStats.push({
      date,
      totalFocusMinutes: totalMinutes,
      sessionsCompleted: daySessions.length,
      goalMinutes,
      goalMet,
      longestSession: Math.round(Math.max(...daySessions.map(s => s.focusTime)) / 60),
      streak,
    });
  });
  
  localStorage.setItem(STORAGE_KEYS.DAILY_STATS, JSON.stringify(dailyStats));
  
  // Build lifetime stats
  const lifetimeStats: LifetimeStats = {
    totalFocusMinutes: Math.round(sessions.reduce((acc, s) => acc + s.focusTime, 0) / 60),
    totalSessions: sessions.length,
    longestStreak: Math.max(...dailyStats.map(d => d.streak), 0),
    longestSession: Math.round(Math.max(...sessions.map(s => s.focusTime)) / 60),
    firstSessionDate: sortedDates[0] || '',
  };
  
  localStorage.setItem(STORAGE_KEYS.LIFETIME_STATS, JSON.stringify(lifetimeStats));
  
  // Set today's progress
  const today = getTodayDate();
  const todayStats = dailyStats.find(d => d.date === today);
  
  saveDailyProgress({
    date: today,
    totalFocusMinutes: todayStats?.totalFocusMinutes || 0,
    sessionsCompleted: todayStats?.sessionsCompleted || 0,
    goalMinutes: 60,
    streak: todayStats?.streak || 0,
  });
  
  invalidateRecapCache();
  
  console.log('[FocusWrapped] Demo data generated:', sessions.length, 'sessions');
}

/**
 * Clear all Focus Wrapped data
 * ⚠️ Use with caution - this is irreversible!
 */
export function clearAllData(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  invalidateRecapCache();
  console.log('[FocusWrapped] All data cleared');
}