/**
 * Authentication type definitions
 */

// JWT Payload - what's encoded in the token
export interface JwtPayload {
  userId: string;
  email: string;
  username: string;
  iat?: number; // Issued at
  exp?: number; // Expires at
}

// Token pair returned after login/register
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds until access token expires
}

// Login request body
export interface LoginRequest {
  email: string;
  password: string;
}

// Register request body
export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  displayName?: string;
}

// Refresh token request body
export interface RefreshRequest {
  refreshToken: string;
}

// Auth response (user info + tokens)
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  tokens: AuthTokens;
}

// Authenticated user (attached to request)
export interface AuthenticatedUser {
  userId: string;
  email: string;
  username: string;
}
