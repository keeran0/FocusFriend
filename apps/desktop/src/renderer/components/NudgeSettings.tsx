/**
 * NudgeSettings - Final Polished Version
 * Tutorial 15: Production Polish
 *
 * Settings panel with new design system
 */

import { useState, useEffect, useCallback } from 'react';

interface NudgeConfig {
  enabled: boolean;
  level: number;
  soundEnabled: boolean;
  idleThreshold: number;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

interface NudgeSettingsProps {
  onConfigChange?: (config: Partial<NudgeConfig>) => void;
}

const DEFAULT_CONFIG: NudgeConfig = {
  enabled: true,
  level: 2,
  soundEnabled: true,
  idleThreshold: 300,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
};

const INTENSITY_LEVELS = [
  { value: 1, label: 'Gentle', description: 'Subtle reminders', icon: '🌊' },
  { value: 2, label: 'Balanced', description: 'Regular nudges', icon: '⚖️' },
  { value: 3, label: 'Persistent', description: 'Frequent alerts', icon: '🔔' },
  { value: 4, label: 'Intense', description: 'Hard to ignore', icon: '⚡' },
];

const THRESHOLD_OPTIONS = [
  { value: 60, label: '1 minute' },
  { value: 180, label: '3 minutes' },
  { value: 300, label: '5 minutes' },
  { value: 600, label: '10 minutes' },
  { value: 900, label: '15 minutes' },
];

export function NudgeSettings({ onConfigChange }: NudgeSettingsProps) {
  const [config, setConfig] = useState<NudgeConfig>(DEFAULT_CONFIG);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('focus-friend-nudge-config');
      if (saved) {
        setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(saved) });
      }
    } catch (e) {
      console.error('Failed to load nudge config:', e);
    }
  }, []);

  const updateConfig = useCallback(
    (updates: Partial<NudgeConfig>) => {
      setConfig(prev => {
        const newConfig = { ...prev, ...updates };
        localStorage.setItem('focus-friend-nudge-config', JSON.stringify(newConfig));
        onConfigChange?.(updates);
        return newConfig;
      });
      setHasChanges(true);
      setTimeout(() => setHasChanges(false), 2000);
    },
    [onConfigChange]
  );

  return (
    <div className="settings-container">
      <div className="settings-grid">
        {/* Nudge Settings Card */}
        <div className="settings-card">
          <div className="card-header">
            <div className="card-icon">🔔</div>
            <div>
              <h3>Nudge Settings</h3>
              <p>Configure how Focus Friend keeps you on track</p>
            </div>
          </div>

          {/* Master Toggle */}
          <div className="setting-row">
            <div className="setting-info">
              <span className="setting-label">Enable Nudges</span>
              <span className="setting-desc">Get reminders when you're idle</span>
            </div>
            <button
              className={`toggle ${config.enabled ? 'active' : ''}`}
              onClick={() => updateConfig({ enabled: !config.enabled })}
            >
              <span className="toggle-track">
                <span className="toggle-thumb" />
              </span>
            </button>
          </div>

          {/* Sound Toggle */}
          <div className="setting-row">
            <div className="setting-info">
              <span className="setting-label">Sound Effects</span>
              <span className="setting-desc">Play sounds with notifications</span>
            </div>
            <button
              className={`toggle ${config.soundEnabled ? 'active' : ''}`}
              onClick={() => updateConfig({ soundEnabled: !config.soundEnabled })}
              disabled={!config.enabled}
            >
              <span className="toggle-track">
                <span className="toggle-thumb" />
              </span>
            </button>
          </div>

          {/* Idle Threshold */}
          <div className="setting-row column">
            <div className="setting-info">
              <span className="setting-label">Idle Detection</span>
              <span className="setting-desc">Time before considering you idle</span>
            </div>
            <div className="threshold-options">
              {THRESHOLD_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className={`threshold-btn ${config.idleThreshold === opt.value ? 'active' : ''}`}
                  onClick={() => updateConfig({ idleThreshold: opt.value })}
                  disabled={!config.enabled}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Intensity Card */}
        <div className="settings-card">
          <div className="card-header">
            <div className="card-icon">⚡</div>
            <div>
              <h3>Nudge Intensity</h3>
              <p>How persistent should reminders be?</p>
            </div>
          </div>

          <div className="intensity-grid">
            {INTENSITY_LEVELS.map(level => (
              <button
                key={level.value}
                className={`intensity-card ${config.level === level.value ? 'active' : ''}`}
                onClick={() => updateConfig({ level: level.value })}
                disabled={!config.enabled}
              >
                <span className="intensity-icon">{level.icon}</span>
                <span className="intensity-label">{level.label}</span>
                <span className="intensity-desc">{level.description}</span>
              </button>
            ))}
          </div>

          <div className="intensity-bar">
            <div className="intensity-fill" style={{ width: `${(config.level / 4) * 100}%` }} />
            <div className="intensity-markers">
              {[1, 2, 3, 4].map(i => (
                <span key={i} className={`marker ${config.level >= i ? 'active' : ''}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Quiet Hours Card */}
        <div className="settings-card">
          <div className="card-header">
            <div className="card-icon">🌙</div>
            <div>
              <h3>Quiet Hours</h3>
              <p>Pause notifications during specific times</p>
            </div>
          </div>

          <div className="setting-row">
            <div className="setting-info">
              <span className="setting-label">Enable Quiet Hours</span>
              <span className="setting-desc">Silence nudges during set times</span>
            </div>
            <button
              className={`toggle ${config.quietHoursEnabled ? 'active' : ''}`}
              onClick={() => updateConfig({ quietHoursEnabled: !config.quietHoursEnabled })}
            >
              <span className="toggle-track">
                <span className="toggle-thumb" />
              </span>
            </button>
          </div>

          {config.quietHoursEnabled && (
            <div className="time-range">
              <div className="time-input">
                <label>From</label>
                <input
                  type="time"
                  value={config.quietHoursStart}
                  onChange={e => updateConfig({ quietHoursStart: e.target.value })}
                />
              </div>
              <span className="time-separator">→</span>
              <div className="time-input">
                <label>To</label>
                <input
                  type="time"
                  value={config.quietHoursEnd}
                  onChange={e => updateConfig({ quietHoursEnd: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>

        {/* About Card */}
        <div className="settings-card about-card">
          <div className="card-header">
            <div className="card-icon">✨</div>
            <div>
              <h3>About Focus Friend</h3>
              <p>Your productivity companion</p>
            </div>
          </div>

          <div className="about-content">
            <div className="version-info">
              <span className="version-label">Version</span>
              <span className="version-value">1.0.0</span>
            </div>
            <p className="about-text">
              Focus Friend helps you stay productive by tracking your focus sessions and gently
              nudging you when you drift off task.
            </p>
            <div className="about-links">
              <button className="link-btn">Documentation</button>
              <button className="link-btn">Report Issue</button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Indicator */}
      {hasChanges && (
        <div className="save-toast">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
          Settings saved
        </div>
      )}

      <style>{`
        .settings-container {
          max-width: 800px;
          margin: 0 auto;
        }

        .settings-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-4, 16px);
        }

        @media (max-width: 700px) {
          .settings-grid {
            grid-template-columns: 1fr;
          }
        }

        /* === SETTINGS CARD === */
        .settings-card {
          background: var(--bg-card, #1A1A1A);
          border: 1px solid var(--border-subtle, #2A2A2A);
          border-radius: var(--radius-xl, 24px);
          padding: var(--space-5, 20px);
        }

        .card-header {
          display: flex;
          gap: var(--space-3, 12px);
          margin-bottom: var(--space-5, 20px);
        }

        .card-icon {
          width: 40px;
          height: 40px;
          background: var(--bg-elevated, #1C1C1C);
          border-radius: var(--radius-md, 12px);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
        }

        .card-header h3 {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary, #FFFFFF);
          margin-bottom: 2px;
        }

        .card-header p {
          font-size: 0.8rem;
          color: var(--text-muted, #737373);
        }

        /* === SETTING ROW === */
        .setting-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-4, 16px) 0;
          border-bottom: 1px solid var(--border-subtle, #2A2A2A);
        }

        .setting-row:last-child {
          border-bottom: none;
        }

        .setting-row.column {
          flex-direction: column;
          align-items: stretch;
          gap: var(--space-4, 16px);
        }

        .setting-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .setting-label {
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-primary, #FFFFFF);
        }

        .setting-desc {
          font-size: 0.75rem;
          color: var(--text-muted, #737373);
        }

        /* === TOGGLE === */
        .toggle {
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
        }

        .toggle:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .toggle-track {
          display: block;
          width: 44px;
          height: 24px;
          background: var(--border-default, #333333);
          border-radius: 12px;
          position: relative;
          transition: background 0.2s ease;
        }

        .toggle.active .toggle-track {
          background: var(--accent-green, #4ADE80);
        }

        .toggle-thumb {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 20px;
          height: 20px;
          background: var(--text-primary, #FFFFFF);
          border-radius: 50%;
          transition: transform 0.2s ease;
        }

        .toggle.active .toggle-thumb {
          transform: translateX(20px);
        }

        /* === THRESHOLD OPTIONS === */
        .threshold-options {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-2, 8px);
        }

        .threshold-btn {
          padding: var(--space-2, 8px) var(--space-3, 12px);
          background: var(--bg-elevated, #1C1C1C);
          border: 1px solid var(--border-subtle, #2A2A2A);
          border-radius: var(--radius-full, 9999px);
          font-size: 0.8rem;
          color: var(--text-secondary, #A3A3A3);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .threshold-btn:hover:not(:disabled) {
          border-color: var(--border-default, #333333);
          color: var(--text-primary, #FFFFFF);
        }

        .threshold-btn.active {
          background: var(--accent-green-dim, rgba(74, 222, 128, 0.15));
          border-color: var(--accent-green, #4ADE80);
          color: var(--accent-green, #4ADE80);
        }

        .threshold-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        /* === INTENSITY GRID === */
        .intensity-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-3, 12px);
          margin-bottom: var(--space-4, 16px);
        }

        .intensity-card {
          padding: var(--space-4, 16px);
          background: var(--bg-elevated, #1C1C1C);
          border: 1px solid var(--border-subtle, #2A2A2A);
          border-radius: var(--radius-lg, 16px);
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .intensity-card:hover:not(:disabled) {
          border-color: var(--border-default, #333333);
        }

        .intensity-card.active {
          border-color: var(--accent-green, #4ADE80);
          background: var(--accent-green-dim, rgba(74, 222, 128, 0.15));
        }

        .intensity-card:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .intensity-icon {
          display: block;
          font-size: 1.5rem;
          margin-bottom: var(--space-2, 8px);
        }

        .intensity-label {
          display: block;
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-primary, #FFFFFF);
          margin-bottom: 2px;
        }

        .intensity-desc {
          font-size: 0.7rem;
          color: var(--text-muted, #737373);
        }

        /* === INTENSITY BAR === */
        .intensity-bar {
          position: relative;
          height: 6px;
          background: var(--border-subtle, #2A2A2A);
          border-radius: 3px;
        }

        .intensity-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--accent-green, #4ADE80), var(--accent-orange, #FB923C));
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .intensity-markers {
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          transform: translateY(-50%);
          display: flex;
          justify-content: space-between;
          padding: 0 4px;
        }

        .marker {
          width: 8px;
          height: 8px;
          background: var(--bg-card, #1A1A1A);
          border: 2px solid var(--border-default, #333333);
          border-radius: 50%;
          transition: all 0.2s ease;
        }

        .marker.active {
          background: var(--accent-green, #4ADE80);
          border-color: var(--accent-green, #4ADE80);
        }

        /* === TIME RANGE === */
        .time-range {
          display: flex;
          align-items: center;
          gap: var(--space-4, 16px);
          padding-top: var(--space-4, 16px);
        }

        .time-input {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: var(--space-2, 8px);
        }

        .time-input label {
          font-size: 0.75rem;
          color: var(--text-muted, #737373);
        }

        .time-input input {
          padding: var(--space-3, 12px);
          background: var(--bg-elevated, #1C1C1C);
          border: 1px solid var(--border-subtle, #2A2A2A);
          border-radius: var(--radius-md, 12px);
          color: var(--text-primary, #FFFFFF);
          font-size: 0.9rem;
        }

        .time-input input:focus {
          outline: none;
          border-color: var(--accent-green, #4ADE80);
        }

        .time-separator {
          color: var(--text-muted, #737373);
          margin-top: 20px;
        }

        /* === ABOUT CARD === */
        .about-card {
          grid-column: 1 / -1;
        }

        .about-content {
          padding-top: var(--space-4, 16px);
          border-top: 1px solid var(--border-subtle, #2A2A2A);
        }

        .version-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: var(--space-4, 16px);
        }

        .version-label {
          font-size: 0.85rem;
          color: var(--text-muted, #737373);
        }

        .version-value {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--accent-green, #4ADE80);
        }

        .about-text {
          font-size: 0.85rem;
          color: var(--text-secondary, #A3A3A3);
          line-height: 1.6;
          margin-bottom: var(--space-4, 16px);
        }

        .about-links {
          display: flex;
          gap: var(--space-3, 12px);
        }

        .link-btn {
          padding: var(--space-2, 8px) var(--space-4, 16px);
          background: var(--bg-elevated, #1C1C1C);
          border: 1px solid var(--border-subtle, #2A2A2A);
          border-radius: var(--radius-full, 9999px);
          font-size: 0.8rem;
          color: var(--text-secondary, #A3A3A3);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .link-btn:hover {
          border-color: var(--border-default, #333333);
          color: var(--text-primary, #FFFFFF);
        }

        /* === SAVE TOAST === */
        .save-toast {
          position: fixed;
          bottom: var(--space-6, 24px);
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: var(--space-2, 8px);
          padding: var(--space-3, 12px) var(--space-5, 20px);
          background: var(--accent-green, #4ADE80);
          color: var(--bg-base, #0C0C0C);
          border-radius: var(--radius-full, 9999px);
          font-size: 0.85rem;
          font-weight: 600;
          box-shadow: var(--shadow-glow-green, 0 0 20px rgba(74, 222, 128, 0.3));
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

export default NudgeSettings;
