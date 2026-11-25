import { env } from '#/lib/env'
import type { ApiResponse } from '#/pkg/api-wrapper.type'
import { AuthEndpoint } from '#/service/auth/auth.endpoint'
import type { RRefreshToken } from '#/types/api/auth'
import {
  clearSessionCookies,
  getRefreshToken,
  setSessionCookies,
} from '#/utils/session-cookie'

let _clientRefreshInFlight: Promise<boolean> | null = null

async function _doClientRefreshOnce(baseUrl?: string): Promise<boolean> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    return false
  }

  const resolvedBase = (baseUrl || env.API_BASE_URL || '').replace(/\/+$/, '')
  const refreshPath = AuthEndpoint.refresh.startsWith('/')
    ? AuthEndpoint.refresh
    : `/${AuthEndpoint.refresh}`
  const endpoint = `${resolvedBase}${refreshPath}`

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
      credentials: 'include',
      cache: 'no-store',
    })

    if (!res.ok) {
      clearSessionCookies()
      return false
    }

    const json = (await res.json()) as ApiResponse<
      RRefreshToken & { accessToken?: string; refreshToken?: string }
    >
    const newAccess =
      json?.data?.access_token ?? json?.data?.accessToken ?? undefined
    const newRefresh =
      json?.data?.refresh_token ?? json?.data?.refreshToken ?? undefined

    if (!newAccess) {
      clearSessionCookies()
      return false
    }

    setSessionCookies({
      accessToken: newAccess,
      refreshToken: newRefresh,
    })
    return true
  } catch {
    return false
  }
}

/**
 * Menukar refresh_token dengan pasangan access_token & refresh_token baru di browser.
 * Menggunakan single-flight promise agar beberapa request 401 bersamaan hanya
 * memicu satu kali rotasi token.
 */
export async function refreshAccessToken(baseUrl?: string): Promise<boolean> {
  if (_clientRefreshInFlight) {
    return _clientRefreshInFlight
  }

  _clientRefreshInFlight = _doClientRefreshOnce(baseUrl).finally(() => {
    _clientRefreshInFlight = null
  })

  return _clientRefreshInFlight
}
