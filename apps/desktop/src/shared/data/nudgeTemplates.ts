/**
 * Nudge message templates
 * Research shows varied messages reduce "notification fatigue"
 */

import type { NudgeMessageType } from '../types/nudge';

export interface NudgeMessage {
  title: string;
  body: string;
  emoji: string;
}

// Message templates for each type
const MESSAGES: Record<NudgeMessageType, NudgeMessage[]> = {
  gentle_reminder: [
    {
      emoji: '👋',
      title: 'Quick Check-in',
      body: "Looks like you've stepped away. Your session is still running!",
    },
    {
      emoji: '💭',
      title: 'Still There?',
      body: "Taking a moment? That's okay - just checking in on you.",
    },
    {
      emoji: '🌟',
      title: 'Gentle Reminder',
      body: "Your focus session is waiting for you when you're ready.",
    },
    {
      emoji: '☕',
      title: 'Break Time?',
      body: 'If you need a break, consider pausing your session.',
    },
  ],

  check_in: [
    {
      emoji: '⏰',
      title: 'Time Check',
      body: "You've been away for a while. Ready to jump back in?",
    },
    {
      emoji: '🎯',
      title: 'Focus Reminder',
      body: 'Your goals are waiting! A little effort now pays off later.',
    },
    {
      emoji: '💪',
      title: 'You Got This',
      body: 'Getting distracted is normal. What matters is coming back!',
    },
    {
      emoji: '📚',
      title: 'Session Active',
      body: 'Your timer is still running. Want to continue or take a break?',
    },
  ],

  urgent_warning: [
    {
      emoji: '🚨',
      title: 'Focus Alert',
      body: 'Extended break detected. Are you still working on your task?',
    },
    {
      emoji: '⚡',
      title: 'Session at Risk',
      body: 'Your focus score is dropping. Time to make a decision!',
    },
    {
      emoji: '🔔',
      title: 'Attention Needed',
      body: "You've been idle for a while. Should we pause the session?",
    },
  ],

  session_paused: [
    {
      emoji: '⏸️',
      title: 'Session Auto-Paused',
      body: 'We paused your session to protect your focus score. Resume when ready!',
    },
    {
      emoji: '💤',
      title: 'Taking a Break',
      body: "Your session has been paused. Click to resume when you're back!",
    },
    {
      emoji: '🛑',
      title: 'Session Paused',
      body: "No worries! Your progress is saved. Resume whenever you're ready.",
    },
  ],
};

/**
 * Get a random message for a given type
 */
export function getNudgeMessage(type: NudgeMessageType): NudgeMessage {
  const messages = MESSAGES[type];
  const index = Math.floor(Math.random() * messages.length);
  return messages[index];
}

/**
 * Get time-appropriate greeting prefix
 */
export function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Burning the midnight oil';
}
