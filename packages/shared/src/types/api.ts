/**
 * API request/response type definitions
 */

// Standard API response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  field?: string; // For validation errors
}

export interface ApiMeta {
  timestamp: string;
  requestId?: string;
  pagination?: PaginationMeta;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

// Common error codes
export enum ErrorCode {
  // Authentication
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',

  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',

  // Resources
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',

  // Server
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',

  // Rate limiting
  RATE_LIMITED = 'RATE_LIMITED',
}

// WebSocket event types (for real-time features)
export enum WebSocketEvent {
  // Connection
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',

  // Session updates
  SESSION_STARTED = 'session:started',
  SESSION_UPDATED = 'session:updated',
  SESSION_ENDED = 'session:ended',

  // Social
  FRIEND_ONLINE = 'friend:online',
  FRIEND_OFFLINE = 'friend:offline',
  FRIEND_SESSION_UPDATE = 'friend:session_update',

  // Notifications
  NOTIFICATION = 'notification',
  ACHIEVEMENT_UNLOCKED = 'achievement:unlocked',
}
