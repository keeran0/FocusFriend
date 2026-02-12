import { contextBridge, ipcRenderer } from 'electron';

// Type definitions for the API
interface ActivityState {
  isIdle: boolean;
  idleDuration: number;
  lastActivityTime: Date;
  activeWindow: { title: string; appName: string; url?: string } | null;
  sessionActive: boolean;
  isPaused?: boolean;
}

interface ActivityStats {
  totalTime: number;
  activeTime: number;
  idleTime: number;
  idleEvents: number;
  focusScore: number;
  longestActiveStreak: number;
  longestIdleStreak: number;
}

interface ActivityConfig {
  idleThreshold: number;
  pollInterval: number;
  trackWindows: boolean;
}

interface NudgeConfig {
  enabled: boolean;
  level: 1 | 2 | 3;
  soundEnabled: boolean;
  idleThreshold: number;
  quietHoursEnabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

interface Nudge {
  id: string;
  level: 1 | 2 | 3;
  stage: number;
  title: string;
  message: string;
  timestamp: Date;
  notification: boolean;
  sound: boolean;
  overlay: boolean;
  autoPause: boolean;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  sessionId?: string;
}

interface NudgeEvent {
  nudge: Nudge;
  showOverlay: boolean;
  playSound: boolean;
  autoPause: boolean;
}

export interface ElectronAPI {
  getAppVersion: () => Promise<string>;
  getPlatform: () => string;
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  showNotification: (title: string, body: string) => void;

  activity: {
    startMonitoring: () => Promise<{ success: boolean }>;
    stopMonitoring: () => Promise<{ success: boolean }>;
    startSession: () => Promise<{ success: boolean }>;
    endSession: () => Promise<ActivityStats>;
    pauseSession: () => Promise<{ success: boolean }>;
    resumeSession: () => Promise<{ success: boolean }>;
    getState: () => Promise<ActivityState>;
    getStats: () => Promise<ActivityStats>;
    updateConfig: (config: Partial<ActivityConfig>) => Promise<{ success: boolean }>;
    setIdleThreshold: (threshold: number) => Promise<{ success: boolean }>;
    getIdleTime: () => Promise<number>;
    onActivityUpdate: (callback: (state: ActivityState) => void) => () => void;
    onActivityEvent: (callback: (event: { type: string }) => void) => () => void;
    onSessionAutoPaused: (callback: () => void) => () => void;
  };

  nudge: {
    updateConfig: (config: Partial<NudgeConfig>) => Promise<{ success: boolean }>;
    getConfig: () => Promise<NudgeConfig>;
    acknowledge: (nudgeId: string) => Promise<{ success: boolean }>;
    getHistory: () => Promise<Nudge[]>;
    triggerTest: () => Promise<{ success: boolean }>;
    onNudgeReceived: (callback: (event: NudgeEvent) => void) => () => void;
    onNudgeAcknowledged: (callback: (nudge: Nudge) => void) => () => void;
  };
}

const electronAPI: ElectronAPI = {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getPlatform: () => process.platform,

  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),

  showNotification: (title: string, body: string) => {
    ipcRenderer.send('show-notification', { title, body });
  },

  activity: {
    startMonitoring: () => ipcRenderer.invoke('activity:start-monitoring'),
    stopMonitoring: () => ipcRenderer.invoke('activity:stop-monitoring'),
    startSession: () => ipcRenderer.invoke('activity:start-session'),
    endSession: () => ipcRenderer.invoke('activity:end-session'),
    pauseSession: () => ipcRenderer.invoke('activity:pause-session'),
    resumeSession: () => ipcRenderer.invoke('activity:resume-session'),
    getState: () => ipcRenderer.invoke('activity:get-state'),
    getStats: () => ipcRenderer.invoke('activity:get-stats'),
    updateConfig: (config: Partial<ActivityConfig>) =>
      ipcRenderer.invoke('activity:update-config', config),
    setIdleThreshold: (threshold: number) =>
      ipcRenderer.invoke('activity:set-idle-threshold', threshold),
    getIdleTime: () => ipcRenderer.invoke('activity:get-idle-time'),

    onActivityUpdate: (callback: (state: ActivityState) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, state: ActivityState) => callback(state);
      ipcRenderer.on('activity-update', handler);
      return () => ipcRenderer.removeListener('activity-update', handler);
    },
    onActivityEvent: (callback: (event: { type: string }) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, data: { type: string }) => callback(data);
      ipcRenderer.on('activity-event', handler);
      return () => ipcRenderer.removeListener('activity-event', handler);
    },
    onSessionAutoPaused: (callback: () => void) => {
      const handler = () => callback();
      ipcRenderer.on('session-auto-paused', handler);
      return () => ipcRenderer.removeListener('session-auto-paused', handler);
    },
  },

  nudge: {
    updateConfig: (config: Partial<NudgeConfig>) =>
      ipcRenderer.invoke('nudge:update-config', config),
    getConfig: () => ipcRenderer.invoke('nudge:get-config'),
    acknowledge: (nudgeId: string) => ipcRenderer.invoke('nudge:acknowledge', nudgeId),
    getHistory: () => ipcRenderer.invoke('nudge:get-history'),
    triggerTest: () => ipcRenderer.invoke('nudge:trigger-test'),

    onNudgeReceived: (callback: (event: NudgeEvent) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, data: NudgeEvent) => callback(data);
      ipcRenderer.on('nudge-received', handler);
      return () => ipcRenderer.removeListener('nudge-received', handler);
    },
    onNudgeAcknowledged: (callback: (nudge: Nudge) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, nudge: Nudge) => callback(nudge);
      ipcRenderer.on('nudge-acknowledged', handler);
      return () => ipcRenderer.removeListener('nudge-acknowledged', handler);
    },
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Declare for TypeScript
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
