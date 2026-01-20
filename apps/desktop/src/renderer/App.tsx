import { useState, useEffect } from 'react';

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

  const handleTestNotification = () => {
    if (window.electronAPI) {
      window.electronAPI.showNotification(
        'Focus Friend',
        'Your notification system is working! 🎉'
      );
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎯 Focus Friend</h1>
        <p className="subtitle">Smart Procrastination Manager</p>
      </header>

      <main className="app-main">
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
              <span className="value status-active">● Active</span>
            </div>
          </div>
        </div>

        <div className="action-card">
          <h2>Quick Actions</h2>
          <div className="button-group">
            <button className="btn btn-primary" onClick={handleTestNotification}>
              Test Notification
            </button>
            <button className="btn btn-secondary" disabled>
              Start Focus Session
            </button>
          </div>
        </div>

        <div className="info-card">
          <h2>Coming Soon</h2>
          <ul>
            <li>🕐 Activity monitoring</li>
            <li>🔔 Smart nudges</li>
            <li>📊 Focus dashboard</li>
            <li>🏆 Achievements & streaks</li>
            <li>👥 Social accountability</li>
          </ul>
        </div>
      </main>

      <footer className="app-footer">
        <p>Focus Friend v0.0.1 • Built with Electron + React</p>
      </footer>
    </div>
  );
}

export default App;
