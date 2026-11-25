export interface AuthInterface {
  id: string
  email: string
  username: string
  name: string
  password: string
  avatar_url: string
  role: string
  email_verified: boolean
  total_templates: number
  total_usage_count: number
  created_at: string
  updated_at: string
}

export type AuthUser = Pick<
  AuthInterface,
  'id' | 'email' | 'username' | 'avatar_url' | 'role'
>

// 1. POST /auth/register & POST /auth/login
export type PickRegister = Pick<
  AuthInterface,
  'email' | 'password' | 'name'
> & {
  role?: string
}
export type RRegister = Pick<
  AuthInterface,
  'id' | 'email' | 'name' | 'role' | 'created_at' | 'updated_at'
>

export type PickLogin = Pick<AuthInterface, 'email' | 'password'>
export interface RLogin {
  token: string
  user: RRegister
}

// 2. POST /auth/magic-link
export type PickMagicLink = Pick<AuthInterface, 'email'>
export interface RMagicLink {
  message: string
  dev_token?: string
  dev_magic_link?: string
}

// 3. POST /auth/magic-link/verify
export interface PickVerifyMagicLink {
  token: string
}
export interface RAuthTokens {
  access_token: string
  refresh_token: string
  user?: AuthUser
}

// 4. GET /auth/google & GET /auth/google/callback
export interface RGoogleAuthURL {
  auth_url: string
  state: string
}
export interface PickGoogleCallback {
  code: string
  state?: string
}

// 5. POST /auth/refresh
export interface PickRefreshToken {
  refresh_token: string
}
export interface RRefreshToken {
  access_token: string
  refresh_token: string
}

// 6. POST /auth/logout
export interface PickLogout {
  refresh_token: string
}

// 7. GET /auth/me & PATCH /auth/me
export type RCreatorProfile = Omit<AuthInterface, 'name' | 'password'>
export interface PickUpdateMe {
  username?: string
  avatar_url?: string
}
