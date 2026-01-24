import { useState, useEffect } from 'react';
import { ActivityStatus } from './components/ActivityStatus';

function App() {
  const [platform, setPlatform] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    // Get platform from Electron
    if (window.electronAPI) {
      setPlatform(window.electronAPI.getPlatform());
    }

    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎯 Focus Friend</h1>
        <p className="subtitle">Smart Procrastination Manager</p>
      </header>

      <main className="app-main">
        {/* Activity Status - Main Feature */}
        <div className="main-card">
          <ActivityStatus showDetails={true} />
        </div>

        {/* System Info */}
        <div className="side-cards">
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
                <span className="label">Status</span>
                <span className="value status-active">● Connected</span>
              </div>
            </div>
          </div>

          <div className="info-card">
            <h2>Quick Tips</h2>
            <ul>
              <li>🎯 Start a session to track focus</li>
              <li>⏱️ Idle detection after 2 minutes</li>
              <li>🔔 Get nudges when distracted</li>
              <li>📊 Track your focus score</li>
            </ul>
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>Focus Friend v0.0.1 • Built with Electron + React</p>
      </footer>
    </div>
  );
}

export default App;
