/**
 * Focus Wrapped - Module Exports
 *
 * Location: apps/desktop/src/renderer/components/focusWrapped/index.ts
 *
 * This file exports all Focus Wrapped components and functions.
 * Import from this file in other components:
 *
 * @example
 * ```tsx
 * import {
 *   FocusWrapped,
 *   FocusWrappedButton,
 *   WeeklyRecapCard,
 *   saveSession,
 *   calculateRecapStats
 * } from '../components/focusWrapped';
 * ```
 */

// ============================================
// DATA SERVICE EXPORTS
// ============================================

export {
  // Session management
  saveSession,
  getSessions,
  getSessionsInRange,
  getSessionsForPeriod,

  // Daily stats
  getDailyStatsHistory,
  getDailyProgress,
  saveDailyProgress,

  // Lifetime stats
  getLifetimeStats,

  // Recap calculations
  calculateRecapStats,

  // Data import/export
  exportData,
  importData,

  // Demo/testing utilities
  generateDemoData,
  clearAllData,

  // Type exports
  type FocusSession,
  type DailyStats,
  type RecapStats,
} from './focusWrappedData';

// ============================================
// UI COMPONENT EXPORTS
// ============================================

export { FocusWrapped } from './FocusWrapped';
export { FocusWrappedButton, WeeklyRecapCard } from './FocusWrappedButton';
