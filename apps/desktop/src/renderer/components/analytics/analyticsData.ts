/**
 * analyticsData.ts - Complete Analytics Data Service
 * Fixed version with correct all-time calculation
 */

// ============================================
// TYPES
// ============================================

export interface DailyStats {
  date: string;
  focusMinutes: number;
  sessions: number;
  avgSessionLength: number;
  longestSession: number;
  completedSessions: number;
}

export interface WeeklyStats {
  weekStart: string;
  weekEnd: string;
  days: DailyStats[];
  totalMinutes: number;
  totalSessions: number;
  avgDailyMinutes: number;
  activeDays: number;
  bestDay: { date: string; minutes: number } | null;
}

export interface MonthlyStats {
  year: number;
  month: number;
  monthName: string;
  days: DailyStats[];
  totalMinutes: number;
  totalSessions: number;
  avgDailyMinutes: number;
  activeDays: number;
  weeklyTrend: number[];
}

export interface HourlyDistribution {
  hour: number;
  label: string;
  totalMinutes: number;
  sessions: number;
  percentage: number;
}

export interface TimeOfDayStats {
  hourly: HourlyDistribution[];
  peakHour: number;
  peakLabel: string;
  morningMinutes: number;
  afternoonMinutes: number;
  eveningMinutes: number;
  nightMinutes: number;
  preferredPeriod: 'morning' | 'afternoon' | 'evening' | 'night';
}

export interface ProductivityTrend {
  period: 'week' | 'month' | 'quarter';
  data: { label: string; value: number }[];
  trend: 'up' | 'down' | 'stable';
  percentChange: number;
}

export interface AnalyticsSummary {
  today: DailyStats;
  thisWeek: WeeklyStats;
  thisMonth: MonthlyStats;
  timeOfDay: TimeOfDayStats;
  streak: { current: number; longest: number; lastActiveDate: string };
  allTime: {
    totalMinutes: number;
    totalSessions: number;
    totalDays: number;
    avgDailyMinutes: number;
  };
}

interface StoredSession {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  focusTime: number;
  breakTime: number;
  plannedDuration: number;
  completed: boolean;
  hourOfDay: number;
  dayOfWeek?: number;
}

interface StoredDailyStats {
  totalFocusTime: number;
  sessionCount?: number;
  completedSessions?: number;
  longestSession: number;
}

const STORAGE_KEYS = {
  sessions: 'focus-friend-sessions',
  dailyStats: 'focus-friend-daily-stats',
  lifetimeStats: 'focus-friend-lifetime-stats',
};

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const formatHourLabel = (hour: number): string => {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
};

const getDateString = (date: Date): string => date.toISOString().split('T')[0];

const parseDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const getMonday = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
};

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const getDaysInMonth = (year: number, month: number): number => new Date(year, month, 0).getDate();

const loadSessions = (): StoredSession[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.sessions);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const loadDailyStats = (): Record<string, StoredDailyStats> => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.dailyStats);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

export function getDailyStats(dateStr?: string): DailyStats {
  const targetDate = dateStr || getDateString(new Date());
  const sessions = loadSessions().filter(s => s.date === targetDate);
  const focusSeconds = sessions.reduce((sum, s) => sum + s.focusTime, 0);
  const focusMinutes = Math.round(focusSeconds / 60);
  const sessionCount = sessions.length;
  const completedCount = sessions.filter(s => s.completed).length;
  const longestSession = sessions.length > 0 ? Math.max(...sessions.map(s => s.focusTime)) / 60 : 0;

  return {
    date: targetDate,
    focusMinutes,
    sessions: sessionCount,
    avgSessionLength: sessionCount > 0 ? Math.round(focusMinutes / sessionCount) : 0,
    longestSession: Math.round(longestSession),
    completedSessions: completedCount,
  };
}

export function getWeeklyStats(weekOffset = 0): WeeklyStats {
  const today = new Date();
  const targetWeekStart = getMonday(addDays(today, weekOffset * 7));
  const targetWeekEnd = addDays(targetWeekStart, 6);

  const days: DailyStats[] = [];
  for (let i = 0; i < 7; i++) {
    days.push(getDailyStats(getDateString(addDays(targetWeekStart, i))));
  }

  const totalMinutes = days.reduce((sum, d) => sum + d.focusMinutes, 0);
  const totalSessions = days.reduce((sum, d) => sum + d.sessions, 0);
  const activeDays = days.filter(d => d.focusMinutes > 0).length;
  const bestDay = days.reduce<{ date: string; minutes: number } | null>((best, d) => {
    if (d.focusMinutes > (best?.minutes ?? 0)) return { date: d.date, minutes: d.focusMinutes };
    return best;
  }, null);

  return {
    weekStart: getDateString(targetWeekStart),
    weekEnd: getDateString(targetWeekEnd),
    days,
    totalMinutes,
    totalSessions,
    avgDailyMinutes: activeDays > 0 ? Math.round(totalMinutes / activeDays) : 0,
    activeDays,
    bestDay,
  };
}

export function getMonthlyStats(year?: number, month?: number): MonthlyStats {
  const now = new Date();
  const targetYear = year ?? now.getFullYear();
  const targetMonth = month ?? now.getMonth() + 1;
  const daysInMonth = getDaysInMonth(targetYear, targetMonth);
  const days: DailyStats[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    days.push(getDailyStats(dateStr));
  }

  const totalMinutes = days.reduce((sum, d) => sum + d.focusMinutes, 0);
  const totalSessions = days.reduce((sum, d) => sum + d.sessions, 0);
  const activeDays = days.filter(d => d.focusMinutes > 0).length;

  const weeklyTrend: number[] = [];
  for (let w = 0; w < 4; w++) {
    const startDay = w * 7;
    const endDay = Math.min(startDay + 7, daysInMonth);
    weeklyTrend.push(days.slice(startDay, endDay).reduce((sum, d) => sum + d.focusMinutes, 0));
  }
  if (daysInMonth > 28) {
    weeklyTrend.push(days.slice(28).reduce((sum, d) => sum + d.focusMinutes, 0));
  }

  return {
    year: targetYear,
    month: targetMonth,
    monthName: MONTH_NAMES[targetMonth - 1],
    days,
    totalMinutes,
    totalSessions,
    avgDailyMinutes: activeDays > 0 ? Math.round(totalMinutes / activeDays) : 0,
    activeDays,
    weeklyTrend,
  };
}

export function getTimeOfDayStats(days = 30): TimeOfDayStats {
  const sessions = loadSessions();
  const cutoffDate = addDays(new Date(), -days);
  const recentSessions = sessions.filter(s => parseDate(s.date) >= cutoffDate);

  const hourly: HourlyDistribution[] = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    label: formatHourLabel(hour),
    totalMinutes: 0,
    sessions: 0,
    percentage: 0,
  }));

  recentSessions.forEach(session => {
    const hour = session.hourOfDay;
    if (hour >= 0 && hour < 24) {
      hourly[hour].totalMinutes += Math.round(session.focusTime / 60);
      hourly[hour].sessions += 1;
    }
  });

  const totalMinutes = hourly.reduce((sum, h) => sum + h.totalMinutes, 0);
  if (totalMinutes > 0)
    hourly.forEach(h => {
      h.percentage = Math.round((h.totalMinutes / totalMinutes) * 100);
    });

  const peakHour = hourly.reduce((max, h) => (h.totalMinutes > max.totalMinutes ? h : max)).hour;
  const morningMinutes = hourly.slice(5, 12).reduce((sum, h) => sum + h.totalMinutes, 0);
  const afternoonMinutes = hourly.slice(12, 17).reduce((sum, h) => sum + h.totalMinutes, 0);
  const eveningMinutes = hourly.slice(17, 21).reduce((sum, h) => sum + h.totalMinutes, 0);
  const nightMinutes = [...hourly.slice(21, 24), ...hourly.slice(0, 5)].reduce(
    (sum, h) => sum + h.totalMinutes,
    0
  );

  const periods = [
    { name: 'morning' as const, minutes: morningMinutes },
    { name: 'afternoon' as const, minutes: afternoonMinutes },
    { name: 'evening' as const, minutes: eveningMinutes },
    { name: 'night' as const, minutes: nightMinutes },
  ];
  const preferredPeriod = periods.reduce((max, p) => (p.minutes > max.minutes ? p : max)).name;

  return {
    hourly,
    peakHour,
    peakLabel: formatHourLabel(peakHour),
    morningMinutes,
    afternoonMinutes,
    eveningMinutes,
    nightMinutes,
    preferredPeriod,
  };
}

export function getProductivityTrend(
  period: 'week' | 'month' | 'quarter' = 'week'
): ProductivityTrend {
  const data: { label: string; value: number }[] = [];

  if (period === 'week') {
    for (let i = 7; i >= 0; i--) {
      const week = getWeeklyStats(-i);
      const weekStart = parseDate(week.weekStart);
      data.push({
        label: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
        value: week.totalMinutes,
      });
    }
  } else if (period === 'month') {
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = getMonthlyStats(targetDate.getFullYear(), targetDate.getMonth() + 1);
      data.push({ label: month.monthName.slice(0, 3), value: month.totalMinutes });
    }
  } else {
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = getMonthlyStats(targetDate.getFullYear(), targetDate.getMonth() + 1);
      data.push({ label: month.monthName.slice(0, 3), value: month.totalMinutes });
    }
  }

  const recent = data.slice(-2);
  const percentChange =
    recent[0].value > 0
      ? Math.round(((recent[1].value - recent[0].value) / recent[0].value) * 100)
      : 0;
  const trend: 'up' | 'down' | 'stable' =
    percentChange > 5 ? 'up' : percentChange < -5 ? 'down' : 'stable';

  return { period, data, trend, percentChange };
}

export function getStreakInfo(): { current: number; longest: number; lastActiveDate: string } {
  const dailyStats = loadDailyStats();
  const dates = Object.keys(dailyStats).sort().reverse();
  if (dates.length === 0)
    return { current: 0, longest: 0, lastActiveDate: getDateString(new Date()) };

  const lastActiveDate = dates[0];
  const today = getDateString(new Date());
  const yesterday = getDateString(addDays(new Date(), -1));

  let currentStreak = 0;
  let checkDate = dates[0] === today || dates[0] === yesterday ? dates[0] : '';

  if (checkDate) {
    for (let i = 0; i < dates.length; i++) {
      const expectedDate = getDateString(addDays(parseDate(checkDate), -i));
      if (dates.includes(expectedDate) && dailyStats[expectedDate]?.totalFocusTime > 0) {
        currentStreak++;
      } else break;
    }
  }

  let longestStreak = 0,
    tempStreak = 0;
  for (let i = 0; i < dates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const daysDiff = Math.round(
        (parseDate(dates[i - 1]).getTime() - parseDate(dates[i]).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysDiff === 1) tempStreak++;
      else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

  return { current: currentStreak, longest: longestStreak, lastActiveDate };
}

export function getAllTimeTotals(): {
  totalMinutes: number;
  totalSessions: number;
  totalDays: number;
  avgDailyMinutes: number;
} {
  // Always calculate from actual session data for accuracy
  const sessions = loadSessions();
  const dailyStats = loadDailyStats();

  // Get unique dates with activity
  const activeDates = new Set<string>();
  sessions.forEach(s => {
    if (s.date && s.focusTime > 0) {
      activeDates.add(s.date);
    }
  });

  // Also add dates from dailyStats
  Object.keys(dailyStats).forEach(date => {
    if (dailyStats[date]?.totalFocusTime > 0) {
      activeDates.add(date);
    }
  });

  const totalDays = activeDates.size || 1;

  // Calculate total minutes from sessions (focusTime is in seconds)
  const totalMinutesFromSessions = Math.round(
    sessions.reduce((sum, s) => sum + (s.focusTime || 0), 0) / 60
  );

  // Also check lifetime stats for comparison, but prefer session data if available
  let totalMinutes = totalMinutesFromSessions;
  let totalSessions = sessions.length;

  try {
    const lifetimeData = localStorage.getItem(STORAGE_KEYS.lifetimeStats);
    if (lifetimeData) {
      const stats = JSON.parse(lifetimeData);

      // Only use lifetime stats if they seem more complete than session data
      // (e.g., sessions array might have been cleared but lifetime persists)
      let lifetimeMinutes = 0;
      if (typeof stats.totalFocusMinutes === 'number') {
        lifetimeMinutes = stats.totalFocusMinutes;
      } else if (typeof stats.totalFocusTime === 'number') {
        lifetimeMinutes = Math.round(stats.totalFocusTime / 60);
      }

      // Use the larger value (in case session array was truncated)
      if (lifetimeMinutes > totalMinutes) {
        totalMinutes = lifetimeMinutes;
      }

      // For sessions count, ALWAYS use actual sessions array length
      // The lifetime stats.totalSessions can be inflated due to bugs
      // We trust the actual session array more
    }
  } catch {}

  return {
    totalMinutes,
    totalSessions,
    totalDays,
    avgDailyMinutes: totalDays > 0 ? Math.round(totalMinutes / totalDays) : 0,
  };
}

export function getAnalyticsSummary(): AnalyticsSummary {
  return {
    today: getDailyStats(),
    thisWeek: getWeeklyStats(0),
    thisMonth: getMonthlyStats(),
    timeOfDay: getTimeOfDayStats(30),
    streak: getStreakInfo(),
    allTime: getAllTimeTotals(),
  };
}

export function getWeekComparison() {
  const thisWeek = getWeeklyStats(0).totalMinutes;
  const lastWeek = getWeeklyStats(-1).totalMinutes;
  const change = thisWeek - lastWeek;
  const changePercent = lastWeek > 0 ? Math.round((change / lastWeek) * 100) : 0;
  const trend: 'up' | 'down' | 'stable' =
    changePercent > 5 ? 'up' : changePercent < -5 ? 'down' : 'stable';
  return { thisWeek, lastWeek, change, changePercent, trend };
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
