import {
  APP_ACCESS_TOKEN_COOKIE_MAX_AGE,
  APP_REFRESH_TOKEN_COOKIE_EXPIRES_IN,
  APP_SESSION_COOKIE_KEY,
  APP_SESSION_COOKIE_REFRESH,
  APP_SESSION_COOKIE_ROLE,
} from '#/config/cookies.config'

function readBrowserCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  const pattern = new RegExp(
    `(?:^|; )${name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1')}=([^;]*)`,
  )
  const match = document.cookie.match(pattern)
  return match ? decodeURIComponent(match[1]) : undefined
}

function writeBrowserCookie(
  name: string,
  value: string,
  maxAgeSeconds: number,
): void {
  if (typeof document === 'undefined') return
  const isSecure =
    typeof window !== 'undefined' && window.location.protocol === 'https:'
  const secureFlag = isSecure ? '; Secure' : ''
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${Math.floor(maxAgeSeconds)}; SameSite=Lax${secureFlag}`
}

function deleteBrowserCookie(name: string): void {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`
}

export function getAccessToken(): string | undefined {
  return readBrowserCookie(APP_SESSION_COOKIE_KEY)
}

export function getRefreshToken(): string | undefined {
  return readBrowserCookie(APP_SESSION_COOKIE_REFRESH)
}

export function getSessionRole(): string | undefined {
  return readBrowserCookie(APP_SESSION_COOKIE_ROLE)
}

export function setSessionCookies(params: {
  accessToken: string
  refreshToken?: string
  role?: string
  accessMaxAgeSeconds?: number
}): void {
  writeBrowserCookie(
    APP_SESSION_COOKIE_KEY,
    params.accessToken,
    params.accessMaxAgeSeconds ?? APP_ACCESS_TOKEN_COOKIE_MAX_AGE,
  )

  if (params.refreshToken) {
    writeBrowserCookie(
      APP_SESSION_COOKIE_REFRESH,
      params.refreshToken,
      APP_REFRESH_TOKEN_COOKIE_EXPIRES_IN / 1000,
    )
  }

  if (params.role) {
    writeBrowserCookie(
      APP_SESSION_COOKIE_ROLE,
      params.role,
      APP_REFRESH_TOKEN_COOKIE_EXPIRES_IN / 1000,
    )
  }
}

export function clearSessionCookies(): void {
  deleteBrowserCookie(APP_SESSION_COOKIE_KEY)
  deleteBrowserCookie(APP_SESSION_COOKIE_REFRESH)
  deleteBrowserCookie(APP_SESSION_COOKIE_ROLE)
}
