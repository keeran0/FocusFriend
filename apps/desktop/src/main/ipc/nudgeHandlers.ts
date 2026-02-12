/**
 * IPC handlers for nudge system
 */

import { ipcMain } from 'electron';
import { getNudgeService } from '../services/nudgeService.js';
import type { NudgeConfig } from '../../shared/types/nudge.js';

export function registerNudgeHandlers(): void {
  const nudgeService = getNudgeService();

  /**
   * Get current nudge configuration
   */
  ipcMain.handle('nudge:get-config', () => {
    return nudgeService.getConfig();
  });

  /**
   * Update nudge configuration
   */
  ipcMain.handle('nudge:update-config', (_event, config: Partial<NudgeConfig>) => {
    nudgeService.updateConfig(config);
    return { success: true };
  });

  /**
   * Acknowledge a nudge
   */
  ipcMain.handle('nudge:acknowledge', (_event, nudgeId: string) => {
    nudgeService.acknowledgeNudge(nudgeId);
    return { success: true };
  });

  /**
   * Get nudge history for current session
   */
  ipcMain.handle('nudge:get-history', () => {
    return nudgeService.getNudgeHistory();
  });

  /**
   * Trigger a test nudge
   */
  ipcMain.handle('nudge:trigger-test', () => {
    // Manually trigger idle start for testing
    nudgeService.onIdleStart();
    return { success: true };
  });
}
