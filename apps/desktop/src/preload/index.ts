import { contextBridge, ipcRenderer } from 'electron';

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

  // IPC communication
  send: (channel: string, data: unknown) => void;
  receive: (channel: string, callback: (data: unknown) => void) => void;
  invoke: (channel: string, data?: unknown) => Promise<unknown>;
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

  // Generic IPC methods
  send: (channel: string, data: unknown) => {
    const validChannels = ['window-minimize', 'window-maximize', 'window-close'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel: string, callback: (data: unknown) => void) => {
    const validChannels = ['focus-reminder', 'session-update'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (_, data) => callback(data));
    }
  },
  invoke: (channel: string, data?: unknown) => {
    const validChannels = ['get-app-version', 'get-idle-time', 'start-session'];
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, data);
    }
    return Promise.reject(new Error(`Invalid channel: ${channel}`));
  },
} satisfies ElectronAPI);
