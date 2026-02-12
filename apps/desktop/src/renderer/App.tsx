import { useState, useCallback, useEffect, useRef } from 'react';
import { ActivityStatus } from './components/ActivityStatus';
import { NudgeSettings } from './components/NudgeSettings';
import { NudgeOverlay } from './components/NudgeOverlay';
import { NudgeToast } from './components/NudgeToast';
import { useNudge } from './hooks/useNudge';

interface NudgeConfigPartial {
  enabled?: boolean;
  level?: number;
  soundEnabled?: boolean;
  idleThreshold?: number;
  quietHoursEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

// Session action types - breaks are automatic, so only resume/end/pause
export type SessionAction = 'resume' | 'end' | 'pause' | null;

function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [pendingAction, setPendingAction] = useState<SessionAction>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const pendingActionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { currentNudge, showOverlay, dismissOverlay, acknowledgeNudge } = useNudge();

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (pendingActionTimeoutRef.current) {
        clearTimeout(pendingActionTimeoutRef.current);
      }
    };
  }, []);

  const handleConfigChange = (config: NudgeConfigPartial) => {
    console.log('[App] Config changed:', config);
  };

  // Handle overlay actions - pass to ActivityStatus via pendingAction
  const handleOverlayAction = useCallback(
    async (action: string) => {
      console.log('[App] Overlay action received:', action);

      // Acknowledge the nudge first
      if (currentNudge) {
        await acknowledgeNudge(currentNudge.id);
      }

      // Dismiss the overlay
      dismissOverlay();

      // Clear any existing pending action timeout
      if (pendingActionTimeoutRef.current) {
        clearTimeout(pendingActionTimeoutRef.current);
      }

      // Set pending action to be handled by ActivityStatus
      setPendingAction(action as SessionAction);

      // Clear pending action after ActivityStatus has time to process it
      pendingActionTimeoutRef.current = setTimeout(() => {
        setPendingAction(null);
      }, 500);
    },
    [currentNudge, acknowledgeNudge, dismissOverlay]
  );

  // Handle session state changes from ActivityStatus
  const handleSessionStateChange = useCallback((isActive: boolean) => {
    console.log('[App] Session state changed:', isActive);
    setIsSessionActive(isActive);
  }, []);

  // Handle going to settings (only available when no session)
  const handleGoToSettings = useCallback(() => {
    if (!isSessionActive) {
      setShowSettings(true);
    }
  }, [isSessionActive]);

  // Handle going back from settings
  const handleBackFromSettings = useCallback(() => {
    setShowSettings(false);
  }, []);

  return (
    <>
      <style>{`
        :root {
          --color-bg-primary: #0f0f1a;
          --color-bg-secondary: #1a1a2e;
          --color-bg-card: #252542;
          --color-bg-hover: #2d2d4a;
          --color-border: #3d3d5c;
          --color-text-primary: #ffffff;
          --color-text-secondary: #a0a0b8;
          --color-accent: #e94560;
          --color-accent-hover: #ff5a75;
          --color-success: #4ade80;
          --color-warning: #fbbf24;
          --color-error: #ef4444;
          --spacing-xs: 4px;
          --spacing-sm: 8px;
          --spacing-md: 16px;
          --spacing-lg: 24px;
          --spacing-xl: 32px;
          --spacing-2xl: 48px;
          --font-size-xs: 0.75rem;
          --font-size-sm: 0.875rem;
          --font-size-base: 1rem;
          --font-size-lg: 1.125rem;
          --font-size-xl: 1.5rem;
          --font-size-2xl: 2rem;
          --font-size-3xl: 2.5rem;
          --radius-sm: 6px;
          --radius-md: 10px;
          --radius-lg: 16px;
          --radius-xl: 24px;
          --transition-fast: 150ms ease;
          --transition-normal: 250ms ease;
          --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.3);
          --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.4);
          --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.5);
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        html, body, #root {
          height: 100%;
        }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, var(--color-bg-primary) 0%, var(--color-bg-secondary) 100%);
          color: var(--color-text-primary);
          line-height: 1.6;
          -webkit-font-smoothing: antialiased;
        }

        .app {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .app-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-md) var(--spacing-xl);
          background: rgba(26, 26, 46, 0.8);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid var(--color-border);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .app-logo {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .app-logo-icon {
          font-size: 1.8rem;
        }

        .app-logo h1 {
          font-size: var(--font-size-xl);
          font-weight: 700;
          background: linear-gradient(135deg, #fff 0%, #a0a0b8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .session-badge {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-xs) var(--spacing-md);
          background: rgba(74, 222, 128, 0.1);
          border: 1px solid rgba(74, 222, 128, 0.3);
          border-radius: var(--radius-lg);
          font-size: var(--font-size-sm);
          color: var(--color-success);
        }

        .session-badge .badge-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--color-success);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .app-main {
          flex: 1;
          padding: var(--spacing-xl);
          display: flex;
          justify-content: center;
        }

        .app-content {
          width: 100%;
          max-width: 900px;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-sm) var(--spacing-lg);
          border: none;
          border-radius: var(--radius-md);
          font-size: var(--font-size-base);
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
          text-decoration: none;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-primary {
          background: linear-gradient(135deg, var(--color-accent) 0%, #ff6b81 100%);
          color: white;
          box-shadow: 0 4px 14px rgba(233, 69, 96, 0.4);
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(233, 69, 96, 0.5);
        }

        .btn-secondary {
          background: var(--color-bg-card);
          color: var(--color-text-primary);
          border: 1px solid var(--color-border);
        }

        .btn-secondary:hover:not(:disabled) {
          background: var(--color-bg-hover);
          border-color: var(--color-text-secondary);
        }
      `}</style>

      <div className="app">
        <header className="app-header">
          <div className="app-logo">
            <span className="app-logo-icon">🎯</span>
            <h1>Focus Friend</h1>
          </div>

          <div className="header-right">
            {/* Show session indicator when active */}
            {isSessionActive && !showSettings && (
              <div className="session-badge">
                <span className="badge-dot" />
                Session Active
              </div>
            )}

            {/* Only show settings button when no session is active */}
            {showSettings ? (
              <button className="btn btn-secondary" onClick={handleBackFromSettings}>
                ← Back to Focus
              </button>
            ) : !isSessionActive ? (
              <button className="btn btn-secondary" onClick={handleGoToSettings}>
                ⚙️ Settings
              </button>
            ) : null}
          </div>
        </header>

        <main className="app-main">
          <div className="app-content">
            {showSettings ? (
              <NudgeSettings onConfigChange={handleConfigChange} />
            ) : (
              <ActivityStatus
                showDetails={true}
                pendingAction={pendingAction}
                onSessionStateChange={handleSessionStateChange}
              />
            )}
          </div>
        </main>

        {/* Toast notification for gentle nudges */}
        {currentNudge && !showOverlay && !showSettings && (
          <NudgeToast nudge={currentNudge} onDismiss={() => acknowledgeNudge(currentNudge.id)} />
        )}

        {/* Full screen overlay for focused mode / auto-pause */}
        {showOverlay && currentNudge && !showSettings && (
          <NudgeOverlay nudge={currentNudge} onAction={handleOverlayAction} />
        )}
      </div>
    </>
  );
}

export default App;
