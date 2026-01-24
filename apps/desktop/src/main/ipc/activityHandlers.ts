/**
 * IPC handlers for activity monitoring
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { getActivityMonitor } from '../services/activityMonitor.js';
import type { ActivityConfig, ActivityStats, ActivityState } from '../../shared/types/activity.js';

export function registerActivityHandlers(): void {
  const monitor = getActivityMonitor();

  /**
   * Start activity monitoring
   */
  ipcMain.handle('activity:start-monitoring', () => {
    monitor.start();
    return { success: true };
  });

  /**
   * Stop activity monitoring
   */
  ipcMain.handle('activity:stop-monitoring', () => {
    monitor.stop();
    return { success: true };
  });

  /**
   * Start a focus session
   */
  ipcMain.handle('activity:start-session', () => {
    monitor.startSession();
    return { success: true };
  });

  /**
   * End a focus session and get stats
   */
  ipcMain.handle('activity:end-session', (): ActivityStats => {
    return monitor.endSession();
  });

  /**
   * Get current activity state
   */
  ipcMain.handle('activity:get-state', (): ActivityState => {
    return monitor.getState();
  });

  /**
   * Get current session stats
   */
  ipcMain.handle('activity:get-stats', (): ActivityStats => {
    return monitor.getStats();
  });

  /**
   * Update activity configuration
   */
  ipcMain.handle(
    'activity:update-config',
    (_event: IpcMainInvokeEvent, config: Partial<ActivityConfig>) => {
      monitor.updateConfig(config);
      return { success: true };
    }
  );

  /**
   * Get system idle time directly
   */
  ipcMain.handle('activity:get-idle-time', () => {
    const { powerMonitor } = require('electron');
    return powerMonitor.getSystemIdleTime();
  });
}
