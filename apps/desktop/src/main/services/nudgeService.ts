/**
 * Nudge Service
 * Manages nudge delivery with stage-based escalation using idle threshold multipliers
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import type {
  NudgeConfig,
  NudgeLevel,
  Nudge,
  NudgeEvent,
  NudgeLevelConfig,
  NudgeStage,
} from '../../shared/types/nudge.js';
import { NUDGE_LEVELS, DEFAULT_NUDGE_CONFIG } from '../../shared/types/nudge.js';
import { getNudgeMessage } from '../../shared/data/nudgeTemplates.js';

class NudgeService extends EventEmitter {
  private config: NudgeConfig;
  private currentSessionId: string | null = null;
  private isIdle = false;
  private currentStage = 0;
  private stageTimeouts: NodeJS.Timeout[] = [];
  private nudgeHistory: Nudge[] = [];

  constructor(config: Partial<NudgeConfig> = {}) {
    super();
    this.config = { ...DEFAULT_NUDGE_CONFIG, ...config };
    console.log('[NudgeService] Initialized with config:', this.config);
  }

  public updateConfig(config: Partial<NudgeConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('[NudgeService] Updated config:', this.config);
  }

  public getConfig(): NudgeConfig {
    return { ...this.config };
  }

  public startSession(sessionId: string): void {
    this.currentSessionId = sessionId;
    this.isIdle = false;
    this.currentStage = 0;
    this.clearAllTimeouts();
    console.log('[NudgeService] Starting session:', sessionId);
  }

  public endSession(): void {
    console.log('[NudgeService] Ending session');
    this.currentSessionId = null;
    this.isIdle = false;
    this.currentStage = 0;
    this.clearAllTimeouts();
  }

  public onIdleStart(): void {
    if (!this.config.enabled || !this.currentSessionId) {
      console.log('[NudgeService] Ignoring idle - disabled or no session');
      return;
    }

    if (this.isIdle) {
      console.log('[NudgeService] Already in idle state');
      return;
    }

    console.log('[NudgeService] onIdleStart called');
    this.isIdle = true;
    this.currentStage = 0;
    this.clearAllTimeouts();

    // Start the nudge sequence
    this.scheduleAllStages();
  }

  public onIdleEnd(): void {
    if (!this.isIdle) return;

    console.log('[NudgeService] onIdleEnd called');
    console.log('[NudgeService] User active, clearing nudge sequence');
    this.isIdle = false;
    this.currentStage = 0;
    this.clearAllTimeouts();
  }

  private scheduleAllStages(): void {
    const levelConfig = NUDGE_LEVELS[this.config.level];
    console.log(`[NudgeService] Starting idle sequence with level: ${this.config.level}`);

    levelConfig.stages.forEach((stage, index) => {
      const delayMs = stage.delayMultiplier * this.config.idleThreshold * 1000;

      console.log(
        `[NudgeService] Scheduling stage ${index + 1} with delay: ${delayMs}ms (${stage.delayMultiplier}x threshold)`
      );

      const timeout = setTimeout(() => {
        if (this.isIdle && this.currentSessionId) {
          this.executeStage(index, stage, levelConfig);
        }
      }, delayMs);

      this.stageTimeouts.push(timeout);
    });
  }

  private executeStage(stageIndex: number, stage: NudgeStage, levelConfig: NudgeLevelConfig): void {
    console.log(`[NudgeService] Executing stage ${stageIndex + 1}/${levelConfig.stages.length}:`, {
      delayMultiplier: stage.delayMultiplier,
      notification: stage.notification,
      sound: stage.sound,
      overlay: stage.overlay,
      autoPause: stage.autoPause,
      message: stage.message,
    });

    this.currentStage = stageIndex;

    // Create and deliver the nudge
    const { title, message } = getNudgeMessage(stage.message);

    const nudge: Nudge = {
      id: uuidv4(),
      level: this.config.level,
      stage: stageIndex,
      title,
      message,
      timestamp: new Date(),
      notification: stage.notification,
      sound: stage.sound && this.config.soundEnabled,
      overlay: stage.overlay,
      autoPause: stage.autoPause,
      acknowledged: false,
      sessionId: this.currentSessionId || undefined,
    };

    this.nudgeHistory.push(nudge);
    this.deliverNudge(nudge, stage);

    // Handle auto-pause
    if (stage.autoPause) {
      console.log('[NudgeService] Auto-pause triggered');
      this.emit('auto-pause');
      this.clearAllTimeouts();
      this.isIdle = false;
    }
  }

  private deliverNudge(nudge: Nudge, stage: NudgeStage): void {
    console.log('[NudgeService] Delivering nudge:', {
      stage: nudge.stage + 1,
      notification: nudge.notification,
      sound: nudge.sound,
      overlay: nudge.overlay,
      autoPause: nudge.autoPause,
    });

    const event: NudgeEvent = {
      nudge,
      showOverlay: stage.overlay,
      playSound: nudge.sound,
      autoPause: stage.autoPause,
    };

    this.emit('nudge', event);
  }

  private clearAllTimeouts(): void {
    this.stageTimeouts.forEach(timeout => clearTimeout(timeout));
    this.stageTimeouts = [];
  }

  public acknowledgeNudge(nudgeId: string): void {
    const nudge = this.nudgeHistory.find(n => n.id === nudgeId);
    if (nudge) {
      nudge.acknowledged = true;
      nudge.acknowledgedAt = new Date();
      this.emit('nudge-acknowledged', nudge);
    }
  }

  public getHistory(): Nudge[] {
    return [...this.nudgeHistory];
  }

  public destroy(): void {
    this.clearAllTimeouts();
    this.removeAllListeners();
  }
}

// Singleton instance
let nudgeServiceInstance: NudgeService | null = null;

export function getNudgeService(config?: Partial<NudgeConfig>): NudgeService {
  if (!nudgeServiceInstance) {
    nudgeServiceInstance = new NudgeService(config);
  } else if (config) {
    nudgeServiceInstance.updateConfig(config);
  }
  return nudgeServiceInstance;
}

export function destroyNudgeService(): void {
  if (nudgeServiceInstance) {
    nudgeServiceInstance.destroy();
    nudgeServiceInstance = null;
  }
}
