import { contextBridge, ipcRenderer } from 'electron';
import type { ActivityConfig, ActivityStats, ActivityState } from '../shared/types/activity.js';

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

    // Event listeners with cleanup
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
} satisfies ElectronAPI);
