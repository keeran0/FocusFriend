import { useState, useEffect, useCallback } from 'react';
import { ActivityStatus } from './components/ActivityStatus';
import { NudgeOverlay } from './components/NudgeOverlay';
import { NudgeToast } from './components/NudgeToast';
import { NudgeSettings } from './components/NudgeSettings';
import { useActivity } from './hooks/useActivity';
import { useNudge } from './hooks/useNudge';
import type { NudgeConfig } from '../shared/types/nudge';

const DEFAULT_NUDGE_CONFIG: NudgeConfig = {
  enabled: true,
  frequency: 'moderate',
  soundEnabled: true,
  escalationEnabled: true,
};

function App() {
  const [platform, setPlatform] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  const [nudgeConfig, setNudgeConfig] = useState<NudgeConfig>(DEFAULT_NUDGE_CONFIG);

  const { endSession } = useActivity({ autoStart: true });
  const { currentNudge, showOverlay, dismissNudge, updateConfig, triggerTestNudge } = useNudge();

  useEffect(() => {
    if (window.electronAPI) {
      setPlatform(window.electronAPI.getPlatform());
    }

    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSaveNudgeConfig = useCallback(
    async (config: Partial<NudgeConfig>) => {
      setNudgeConfig(prev => ({ ...prev, ...config }));
      await updateConfig(config);
    },
    [updateConfig]
  );

  const handleEndSession = useCallback(async () => {
    await endSession();
  }, [endSession]);

  const handleTakeBreak = useCallback(() => {
    // In the future, this could pause the session
    window.electronAPI?.showNotification(
      '☕ Break Time!',
      "Taking a 5-minute break. I'll remind you when it's over!"
    );
  }, []);

  // Get non-overlay nudge for toast
  const toastNudge = currentNudge && !currentNudge.showOverlay ? currentNudge.nudge : null;

  return (
    <div className="app">
      {/* Nudge Overlay (for urgent nudges) */}
      <NudgeOverlay
        nudgeEvent={showOverlay ? currentNudge : null}
        onDismiss={dismissNudge}
        onEndSession={handleEndSession}
        onTakeBreak={handleTakeBreak}
      />

      {/* Nudge Toast (for gentle/moderate nudges) */}
      <NudgeToast nudge={toastNudge} onDismiss={dismissNudge} />

      <header className="app-header">
        <h1>🎯 Focus Friend</h1>
        <p className="subtitle">Smart Procrastination Manager</p>
        <button className="settings-toggle" onClick={() => setShowSettings(!showSettings)}>
          ⚙️ {showSettings ? 'Hide Settings' : 'Settings'}
        </button>
      </header>

      <main className="app-main">
        {/* Activity Status - Main Feature */}
        <div className="main-card">
          <ActivityStatus showDetails={true} />
        </div>

        {/* Side Panel */}
        <div className="side-cards">
          {showSettings ? (
            <NudgeSettings
              config={nudgeConfig}
              onSave={handleSaveNudgeConfig}
              onTestNudge={triggerTestNudge}
            />
          ) : (
            <>
              <div className="status-card">
                <h2>System Status</h2>
                <div className="status-grid">
                  <div className="status-item">
                    <span className="label">Platform</span>
                    <span className="value">{platform || 'Loading...'}</span>
                  </div>
                  <div className="status-item">
                    <span className="label">Current Time</span>
                    <span className="value">{currentTime || 'Loading...'}</span>
                  </div>
                  <div className="status-item">
                    <span className="label">Nudges</span>
                    <span className="value">
                      {nudgeConfig.enabled ? '✅ Enabled' : '❌ Disabled'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="info-card">
                <h2>Nudge System</h2>
                <ul>
                  <li>👋 Gentle - Subtle reminder</li>
                  <li>⏰ Moderate - Notification + sound</li>
                  <li>🚨 Urgent - Full overlay</li>
                  <li>🔥 Streak alerts when at risk</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </main>

      <footer className="app-footer">
        <p>Focus Friend v0.0.1 • Built with Electron + React</p>
      </footer>

      <style>{`
        .settings-toggle {
          position: absolute;
          top: var(--spacing-lg);
          right: var(--spacing-lg);
          padding: var(--spacing-sm) var(--spacing-md);
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          color: var(--color-text-primary);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .settings-toggle:hover {
          background: var(--color-bg-secondary);
          border-color: var(--color-accent);
        }

        .app-header {
          position: relative;
        }
      `}</style>
    </div>
  );
}

export default App;
