import { app, BrowserWindow, ipcMain, Notification, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { registerActivityHandlers } from './ipc/activityHandlers.js';
import { registerNudgeHandlers } from './ipc/nudgeHandlers.js';
import { getActivityMonitor, destroyActivityMonitor } from './services/activityMonitor.js';
import { getNudgeService, destroyNudgeService } from './services/nudgeService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Default idle threshold - 30 seconds for testing
const DEFAULT_IDLE_THRESHOLD = 30;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
    backgroundColor: '#1a1a2e',
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Show system notification - improved version
function showSystemNotification(title: string, body: string): void {
  console.log('[Main] Attempting to show notification:', title);
  
  // Check if notifications are supported
  if (!Notification.isSupported()) {
    console.log('[Main] System notifications not supported on this platform');
    // Fallback: send to renderer for in-app notification
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('fallback-notification', { title, body });
    }
    return;
  }

  try {
    const notification = new Notification({
      title,
      body,
      silent: false,
      urgency: 'critical', // Linux
      timeoutType: 'default',
      icon: path.join(__dirname, '../../assets/icon.png'), // Add app icon if available
    });
    
    notification.on('click', () => {
      console.log('[Main] Notification clicked');
      bringWindowToFront();
    });

    notification.on('show', () => {
      console.log('[Main] Notification displayed successfully');
    });

    notification.on('failed', (event, error) => {
      console.error('[Main] Notification failed:', error);
    });

    notification.on('close', () => {
      console.log('[Main] Notification closed');
    });
    
    notification.show();
  } catch (error) {
    console.error('[Main] Error creating notification:', error);
    // Fallback to renderer
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('fallback-notification', { title, body });
    }
  }
}

// Bring window to front (for overlay/popup)
function bringWindowToFront(): void {
  if (!mainWindow) return;
  
  console.log('[Main] Bringing window to front');
  
  // Restore if minimized
  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }
  
  // Show if hidden
  mainWindow.show();
  
  // Focus the window
  mainWindow.focus();
  
  // On Windows, use setAlwaysOnTop trick to force focus
  if (process.platform === 'win32') {
    mainWindow.setAlwaysOnTop(true);
    mainWindow.setAlwaysOnTop(false);
  }
  
  // Flash taskbar on Windows to get attention
  mainWindow.flashFrame(true);
  setTimeout(() => {
    mainWindow?.flashFrame(false);
  }, 1000);
}

function initializeServices(): void {
  console.log(`[Main] Initializing with idle threshold: ${DEFAULT_IDLE_THRESHOLD}s`);

  // Initialize activity monitor with default threshold
  const activityMonitor = getActivityMonitor({
    idleThreshold: DEFAULT_IDLE_THRESHOLD,
  });

  // Initialize nudge service
  const nudgeService = getNudgeService();

  // Track idle notification state
  let nudgeServiceNotifiedIdle = false;

  // Listen for activity events
  activityMonitor.on('activity-event', (event) => {
    console.log('[Main] Activity event:', event.type);

    // Forward to renderer
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('activity-event', event);
    }

    // Handle session events
    if (event.type === 'session-start') {
      nudgeService.startSession(Date.now().toString());
      nudgeServiceNotifiedIdle = false;
    } else if (event.type === 'session-end') {
      nudgeService.endSession();
      nudgeServiceNotifiedIdle = false;
    }

    // Handle idle threshold - notify nudge service ONCE
    if (event.type === 'idle-threshold' && !nudgeServiceNotifiedIdle) {
      console.log('[Main] Notifying nudge service: idle started');
      nudgeServiceNotifiedIdle = true;
      nudgeService.onIdleStart();
    }

    // Handle activity resumed
    if (event.type === 'activity-start' && nudgeServiceNotifiedIdle) {
      console.log('[Main] Notifying nudge service: idle ended');
      nudgeServiceNotifiedIdle = false;
      nudgeService.onIdleEnd();
    }
  });

  // Forward activity updates to renderer
  activityMonitor.on('activity-update', (state) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('activity-update', state);
    }
  });

  // Forward nudge events to renderer
  nudgeService.on('nudge', (nudgeEvent) => {
    console.log('[Main] Nudge event:', nudgeEvent.nudge.title, {
      notification: nudgeEvent.nudge.notification,
      sound: nudgeEvent.playSound,
      overlay: nudgeEvent.showOverlay,
    });
    
    // Show system notification
    if (nudgeEvent.nudge.notification) {
      showSystemNotification(nudgeEvent.nudge.title, nudgeEvent.nudge.message);
    }
    
    // Bring window to front if overlay is requested
    if (nudgeEvent.showOverlay) {
      console.log('[Main] Bringing window to front for overlay');
      bringWindowToFront();
    }
    
    // Forward to renderer for in-app display
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('nudge-received', nudgeEvent);
    }
  });

  nudgeService.on('nudge-acknowledged', (nudge) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('nudge-acknowledged', nudge);
    }
  });

  // Handle auto-pause from nudge service
  nudgeService.on('auto-pause', () => {
    console.log('[Main] Auto-pause triggered - pausing activity monitor session');
    activityMonitor.pauseSession();

    // Show system notification for auto-pause
    showSystemNotification(
      '⏸️ Session Paused',
      'Your focus session has been paused due to inactivity. Click to resume.'
    );

    // Bring window to front
    bringWindowToFront();

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('session-auto-paused');
    }

    nudgeServiceNotifiedIdle = false;
  });

  // Handle session resume from renderer
  ipcMain.handle('activity:resume-session', () => {
    console.log('[Main] Resuming session');
    activityMonitor.resumeSession();
    nudgeServiceNotifiedIdle = false;
    return { success: true };
  });

  // Handle idle threshold updates from renderer
  ipcMain.handle('activity:set-idle-threshold', (_event, threshold: number) => {
    console.log(`[Main] Setting idle threshold to: ${threshold}s`);
    activityMonitor.updateConfig({ idleThreshold: threshold });
    return { success: true };
  });
}

// IPC Handlers
ipcMain.handle('get-app-version', () => app.getVersion());

ipcMain.on('window-minimize', () => mainWindow?.minimize());

ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.on('window-close', () => mainWindow?.close());

// Handle show-notification from renderer
ipcMain.on('show-notification', (_event, { title, body }) => {
  console.log('[Main] Received show-notification IPC:', title);
  showSystemNotification(title, body);
});

// Also handle as invoke for async calls
ipcMain.handle('show-notification', (_event, { title, body }) => {
  console.log('[Main] Received show-notification handle:', title);
  showSystemNotification(title, body);
  return { success: true };
});

// App lifecycle
app.whenReady().then(() => {
  // Request notification permissions on macOS
  if (process.platform === 'darwin') {
    app.setAppUserModelId('com.focusfriend.app');
  }
  
  registerActivityHandlers();
  registerNudgeHandlers();
  initializeServices();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  destroyActivityMonitor();
  destroyNudgeService();
});

app.on('web-contents-created', (_, contents) => {
  contents.setWindowOpenHandler(() => ({ action: 'deny' }));
});
