/**
 * Activity IPC Handlers
 * Handles communication between renderer and activity monitor
 */

import { ipcMain } from 'electron';
import { getActivityMonitor } from '../services/activityMonitor.js';

export function registerActivityHandlers(): void {
  const monitor = getActivityMonitor();

  // Start monitoring
  ipcMain.handle('activity:start-monitoring', () => {
    monitor.startMonitoring();
    return { success: true };
  });

  // Stop monitoring
  ipcMain.handle('activity:stop-monitoring', () => {
    monitor.stopMonitoring();
    return { success: true };
  });

  // Start session
  ipcMain.handle('activity:start-session', () => {
    monitor.startSession();
    return { success: true };
  });

  // End session
  ipcMain.handle('activity:end-session', () => {
    const stats = monitor.endSession();
    return stats;
  });

  // Get current state
  ipcMain.handle('activity:get-state', () => {
    return monitor.getState();
  });

  // Get stats
  ipcMain.handle('activity:get-stats', () => {
    return monitor.getStats();
  });

  // Get idle time
  ipcMain.handle('activity:get-idle-time', () => {
    return monitor.getIdleTime();
  });

  // Resume session (already registered in main/index.ts, but adding here for completeness)
  // Note: This may be registered twice - that's okay, the second registration will be ignored

  console.log('[ActivityHandlers] Registered activity IPC handlers');
}
