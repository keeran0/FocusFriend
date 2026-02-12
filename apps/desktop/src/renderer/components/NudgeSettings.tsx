/**
 * Nudge Settings Component
 * Configure nudge behavior and idle threshold
 */

import { useState, useEffect } from 'react';

type NudgeLevel = 1 | 2 | 3;

interface NudgeConfig {
  enabled: boolean;
  level: NudgeLevel;
  soundEnabled: boolean;
  idleThreshold: number;
  quietHoursEnabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

// Storage key for settings
const SETTINGS_KEY = 'focus-friend-settings';

// Level info with multiplier-based timing
const LEVEL_INFO: Record<
  NudgeLevel,
  {
    name: string;
    icon: string;
    description: string;
    warningMultiplier: number;
    pauseMultiplier: number;
  }
> = {
  1: {
    name: 'Gentle',
    icon: '🌱',
    description: 'Silent notifications, relaxed timing',
    warningMultiplier: 2.5,
    pauseMultiplier: 5,
  },
  2: {
    name: 'Moderate',
    icon: '⚡',
    description: 'Sound alerts, balanced timing',
    warningMultiplier: 2,
    pauseMultiplier: 3,
  },
  3: {
    name: 'Focused',
    icon: '🔥',
    description: 'Popup + sound, quick response',
    warningMultiplier: 0,
    pauseMultiplier: 1,
  },
};

interface NudgeSettingsProps {
  onConfigChange: (config: Partial<NudgeConfig>) => void;
}

const DEFAULT_CONFIG: NudgeConfig = {
  enabled: true,
  level: 2,
  soundEnabled: true,
  idleThreshold: 30,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
};

function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }
  return `${minutes}m ${remainingSeconds}s`;
}

function loadSettings(): NudgeConfig {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch (e) {
    console.error('[NudgeSettings] Failed to load settings:', e);
  }
  return DEFAULT_CONFIG;
}

function saveSettings(config: NudgeConfig): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('[NudgeSettings] Failed to save settings:', e);
  }
}

export function NudgeSettings({ onConfigChange }: NudgeSettingsProps) {
  const [config, setConfig] = useState<NudgeConfig>(() => loadSettings());

  // On mount, sync settings to main process
  useEffect(() => {
    console.log('[NudgeSettings] Loaded settings:', config);

    if (window.electronAPI?.activity?.setIdleThreshold) {
      window.electronAPI.activity.setIdleThreshold(config.idleThreshold);
    }

    if (window.electronAPI?.nudge?.updateConfig) {
      window.electronAPI.nudge.updateConfig(config);
    }
  }, []);

  const handleChange = <K extends keyof NudgeConfig>(key: K, value: NudgeConfig[K]) => {
    const updated = { ...config, [key]: value };
    setConfig(updated);
    saveSettings(updated);
    onConfigChange({ [key]: value });

    if (window.electronAPI?.nudge?.updateConfig) {
      window.electronAPI.nudge.updateConfig({ [key]: value });
    }
  };

  const handleIdleThresholdChange = (threshold: number) => {
    console.log('[NudgeSettings] Setting idle threshold to:', threshold);
    const updated = { ...config, idleThreshold: threshold };
    setConfig(updated);
    saveSettings(updated);
    onConfigChange({ idleThreshold: threshold });

    if (window.electronAPI?.activity?.setIdleThreshold) {
      window.electronAPI.activity.setIdleThreshold(threshold);
    }

    if (window.electronAPI?.nudge?.updateConfig) {
      window.electronAPI.nudge.updateConfig({ idleThreshold: threshold });
    }
  };

  const levelInfo = LEVEL_INFO[config.level];

  // Calculate times based on multipliers
  const getWarningTime = (level: NudgeLevel): string => {
    const info = LEVEL_INFO[level];
    if (info.warningMultiplier === 0) return 'Immediate';
    const seconds = config.idleThreshold * info.warningMultiplier;
    return formatTime(seconds);
  };

  const getAutoPauseTime = (level: NudgeLevel): string => {
    const info = LEVEL_INFO[level];
    const seconds = config.idleThreshold * info.pauseMultiplier;
    return formatTime(seconds);
  };

  return (
    <div className="nudge-settings">
      <div className="settings-header">
        <h2>⚙️ Focus Settings</h2>
        <p>Customize how Focus Friend helps you stay on track</p>
      </div>

      {/* Enable/Disable */}
      <div className="setting-section">
        <div className="toggle-setting">
          <div className="toggle-info">
            <span className="toggle-label">Enable Nudges</span>
            <span className="toggle-desc">Get reminders when you're idle</span>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={e => handleChange('enabled', e.target.checked)}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>

      {/* Idle Threshold Slider */}
      <div className="setting-section">
        <div className="section-header">
          <h3>⏱️ Idle Detection</h3>
          <span className="threshold-value">{formatTime(config.idleThreshold)}</span>
        </div>
        <p className="section-desc">Time of inactivity before you're considered idle</p>

        <div className="slider-container">
          <input
            type="range"
            min="15"
            max="300"
            step="15"
            value={config.idleThreshold}
            onChange={e => handleIdleThresholdChange(Number(e.target.value))}
            className="threshold-slider"
          />
          <div className="slider-labels">
            <span>15s</span>
            <span>5m</span>
          </div>
        </div>
      </div>

      {/* Nudge Level */}
      <div className="setting-section">
        <div className="section-header">
          <h3>🎚️ Nudge Intensity</h3>
        </div>
        <p className="section-desc">How aggressively you want to be reminded</p>

        <div className="level-cards">
          {([1, 2, 3] as NudgeLevel[]).map(level => {
            const info = LEVEL_INFO[level];
            const isSelected = config.level === level;
            return (
              <button
                key={level}
                className={`level-card ${isSelected ? 'active' : ''}`}
                onClick={() => handleChange('level', level)}
              >
                <div className="level-icon">{info.icon}</div>
                <div className="level-content">
                  <span className="level-name">{info.name}</span>
                  <span className="level-desc">{info.description}</span>
                  <div className="level-timing">
                    {level === 3 ? (
                      <span>Auto-pause: {getAutoPauseTime(level)} after idle</span>
                    ) : (
                      <span>
                        Warning: {getWarningTime(level)} • Pause: {getAutoPauseTime(level)}
                      </span>
                    )}
                  </div>
                </div>
                {isSelected && <span className="check-icon">✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sound Toggle */}
      <div className="setting-section">
        <div className="toggle-setting">
          <div className="toggle-info">
            <span className="toggle-label">🔊 Sound Effects</span>
            <span className="toggle-desc">Play sound with notifications</span>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={config.soundEnabled}
              onChange={e => handleChange('soundEnabled', e.target.checked)}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="setting-section">
        <div className="toggle-setting">
          <div className="toggle-info">
            <span className="toggle-label">🌙 Quiet Hours</span>
            <span className="toggle-desc">Disable notifications during set times</span>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={config.quietHoursEnabled}
              onChange={e => handleChange('quietHoursEnabled', e.target.checked)}
            />
            <span className="slider"></span>
          </label>
        </div>

        {config.quietHoursEnabled && (
          <div className="time-range">
            <input
              type="time"
              value={config.quietHoursStart || '22:00'}
              onChange={e => handleChange('quietHoursStart', e.target.value)}
            />
            <span className="time-separator">to</span>
            <input
              type="time"
              value={config.quietHoursEnd || '08:00'}
              onChange={e => handleChange('quietHoursEnd', e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Current Summary */}
      <div className="summary-card">
        <h4>📋 Your Current Setup</h4>
        <div className="summary-items">
          <div className="summary-item">
            <span className="summary-label">Idle detection</span>
            <span className="summary-value">{formatTime(config.idleThreshold)}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Nudge style</span>
            <span className="summary-value">
              {levelInfo.icon} {levelInfo.name}
            </span>
          </div>
          {config.level !== 3 && (
            <div className="summary-item">
              <span className="summary-label">Second warning</span>
              <span className="summary-value">{getWarningTime(config.level)} after idle</span>
            </div>
          )}
          <div className="summary-item highlight">
            <span className="summary-label">Auto-pause</span>
            <span className="summary-value">{getAutoPauseTime(config.level)} after idle</span>
          </div>
        </div>
      </div>

      <style>{`
        .nudge-settings {
          background: var(--color-bg-card);
          border-radius: var(--radius-xl);
          padding: var(--spacing-xl);
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--color-border);
        }

        .settings-header {
          margin-bottom: var(--spacing-xl);
        }

        .settings-header h2 {
          font-size: var(--font-size-xl);
          font-weight: 700;
          margin-bottom: var(--spacing-xs);
        }

        .settings-header p {
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
        }

        .setting-section {
          padding: var(--spacing-lg) 0;
          border-bottom: 1px solid var(--color-border);
        }

        .setting-section:last-of-type {
          border-bottom: none;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-xs);
        }

        .section-header h3 {
          font-size: var(--font-size-base);
          font-weight: 600;
        }

        .threshold-value {
          background: var(--color-accent);
          color: white;
          padding: var(--spacing-xs) var(--spacing-md);
          border-radius: var(--radius-lg);
          font-size: var(--font-size-sm);
          font-weight: 600;
        }

        .section-desc {
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
          margin-bottom: var(--spacing-md);
        }

        .toggle-setting {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .toggle-info {
          display: flex;
          flex-direction: column;
        }

        .toggle-label {
          font-weight: 600;
        }

        .toggle-desc {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .switch {
          position: relative;
          display: inline-block;
          width: 52px;
          height: 28px;
        }

        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .switch .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: var(--color-bg-secondary);
          transition: 0.3s;
          border-radius: 28px;
        }

        .switch .slider:before {
          position: absolute;
          content: "";
          height: 20px;
          width: 20px;
          left: 4px;
          bottom: 4px;
          background-color: white;
          transition: 0.3s;
          border-radius: 50%;
        }

        .switch input:checked + .slider {
          background-color: var(--color-accent);
        }

        .switch input:checked + .slider:before {
          transform: translateX(24px);
        }

        .slider-container {
          padding: var(--spacing-sm) 0;
        }

        .threshold-slider {
          width: 100%;
          height: 8px;
          border-radius: 4px;
          background: var(--color-bg-secondary);
          outline: none;
          -webkit-appearance: none;
          appearance: none;
        }

        .threshold-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--color-accent);
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          transition: transform 0.15s ease;
        }

        .threshold-slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }

        .slider-labels {
          display: flex;
          justify-content: space-between;
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
          margin-top: var(--spacing-xs);
        }

        .level-cards {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .level-card {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          padding: var(--spacing-md);
          background: var(--color-bg-secondary);
          border: 2px solid var(--color-border);
          border-radius: var(--radius-lg);
          cursor: pointer;
          text-align: left;
          transition: all var(--transition-fast);
        }

        .level-card:hover {
          border-color: var(--color-text-secondary);
        }

        .level-card.active {
          border-color: var(--color-accent);
          background: rgba(233, 69, 96, 0.1);
        }

        .level-icon {
          font-size: 1.5rem;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-bg-card);
          border-radius: var(--radius-md);
          flex-shrink: 0;
        }

        .level-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .level-name {
          font-weight: 600;
          color: var(--color-text-primary);
        }

        .level-desc {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .level-timing {
          font-size: var(--font-size-xs);
          color: var(--color-accent);
          margin-top: 2px;
        }

        .check-icon {
          color: var(--color-accent);
          font-weight: bold;
          font-size: var(--font-size-lg);
          flex-shrink: 0;
        }

        .time-range {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          margin-top: var(--spacing-md);
          padding: var(--spacing-md);
          background: var(--color-bg-secondary);
          border-radius: var(--radius-md);
        }

        .time-range input {
          padding: var(--spacing-sm) var(--spacing-md);
          border: 1px solid var(--color-border);
          background: var(--color-bg-card);
          color: var(--color-text-primary);
          border-radius: var(--radius-sm);
          font-size: var(--font-size-base);
        }

        .time-separator {
          color: var(--color-text-secondary);
        }

        .summary-card {
          background: linear-gradient(135deg, var(--color-bg-secondary) 0%, rgba(233, 69, 96, 0.05) 100%);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
          margin-top: var(--spacing-lg);
        }

        .summary-card h4 {
          font-size: var(--font-size-base);
          margin-bottom: var(--spacing-md);
        }

        .summary-items {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          padding: var(--spacing-xs) 0;
        }

        .summary-item.highlight {
          background: rgba(233, 69, 96, 0.1);
          margin: 0 calc(-1 * var(--spacing-md));
          padding: var(--spacing-sm) var(--spacing-md);
          border-radius: var(--radius-sm);
        }

        .summary-label {
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
        }

        .summary-value {
          font-weight: 600;
          font-size: var(--font-size-sm);
        }

        .summary-item.highlight .summary-value {
          color: var(--color-accent);
        }
      `}</style>
    </div>
  );
}
