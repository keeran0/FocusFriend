import { contextBridge, ipcRenderer } from 'electron';
import type { ActivityConfig, ActivityStats, ActivityState } from '../shared/types/activity.js';
import type { NudgeConfig, Nudge, NudgeEvent } from '../shared/types/nudge.js';

// Type definitions for the exposed API
export interface ElectronAPI {
  // App information
  getAppVersion: () => Promise<string>;
  getPlatform: () => string;

  // Window controls
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;

  // Notifications
  showNotification: (title: string, body: string) => void;

  // Activity monitoring
  activity: {
    startMonitoring: () => Promise<{ success: boolean }>;
    stopMonitoring: () => Promise<{ success: boolean }>;
    startSession: () => Promise<{ success: boolean }>;
    endSession: () => Promise<ActivityStats>;
    getState: () => Promise<ActivityState>;
    getStats: () => Promise<ActivityStats>;
    updateConfig: (config: Partial<ActivityConfig>) => Promise<{ success: boolean }>;
    getIdleTime: () => Promise<number>;
    onActivityUpdate: (callback: (state: ActivityState) => void) => () => void;
    onActivityEvent: (callback: (event: unknown) => void) => () => void;
    onIdleDetected: (callback: (data: { duration: number }) => void) => () => void;
    onActivityResumed: (callback: () => void) => () => void;
  };

  // Nudge system
  nudge: {
    updateConfig: (config: Partial<NudgeConfig>) => Promise<{ success: boolean }>;
    acknowledge: (nudgeId: string) => Promise<{ success: boolean }>;
    getHistory: () => Promise<Nudge[]>;
    setStreak: (streak: number) => Promise<{ success: boolean }>;
    triggerTest: (type: string) => Promise<{ success: boolean }>;
    onNudgeReceived: (callback: (event: NudgeEvent) => void) => () => void;
    onNudgeAcknowledged: (callback: (nudge: Nudge) => void) => () => void;
  };
}

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // App information
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getPlatform: () => process.platform,

  // Window controls
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),

  // Notifications
  showNotification: (title: string, body: string) => {
    ipcRenderer.send('show-notification', { title, body });
  },

  // Activity monitoring
  activity: {
    startMonitoring: () => ipcRenderer.invoke('activity:start-monitoring'),
    stopMonitoring: () => ipcRenderer.invoke('activity:stop-monitoring'),
    startSession: () => ipcRenderer.invoke('activity:start-session'),
    endSession: () => ipcRenderer.invoke('activity:end-session'),
    getState: () => ipcRenderer.invoke('activity:get-state'),
    getStats: () => ipcRenderer.invoke('activity:get-stats'),
    updateConfig: (config: Partial<ActivityConfig>) =>
      ipcRenderer.invoke('activity:update-config', config),
    getIdleTime: () => ipcRenderer.invoke('activity:get-idle-time'),
    onActivityUpdate: (callback: (state: ActivityState) => void) => {
      const handler = (_event: unknown, state: ActivityState) => callback(state);
      ipcRenderer.on('activity-update', handler);
      return () => ipcRenderer.removeListener('activity-update', handler);
    },
    onActivityEvent: (callback: (event: unknown) => void) => {
      const handler = (_event: unknown, data: unknown) => callback(data);
      ipcRenderer.on('activity-event', handler);
      return () => ipcRenderer.removeListener('activity-event', handler);
    },
    onIdleDetected: (callback: (data: { duration: number }) => void) => {
      const handler = (_event: unknown, data: { duration: number }) => callback(data);
      ipcRenderer.on('idle-detected', handler);
      return () => ipcRenderer.removeListener('idle-detected', handler);
    },
    onActivityResumed: (callback: () => void) => {
      const handler = () => callback();
      ipcRenderer.on('activity-resumed', handler);
      return () => ipcRenderer.removeListener('activity-resumed', handler);
    },
  },

  // Nudge system
  nudge: {
    updateConfig: (config: Partial<NudgeConfig>) =>
      ipcRenderer.invoke('nudge:update-config', config),
    acknowledge: (nudgeId: string) => ipcRenderer.invoke('nudge:acknowledge', nudgeId),
    getHistory: () => ipcRenderer.invoke('nudge:get-history'),
    setStreak: (streak: number) => ipcRenderer.invoke('nudge:set-streak', streak),
    triggerTest: (type: string) => ipcRenderer.invoke('nudge:trigger-test', type),
    onNudgeReceived: (callback: (event: NudgeEvent) => void) => {
      const handler = (_event: unknown, data: NudgeEvent) => callback(data);
      ipcRenderer.on('nudge-received', handler);
      return () => ipcRenderer.removeListener('nudge-received', handler);
    },
    onNudgeAcknowledged: (callback: (nudge: Nudge) => void) => {
      const handler = (_event: unknown, nudge: Nudge) => callback(nudge);
      ipcRenderer.on('nudge-acknowledged', handler);
      return () => ipcRenderer.removeListener('nudge-acknowledged', handler);
    },
  },
} satisfies ElectronAPI);
