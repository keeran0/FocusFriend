/**
 * Nudge message templates
 * Variety keeps nudges fresh and less annoying
 */

import type { NudgeTemplate } from '../types/nudge';

export const NUDGE_TEMPLATES: Record<string, NudgeTemplate> = {
  gentle: {
    type: 'gentle',
    emoji: '👋',
    titles: ['Quick Check-in', 'Still There?', 'Gentle Reminder', 'Hey Friend'],
    messages: [
      "Looks like you've stepped away. Ready to jump back in?",
      "Taking a break? That's okay! Let me know when you're back.",
      "I noticed you've been idle. Everything alright?",
      'Just checking in! Your focus session is still running.',
      "Whenever you're ready, your work is waiting for you! 📚",
    ],
  },

  moderate: {
    type: 'moderate',
    emoji: '⏰',
    titles: ['Time Check', 'Focus Reminder', 'Getting Distracted?', 'Refocus Time'],
    messages: [
      "You've been away for a while. Time to refocus! 🎯",
      "Your focus score is dropping. Let's get back on track!",
      'Remember your goals! A little effort now pays off later.',
      'Distraction detected! Take a breath and dive back in.',
      'Your future self will thank you for focusing now! 💪',
    ],
  },

  urgent: {
    type: 'urgent',
    emoji: '🚨',
    titles: ['Extended Break Detected', 'Session at Risk', 'Focus Alert', 'Time to Decide'],
    messages: [
      "You've been idle for quite a while. Should we end the session?",
      'Your focus session needs attention! Are you still working?',
      'Long break detected. Ready to finish strong? 💪',
      "This session's focus score is at risk. Let's turn it around!",
      'Decision time: End the session or get back to work?',
    ],
  },

  motivational: {
    type: 'motivational',
    emoji: '🌟',
    titles: ['You Got This!', 'Keep Going!', 'Almost There!', 'Stay Strong!'],
    messages: [
      "You've already made great progress today! Keep it up! 🚀",
      'Every minute of focus brings you closer to your goals!',
      "Remember why you started. You're doing amazing! ✨",
      'Small steps lead to big achievements. Stay focused!',
      "Your dedication is inspiring! Let's keep the momentum going!",
    ],
  },

  streak_reminder: {
    type: 'streak_reminder',
    emoji: '🔥',
    titles: ['Streak at Risk!', 'Keep Your Streak!', "Don't Break the Chain!", 'Streak Alert'],
    messages: [
      "Your {streak}-day streak is at risk! Don't let it end today!",
      "You've been focused for {streak} days straight. Keep it going!",
      "🔥 {streak} days of focus! Let's make it {streak_plus_one}!",
      'Your streak is your superpower! Protect those {streak} days!',
      "Champions don't break streaks. You've got {streak} days!",
    ],
  },
};

/**
 * Get a random message from a template
 */
export function getRandomNudgeMessage(
  type: string,
  variables?: Record<string, string | number>
): { title: string; message: string; emoji: string } {
  const template = NUDGE_TEMPLATES[type] || NUDGE_TEMPLATES.moderate;

  const title = template.titles[Math.floor(Math.random() * template.titles.length)];
  let message = template.messages[Math.floor(Math.random() * template.messages.length)];

  // Replace variables in message
  if (variables) {
    Object.entries(variables).forEach(([key, value]) => {
      message = message.replace(new RegExp(`{${key}}`, 'g'), String(value));
    });
  }

  return {
    title,
    message,
    emoji: template.emoji,
  };
}

/**
 * Get time-appropriate greeting
 */
export function getTimeGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Burning the midnight oil';
}
