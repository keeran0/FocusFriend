/**
 * IPC handlers for nudge system
 */

import { ipcMain } from 'electron';
import { getNudgeService } from '../services/nudgeService.js';
import type { NudgeConfig } from '../../shared/types/nudge.js';

export function registerNudgeHandlers(): void {
  const nudgeService = getNudgeService();

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
   * Set user streak for streak reminders
   */
  ipcMain.handle('nudge:set-streak', (_event, streak: number) => {
    nudgeService.setUserStreak(streak);
    return { success: true };
  });

  /**
   * Manually trigger a nudge (for testing)
   */
  ipcMain.handle('nudge:trigger-test', (_event, type: string) => {
    // This is just for testing - emit a test nudge event
    nudgeService.emit('nudge', {
      nudge: {
        id: 'test-' + Date.now(),
        type,
        title: '🧪 Test Nudge',
        message: 'This is a test nudge message!',
        timestamp: new Date(),
        acknowledged: false,
      },
      showOverlay: type === 'urgent',
      playSound: type !== 'gentle',
    });
    return { success: true };
  });
}
