/**
 * Focus Friend - Final Polished Version
 * Tutorial 15: Production Polish
 *
 * New design system inspired by modern dashboard aesthetics:
 * - Dark theme with vibrant green (#4ADE80) and orange (#FB923C) accents
 * - Pill-shaped navigation and buttons
 * - Clean, rounded card components
 * - Improved logo and branding
 */

import { useState, useEffect } from 'react';
import { ActivityStatus } from './components/ActivityStatus';
import { NudgeSettings } from './components/NudgeSettings';
import { NudgeOverlay } from './components/NudgeOverlay';
import { NudgeToast } from './components/NudgeToast';
import { AnalyticsDashboard } from './components/analytics';
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

type AppView = 'dashboard' | 'analytics' | 'settings';

function App() {
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { currentNudge, showOverlay, dismissOverlay, acknowledgeNudge } = useNudge();

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const handleConfigChange = (config: NudgeConfigPartial) => {
    console.log('[App] Config changed:', config);
  };

  const handleOverlayAction = async (action: string) => {
    if (currentNudge) await acknowledgeNudge(currentNudge.id);
    dismissOverlay();

    if (action === 'resume') {
      await window.electronAPI?.activity?.resumeSession?.();
    } else if (action === 'end') {
      await window.electronAPI?.activity?.endSession?.();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      {/* Global Styles - New Design System */}
      <style>{`
        :root {
          /* Core Palette */
          --bg-base: #0C0C0C;
          --bg-surface: #141414;
          --bg-elevated: #1C1C1C;
          --bg-card: #1A1A1A;
          --bg-hover: #242424;
          
          /* Borders */
          --border-subtle: #2A2A2A;
          --border-default: #333333;
          --border-focus: #4ADE80;
          
          /* Primary Accents */
          --accent-green: #4ADE80;
          --accent-green-dim: rgba(74, 222, 128, 0.15);
          --accent-green-glow: rgba(74, 222, 128, 0.25);
          
          /* Secondary Accents */
          --accent-orange: #FB923C;
          --accent-orange-dim: rgba(251, 146, 60, 0.15);
          --accent-yellow: #FBBF24;
          --accent-coral: #F87171;
          
          /* Text */
          --text-primary: #FFFFFF;
          --text-secondary: #A3A3A3;
          --text-muted: #737373;
          --text-ghost: #525252;
          
          /* Typography */
          --font-sans: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', system-ui, sans-serif;
          --font-mono: 'SF Mono', 'Fira Code', 'Consolas', monospace;
          
          /* Spacing */
          --space-1: 4px;
          --space-2: 8px;
          --space-3: 12px;
          --space-4: 16px;
          --space-5: 20px;
          --space-6: 24px;
          --space-8: 32px;
          --space-10: 40px;
          
          /* Radii */
          --radius-sm: 8px;
          --radius-md: 12px;
          --radius-lg: 16px;
          --radius-xl: 24px;
          --radius-full: 9999px;
          
          /* Shadows */
          --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.3);
          --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.4);
          --shadow-glow-green: 0 0 20px rgba(74, 222, 128, 0.3);
          --shadow-glow-orange: 0 0 20px rgba(251, 146, 60, 0.3);
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
          font-family: var(--font-sans);
          background: var(--bg-base);
          color: var(--text-primary);
          line-height: 1.5;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        /* Scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: var(--border-default);
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: var(--text-ghost);
        }

        ::selection {
          background: var(--accent-green-dim);
          color: var(--accent-green);
        }
      `}</style>

      <div className={`app ${isSessionActive ? 'session-active' : ''}`}>
        {/* Sidebar */}
        <aside className="sidebar">
          {/* Logo */}
          <div className="logo">
            <div className="logo-mark">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="10" fill="url(#logo-bg)" />
                <path
                  d="M16 8C11.582 8 8 11.582 8 16s3.582 8 8 8 8-3.582 8-8-3.582-8-8-8zm0 14c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6z"
                  fill="var(--bg-base)"
                  fillOpacity="0.3"
                />
                <path
                  d="M16 10v6l4.5 2.5"
                  stroke="var(--bg-base)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <defs>
                  <linearGradient id="logo-bg" x1="0" y1="0" x2="32" y2="32">
                    <stop stopColor="#4ADE80" />
                    <stop offset="1" stopColor="#22C55E" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Nav Icons */}
          <nav className="sidebar-nav">
            <button
              className={`nav-icon ${currentView === 'dashboard' ? 'active' : ''}`}
              onClick={() => setCurrentView('dashboard')}
              title="Dashboard"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="7" height="9" rx="2" />
                <rect x="14" y="3" width="7" height="5" rx="2" />
                <rect x="14" y="12" width="7" height="9" rx="2" />
                <rect x="3" y="16" width="7" height="5" rx="2" />
              </svg>
            </button>

            <button
              className={`nav-icon ${currentView === 'analytics' ? 'active' : ''}`}
              onClick={() => setCurrentView('analytics')}
              title="Analytics"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 3v18h18" />
                <path d="M18 9l-5 5-4-4-3 3" />
              </svg>
            </button>

            <button
              className={`nav-icon ${currentView === 'settings' ? 'active' : ''}`}
              onClick={() => setCurrentView('settings')}
              title="Settings"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v4m0 14v4M4.22 4.22l2.83 2.83m9.9 9.9l2.83 2.83M1 12h4m14 0h4M4.22 19.78l2.83-2.83m9.9-9.9l2.83-2.83" />
              </svg>
            </button>
          </nav>

          {/* Bottom spacer */}
          <div className="sidebar-bottom">
            <div className="session-indicator" data-active={isSessionActive}>
              <span className="indicator-dot" />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="main-wrapper">
          {/* Top Bar */}
          <header className="topbar">
            {/* Nav Pills */}
            <div className="nav-pills">
              <button
                className={`pill ${currentView === 'dashboard' ? 'active' : ''}`}
                onClick={() => setCurrentView('dashboard')}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                Focus
              </button>
              <button
                className={`pill ${currentView === 'analytics' ? 'active' : ''}`}
                onClick={() => setCurrentView('analytics')}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="12" width="4" height="9" rx="1" />
                  <rect x="10" y="8" width="4" height="13" rx="1" />
                  <rect x="17" y="3" width="4" height="18" rx="1" />
                </svg>
                Analytics
              </button>
              <button
                className={`pill ${currentView === 'settings' ? 'active' : ''}`}
                onClick={() => setCurrentView('settings')}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
                </svg>
                Settings
              </button>
            </div>

            {/* Right side */}
            <div className="topbar-right">
              <div className="datetime">
                <span className="time">{formatTime(currentTime)}</span>
                <span className="date">{formatDate(currentTime)}</span>
              </div>

              <div className="user-avatar">
                <span>FF</span>
              </div>
            </div>
          </header>

          {/* Page Title */}
          <div className="page-header">
            <h1 className="page-title">
              {currentView === 'dashboard' && 'FOCUS FRIEND'}
              {currentView === 'analytics' && 'ANALYTICS'}
              {currentView === 'settings' && 'SETTINGS'}
            </h1>
          </div>

          {/* Content Area */}
          <main className="content">
            {currentView === 'analytics' ? (
              <AnalyticsDashboard
                onClose={() => setCurrentView('dashboard')}
                showDemoButton={true}
              />
            ) : currentView === 'settings' ? (
              <NudgeSettings onConfigChange={handleConfigChange} />
            ) : (
              <ActivityStatus showDetails={true} onSessionStateChange={setIsSessionActive} />
            )}
          </main>
        </div>

        {/* Nudge overlays */}
        {currentNudge && !showOverlay && (
          <NudgeToast nudge={currentNudge} onDismiss={() => acknowledgeNudge(currentNudge.id)} />
        )}

        {showOverlay && currentNudge && (
          <NudgeOverlay nudge={currentNudge} onAction={handleOverlayAction} />
        )}
      </div>

      {/* Component Styles */}
      <style>{`
        .app {
          display: flex;
          min-height: 100vh;
          background: var(--bg-base);
        }

        /* === SIDEBAR === */
        .sidebar {
          width: 72px;
          background: var(--bg-surface);
          border-right: 1px solid var(--border-subtle);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: var(--space-4) 0;
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          z-index: 100;
        }

        .logo {
          margin-bottom: var(--space-8);
        }

        .logo-mark {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .logo-mark:hover {
          transform: scale(1.05);
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .nav-icon {
          width: 44px;
          height: 44px;
          border: none;
          background: transparent;
          border-radius: var(--radius-md);
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .nav-icon:hover {
          background: var(--bg-hover);
          color: var(--text-secondary);
        }

        .nav-icon.active {
          background: var(--accent-green-dim);
          color: var(--accent-green);
        }

        .sidebar-bottom {
          margin-top: auto;
          padding: var(--space-4);
        }

        .session-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--bg-elevated);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .session-indicator[data-active="true"] .indicator-dot {
          width: 8px;
          height: 8px;
          background: var(--accent-green);
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.9); }
        }

        /* === MAIN WRAPPER === */
        .main-wrapper {
          flex: 1;
          margin-left: 72px;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        /* === TOP BAR === */
        .topbar {
          height: 64px;
          padding: 0 var(--space-6);
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border-subtle);
          background: var(--bg-surface);
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .nav-pills {
          display: flex;
          gap: var(--space-2);
          padding: var(--space-1);
          background: var(--bg-elevated);
          border-radius: var(--radius-full);
        }

        .pill {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-4);
          border: none;
          background: transparent;
          border-radius: var(--radius-full);
          color: var(--text-muted);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .pill:hover {
          color: var(--text-secondary);
        }

        .pill.active {
          background: var(--bg-base);
          color: var(--text-primary);
          box-shadow: var(--shadow-sm);
        }

        .topbar-right {
          display: flex;
          align-items: center;
          gap: var(--space-6);
        }

        .datetime {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
        }

        .time {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .date {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .user-avatar {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-md);
          background: linear-gradient(135deg, var(--accent-green) 0%, var(--accent-orange) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--bg-base);
          cursor: pointer;
        }

        /* === PAGE HEADER === */
        .page-header {
          padding: var(--space-6) var(--space-6) var(--space-4);
        }

        .page-title {
          font-size: 2rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: var(--text-primary);
        }

        /* === CONTENT === */
        .content {
          flex: 1;
          padding: 0 var(--space-6) var(--space-6);
          overflow-y: auto;
        }

        /* === RESPONSIVE === */
        @media (max-width: 768px) {
          .sidebar {
            width: 60px;
          }

          .main-wrapper {
            margin-left: 60px;
          }

          .nav-pills {
            display: none;
          }

          .page-title {
            font-size: 1.5rem;
          }

          .topbar {
            padding: 0 var(--space-4);
          }

          .content {
            padding: 0 var(--space-4) var(--space-4);
          }
        }
      `}</style>
    </>
  );
}

export default App;
