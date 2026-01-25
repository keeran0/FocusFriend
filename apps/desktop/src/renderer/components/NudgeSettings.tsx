/**
 * Nudge Settings Component
 */

import { useState } from 'react';
import type { NudgeConfig, NudgeFrequency } from '../../shared/types/nudge';

interface NudgeSettingsProps {
  config: NudgeConfig;
  onSave: (config: Partial<NudgeConfig>) => void;
  onTestNudge: (type: string) => void;
}

export function NudgeSettings({ config, onSave, onTestNudge }: NudgeSettingsProps) {
  const [localConfig, setLocalConfig] = useState(config);

  const handleChange = <K extends keyof NudgeConfig>(key: K, value: NudgeConfig[K]) => {
    const updated = { ...localConfig, [key]: value };
    setLocalConfig(updated);
    onSave({ [key]: value });
  };

  return (
    <div className="nudge-settings">
      <h3>Nudge Settings</h3>

      <div className="setting-group">
        <label className="setting-row">
          <span>Enable Nudges</span>
          <input
            type="checkbox"
            checked={localConfig.enabled}
            onChange={e => handleChange('enabled', e.target.checked)}
          />
        </label>

        <label className="setting-row">
          <span>Sound Effects</span>
          <input
            type="checkbox"
            checked={localConfig.soundEnabled}
            onChange={e => handleChange('soundEnabled', e.target.checked)}
          />
        </label>

        <label className="setting-row">
          <span>Escalation</span>
          <input
            type="checkbox"
            checked={localConfig.escalationEnabled}
            onChange={e => handleChange('escalationEnabled', e.target.checked)}
          />
        </label>
      </div>

      <div className="setting-group">
        <label className="setting-label">Nudge Frequency</label>
        <div className="frequency-options">
          {(['gentle', 'moderate', 'aggressive'] as NudgeFrequency[]).map(freq => (
            <button
              key={freq}
              className={`freq-btn ${localConfig.frequency === freq ? 'active' : ''}`}
              onClick={() => handleChange('frequency', freq)}
            >
              {freq.charAt(0).toUpperCase() + freq.slice(1)}
            </button>
          ))}
        </div>
        <p className="setting-hint">
          {localConfig.frequency === 'gentle' && 'Nudges after 3, 5, and 10 minutes of idle time'}
          {localConfig.frequency === 'moderate' && 'Nudges after 2, 3, and 5 minutes of idle time'}
          {localConfig.frequency === 'aggressive' &&
            'Nudges after 1, 2, and 3 minutes of idle time'}
        </p>
      </div>

      <div className="setting-group">
        <label className="setting-label">Quiet Hours</label>
        <div className="time-range">
          <input
            type="time"
            value={localConfig.quietHoursStart || ''}
            onChange={e => handleChange('quietHoursStart', e.target.value || undefined)}
            placeholder="Start"
          />
          <span>to</span>
          <input
            type="time"
            value={localConfig.quietHoursEnd || ''}
            onChange={e => handleChange('quietHoursEnd', e.target.value || undefined)}
            placeholder="End"
          />
        </div>
        <p className="setting-hint">No nudges during quiet hours</p>
      </div>

      <div className="setting-group">
        <label className="setting-label">Test Nudges</label>
        <div className="test-buttons">
          <button onClick={() => onTestNudge('gentle')}>👋 Gentle</button>
          <button onClick={() => onTestNudge('moderate')}>⏰ Moderate</button>
          <button onClick={() => onTestNudge('urgent')}>🚨 Urgent</button>
        </div>
      </div>

      <style>{`
        .nudge-settings {
          background: var(--color-bg-card);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
          border: 1px solid var(--color-border);
        }

        .nudge-settings h3 {
          margin: 0 0 var(--spacing-lg) 0;
          font-size: var(--font-size-lg);
        }

        .setting-group {
          margin-bottom: var(--spacing-lg);
          padding-bottom: var(--spacing-lg);
          border-bottom: 1px solid var(--color-border);
        }

        .setting-group:last-child {
          margin-bottom: 0;
          padding-bottom: 0;
          border-bottom: none;
        }

        .setting-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-sm) 0;
          cursor: pointer;
        }

        .setting-row input[type="checkbox"] {
          width: 20px;
          height: 20px;
          cursor: pointer;
        }

        .setting-label {
          display: block;
          margin-bottom: var(--spacing-sm);
          font-weight: 500;
        }

        .setting-hint {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          margin-top: var(--spacing-xs);
        }

        .frequency-options {
          display: flex;
          gap: var(--spacing-sm);
        }

        .freq-btn {
          flex: 1;
          padding: var(--spacing-sm) var(--spacing-md);
          border: 1px solid var(--color-border);
          background: var(--color-bg-secondary);
          color: var(--color-text-primary);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .freq-btn:hover {
          border-color: var(--color-accent);
        }

        .freq-btn.active {
          background: var(--color-accent);
          border-color: var(--color-accent);
          color: white;
        }

        .time-range {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .time-range input {
          padding: var(--spacing-sm);
          border: 1px solid var(--color-border);
          background: var(--color-bg-secondary);
          color: var(--color-text-primary);
          border-radius: var(--radius-sm);
        }

        .test-buttons {
          display: flex;
          gap: var(--spacing-sm);
        }

        .test-buttons button {
          flex: 1;
          padding: var(--spacing-sm);
          border: 1px solid var(--color-border);
          background: var(--color-bg-secondary);
          color: var(--color-text-primary);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .test-buttons button:hover {
          background: var(--color-bg-card);
          border-color: var(--color-text-secondary);
        }
      `}</style>
    </div>
  );
}
