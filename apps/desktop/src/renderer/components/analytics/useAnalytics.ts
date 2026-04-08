/**
 * useAnalytics - React Hook for Analytics Data
 * Tutorial 12: Analytics Dashboard
 * 
 * Location: apps/desktop/src/renderer/components/analytics/useAnalytics.ts
 * 
 * Provides easy access to analytics data with auto-refresh.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getAnalyticsSummary,
  getWeekComparison,
  getDailyStats,
  getWeeklyStats,
  getMonthlyStats,
  getTimeOfDayStats,
  getProductivityTrend,
  type AnalyticsSummary,
  type DailyStats,
  type WeeklyStats,
  type MonthlyStats,
  type TimeOfDayStats,
  type ProductivityTrend,
} from './analyticsData';

// ============================================
// TYPES
// ============================================

interface UseAnalyticsOptions {
  /** Auto-refresh interval in ms (0 = disabled) */
  refreshInterval?: number;
  /** Load data on mount */
  loadOnMount?: boolean;
}

interface UseAnalyticsReturn {
  // Data
  summary: AnalyticsSummary | null;
  today: DailyStats | null;
  thisWeek: WeeklyStats | null;
  thisMonth: MonthlyStats | null;
  timeOfDay: TimeOfDayStats | null;
  trend: ProductivityTrend | null;
  weekComparison: ReturnType<typeof getWeekComparison> | null;
  
  // State
  isLoading: boolean;
  lastUpdated: Date | null;
  
  // Actions
  refresh: () => void;
  loadSummary: () => void;
  loadDaily: (date?: string) => void;
  loadWeekly: (offset?: number) => void;
  loadMonthly: (year?: number, month?: number) => void;
  loadTimeOfDay: (days?: number) => void;
  loadTrend: (period?: 'week' | 'month' | 'quarter') => void;
}

// ============================================
// HOOK
// ============================================

export function useAnalytics(options: UseAnalyticsOptions = {}): UseAnalyticsReturn {
  const { refreshInterval = 0, loadOnMount = true } = options;

  // State
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [today, setToday] = useState<DailyStats | null>(null);
  const [thisWeek, setThisWeek] = useState<WeeklyStats | null>(null);
  const [thisMonth, setThisMonth] = useState<MonthlyStats | null>(null);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDayStats | null>(null);
  const [trend, setTrend] = useState<ProductivityTrend | null>(null);
  const [weekComparison, setWeekComparison] = useState<ReturnType<typeof getWeekComparison> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Refs for interval
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Loaders
  const loadSummary = useCallback(() => {
    setIsLoading(true);
    try {
      setSummary(getAnalyticsSummary());
      setWeekComparison(getWeekComparison());
      setLastUpdated(new Date());
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadDaily = useCallback((date?: string) => {
    setToday(getDailyStats(date));
  }, []);

  const loadWeekly = useCallback((offset = 0) => {
    setThisWeek(getWeeklyStats(offset));
  }, []);

  const loadMonthly = useCallback((year?: number, month?: number) => {
    setThisMonth(getMonthlyStats(year, month));
  }, []);

  const loadTimeOfDay = useCallback((days = 30) => {
    setTimeOfDay(getTimeOfDayStats(days));
  }, []);

  const loadTrend = useCallback((period: 'week' | 'month' | 'quarter' = 'week') => {
    setTrend(getProductivityTrend(period));
  }, []);

  const refresh = useCallback(() => {
    loadSummary();
    loadDaily();
    loadWeekly();
    loadMonthly();
    loadTimeOfDay();
    loadTrend();
  }, [loadSummary, loadDaily, loadWeekly, loadMonthly, loadTimeOfDay, loadTrend]);

  // Load on mount
  useEffect(() => {
    if (loadOnMount) {
      refresh();
    }
  }, [loadOnMount, refresh]);

  // Auto-refresh interval
  useEffect(() => {
    if (refreshInterval > 0) {
      intervalRef.current = setInterval(refresh, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refreshInterval, refresh]);

  return {
    // Data
    summary,
    today,
    thisWeek,
    thisMonth,
    timeOfDay,
    trend,
    weekComparison,
    
    // State
    isLoading,
    lastUpdated,
    
    // Actions
    refresh,
    loadSummary,
    loadDaily,
    loadWeekly,
    loadMonthly,
    loadTimeOfDay,
    loadTrend,
  };
}

export default useAnalytics;
