import { app, BrowserWindow, ipcMain, Notification } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { registerActivityHandlers } from './ipc/activityHandlers.js';
import { registerNudgeHandlers } from './ipc/nudgeHandlers.js';
import { getActivityMonitor, destroyActivityMonitor } from './services/activityMonitor.js';
import { getNudgeService, destroyNudgeService } from './services/nudgeService.js';

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Keep a global reference to prevent garbage collection
let mainWindow: BrowserWindow | null = null;

// Check if we're in development mode
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

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

// Initialize services and wire them together
function initializeServices(): void {
  const activityMonitor = getActivityMonitor({
    idleThreshold: 30, // 30 seconds for testing
  });
  const nudgeService = getNudgeService();

  // Track if we've notified nudge service about current idle state
  let nudgeServiceNotifiedIdle = false;

  // Listen for activity events from the monitor
  activityMonitor.on('activity-event', event => {
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

    // Handle idle threshold - ONLY notify nudge service ONCE
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

  // Forward activity updates to renderer (for UI)
  activityMonitor.on('activity-update', state => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('activity-update', state);
    }
  });

  // Forward nudge events to renderer
  nudgeService.on('nudge', nudgeEvent => {
    console.log('[Main] Nudge event:', nudgeEvent.nudge.type);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('nudge-received', nudgeEvent);
    }
  });

  nudgeService.on('nudge-acknowledged', nudge => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('nudge-acknowledged', nudge);
    }
  });
}

// IPC Handlers
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.on('window-minimize', () => {
  mainWindow?.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.on('window-close', () => {
  mainWindow?.close();
});

ipcMain.on('show-notification', (_, { title, body }) => {
  new Notification({ title, body }).show();
});

// App lifecycle
app.whenReady().then(() => {
  // Register IPC handlers
  registerActivityHandlers();
  registerNudgeHandlers();

  // Initialize and connect services
  initializeServices();

  // Create window
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
  contents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });
});
