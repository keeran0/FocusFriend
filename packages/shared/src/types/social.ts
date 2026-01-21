/**
 * Social feature type definitions
 */

// Friendship
export interface Friendship {
  id: string;
  userId: string;
  friendId: string;
  status: FriendshipStatus;
  createdAt: Date;
  updatedAt: Date;
}

export enum FriendshipStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  BLOCKED = 'blocked',
}

// Friend with profile info
export interface Friend {
  friendship: Friendship;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    level: number;
    currentStreak: number;
    isOnline: boolean;
    lastActive?: Date;
  };
}

// Study group
export interface StudyGroup {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  ownerId: string;
  isPrivate: boolean;
  memberCount: number;
  maxMembers: number;
  createdAt: Date;
  weeklyGoal?: number; // Total focus time goal in seconds
  weeklyProgress?: number; // Current progress
}

// Group membership
export interface GroupMembership {
  id: string;
  groupId: string;
  userId: string;
  role: GroupRole;
  joinedAt: Date;
  weeklyContribution: number; // Focus time contributed this week
}

export enum GroupRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

// Group member with user info
export interface GroupMember {
  membership: GroupMembership;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    level: number;
  };
}

// Leaderboard entry
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  level: number;
  score: number; // The metric being ranked (points, focus time, etc.)
  change: number; // Position change since last period (+2, -1, 0)
}

// Leaderboard types
export enum LeaderboardType {
  DAILY_FOCUS = 'daily_focus',
  WEEKLY_FOCUS = 'weekly_focus',
  MONTHLY_FOCUS = 'monthly_focus',
  ALL_TIME_POINTS = 'all_time_points',
  CURRENT_STREAK = 'current_streak',
}

// Leaderboard scope
export enum LeaderboardScope {
  GLOBAL = 'global',
  FRIENDS = 'friends',
  GROUP = 'group',
}

// Activity feed item
export interface ActivityFeedItem {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  type: FeedItemType;
  data: Record<string, unknown>;
  createdAt: Date;
}

export enum FeedItemType {
  SESSION_COMPLETED = 'session_completed',
  ACHIEVEMENT_UNLOCKED = 'achievement_unlocked',
  LEVEL_UP = 'level_up',
  STREAK_MILESTONE = 'streak_milestone',
  JOINED_GROUP = 'joined_group',
  FRIEND_ADDED = 'friend_added',
}
