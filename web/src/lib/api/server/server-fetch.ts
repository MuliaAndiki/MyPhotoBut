import '@tanstack/react-start/server-only'
import { redirect } from '@tanstack/react-router'
import {
  APP_ACCESS_TOKEN_COOKIE_MAX_AGE,
  APP_REFRESH_TOKEN_COOKIE_EXPIRES_IN,
  APP_SESSION_COOKIE_KEY,
  APP_SESSION_COOKIE_REFRESH,
  APP_SESSION_COOKIE_ROLE,
} from '#/config/cookies.config'
import { env } from '#/lib/env'
import {
  ApiError as ApiErrorClass,
  type ApiResponse,
  type ApiSuccessResponse,
} from '#/pkg/api-wrapper.type'
import { AuthEndpoint } from '#/service/auth/auth.endpoint'
import type { RRefreshToken } from '#/types/api/auth'
import { Logger } from '#/utils/log'
import {
  clearSessionCookies,
  getAccessToken as getClientCookieAccessToken,
  getRefreshToken as getClientCookieRefreshToken,
  setSessionCookies,
} from '#/utils/session-cookie'

export interface ServerCookieAdapter {
  get: (name: string) => string | undefined | Promise<string | undefined>
  set: (
    name: string,
    value: string,
    options?: {
      maxAge?: number
      path?: string
      sameSite?: 'lax' | 'strict' | 'none'
      secure?: boolean
      httpOnly?: boolean
    },
  ) => void | Promise<void>
  delete: (name: string) => void | Promise<void>
}

let _serverCookieAdapter: ServerCookieAdapter | null = null

/**
 * Register a custom server cookie store (e.g. from TanStack Start request headers
 * or Cloudflare Worker context). Falls back to browser cookies when called ISO.
 */
export function setServerCookieAdapter(adapter: ServerCookieAdapter | null) {
  _serverCookieAdapter = adapter
}

function joinUrl(...parts: string[]): string {
  return parts
    .map((part) => part.replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/')
}

/**
 * Resolves the backend base URL per-request (safe for Cloudflare Workers SSR).
 */
function resolveServerBaseUrl(): string {
  const procEnv =
    typeof process !== 'undefined' && process.env ? process.env : undefined
  const origin =
    procEnv?.API_BASE_URL || procEnv?.VITE_API_BASE_URL || env.API_BASE_URL
  const gate = procEnv?.API_GATE_PREFIX || ''
  const version = procEnv?.API_VERSION_PREFIX || ''

  if (!gate && !version) {
    return origin.replace(/\/+$/, '')
  }
  return joinUrl(origin, gate, version)
}

function buildEndpointUrl(
  path: string,
  query?: RequestConfig['query'],
): string {
  let url: string
  if (path.startsWith('http://') || path.startsWith('https://')) {
    url = path
  } else {
    const base = resolveServerBaseUrl()
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    url = `${base}${normalizedPath}`
  }

  if (!query) return url
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== null && value !== undefined) {
      params.set(key, String(value))
    }
  }
  const qs = params.toString()
  return qs ? `${url}${url.includes('?') ? '&' : '?'}${qs}` : url
}

export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  query?: Record<string, string | number | boolean | null | undefined>
  headers?: Record<string, string>
  cache?: RequestCache
  signal?: AbortSignal
  accessToken?: string
}

type UnauthorizedMode = 'redirect' | 'json401'

type FetchOptions = {
  withAuth: boolean
  unauthorizedMode?: UnauthorizedMode
}

async function getAccessToken(
  explicitToken?: string,
): Promise<string | undefined> {
  if (explicitToken) return explicitToken
  if (_serverCookieAdapter) {
    return await _serverCookieAdapter.get(APP_SESSION_COOKIE_KEY)
  }
  return getClientCookieAccessToken()
}

async function getRefreshToken(): Promise<string | undefined> {
  if (_serverCookieAdapter) {
    return await _serverCookieAdapter.get(APP_SESSION_COOKIE_REFRESH)
  }
  return getClientCookieRefreshToken()
}

async function clearTokens(): Promise<void> {
  if (_serverCookieAdapter) {
    await _serverCookieAdapter.delete(APP_SESSION_COOKIE_KEY)
    await _serverCookieAdapter.delete(APP_SESSION_COOKIE_REFRESH)
    await _serverCookieAdapter.delete(APP_SESSION_COOKIE_ROLE)
    return
  }
  clearSessionCookies()
}

/**
 * Builds server request headers per-request so Cloudflare Workers secrets
 * (`process.env.API_SECRET`) are resolved at request time.
 */
function buildBaseHeaders(accessToken?: string): Record<string, string> {
  const procEnv =
    typeof process !== 'undefined' && process.env ? process.env : undefined
  const internalApiKey =
    procEnv?.API_SECRET ||
    procEnv?.INTERNAL_API_SECRET ||
    procEnv?.NEXT_INTERNAL_API_SECRET ||
    procEnv?.INTERNAL_API_KEY ||
    ''

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }

  if (internalApiKey) {
    headers['X-API-SECRET'] = internalApiKey
    headers['x-internal-api-key'] = internalApiKey
  }

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  return headers
}

let _refreshInFlight: Promise<string | null> | null = null

async function _doRefreshOnce(): Promise<string | null> {
  const refreshToken = await getRefreshToken()
  if (!refreshToken) {
    return null
  }

  const endpoint = buildEndpointUrl(AuthEndpoint.refresh)
  let res: Response
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: buildBaseHeaders(),
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: 'no-store',
    })
  } catch {
    return null
  }

  if (!res.ok) {
    return null
  }

  let accessToken: string | undefined
  let newRefreshToken: string | undefined
  try {
    const json = (await res.json()) as ApiResponse<
      RRefreshToken & { accessToken?: string; refreshToken?: string }
    >
    accessToken = json.data?.access_token ?? json.data?.accessToken
    newRefreshToken =
      json.data?.refresh_token ?? json.data?.refreshToken ?? undefined
  } catch {
    return null
  }

  if (!accessToken) {
    return null
  }

  try {
    const isProduction = env.APP_ENV === 'production'
    if (_serverCookieAdapter) {
      await _serverCookieAdapter.set(APP_SESSION_COOKIE_KEY, accessToken, {
        secure: isProduction,
        sameSite: 'lax',
        path: '/',
        maxAge: APP_ACCESS_TOKEN_COOKIE_MAX_AGE,
      })
      if (newRefreshToken) {
        await _serverCookieAdapter.set(
          APP_SESSION_COOKIE_REFRESH,
          newRefreshToken,
          {
            secure: isProduction,
            sameSite: 'lax',
            path: '/',
            maxAge: APP_REFRESH_TOKEN_COOKIE_EXPIRES_IN / 1000,
          },
        )
      }
    } else {
      setSessionCookies({
        accessToken,
        refreshToken: newRefreshToken,
      })
    }
  } catch (err) {
    if (env.APP_ENV === 'development') {
      console.error('[Auth] refresh: gagal menyimpan cookie', err)
    }
  }

  return accessToken
}

async function doRefreshToken(): Promise<string | null> {
  if (_refreshInFlight) {
    return _refreshInFlight
  }

  _refreshInFlight = _doRefreshOnce().finally(() => {
    _refreshInFlight = null
  })

  return _refreshInFlight
}

async function handleUnauthorized(unauthorizedMode: UnauthorizedMode) {
  await clearTokens()

  if (unauthorizedMode === 'redirect') {
    throw redirect({ to: '/' })
  }
}

async function coreFetch<T>(
  path: string,
  config: RequestConfig | undefined,
  options: FetchOptions,
  isRetry = false,
): Promise<T> {
  const {
    method = 'GET',
    body,
    query,
    headers: extraHeaders = {},
    cache = 'no-store',
    signal,
    accessToken: explicitToken,
  } = config ?? {}
  const unauthorizedMode = options.unauthorizedMode ?? 'redirect'

  const accessToken = options.withAuth
    ? await getAccessToken(explicitToken)
    : undefined
  const endpoint = buildEndpointUrl(path, query)
  const headers = {
    ...buildBaseHeaders(accessToken),
    ...extraHeaders,
  }

  Logger.request(method, endpoint, headers, body)

  const res = await fetch(endpoint, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache,
    signal,
  })

  if (res.status === 401 && options.withAuth && !isRetry) {
    const newAccessToken = await doRefreshToken()

    if (!newAccessToken) {
      await handleUnauthorized(unauthorizedMode)
      throw new ApiErrorClass('Unauthorized', 401)
    }

    const retryRes = await fetch(endpoint, {
      method,
      headers: {
        ...buildBaseHeaders(newAccessToken),
        ...extraHeaders,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache,
      signal,
    })

    if (!retryRes.ok) {
      let message = `Request failed with status ${retryRes.status}`
      let errors: Record<string, string[]> | undefined
      try {
        const errJson = await retryRes.json()
        if (errJson?.message) message = errJson.message
        if (errJson?.errors) errors = errJson.errors
      } catch {
        /* ignore */
      }
      throw new ApiErrorClass(message, retryRes.status, undefined, errors)
    }

    const retryJson = (await retryRes.json()) as ApiResponse<T>
    Logger.response(method, endpoint, retryRes.status, retryJson.data)
    return retryJson.data as T
  }

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`
    let errors: Record<string, string[]> | undefined

    try {
      const errJson = await res.json()
      if (errJson?.message) message = errJson.message
      if (errJson?.errors) errors = errJson.errors
    } catch {
      /* ignore */
    }

    throw new ApiErrorClass(message, res.status, undefined, errors)
  }

  const json = (await res.json()) as ApiResponse<T>
  Logger.response(method, endpoint, res.status, json.data)
  return json.data as T
}

async function coreFetchResponse<T>(
  path: string,
  config: RequestConfig | undefined,
  options: FetchOptions,
  isRetry = false,
): Promise<ApiSuccessResponse<T>> {
  const {
    method = 'GET',
    body,
    query,
    headers: extraHeaders = {},
    cache = 'no-store',
    signal,
    accessToken: explicitToken,
  } = config ?? {}
  const unauthorizedMode = options.unauthorizedMode ?? 'redirect'

  const accessToken = options.withAuth
    ? await getAccessToken(explicitToken)
    : undefined
  const endpoint = buildEndpointUrl(path, query)
  const headers = {
    ...buildBaseHeaders(accessToken),
    ...extraHeaders,
  }

  Logger.request(method, endpoint, headers, body)

  const res = await fetch(endpoint, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache,
    signal,
  })

  if (res.status === 401 && options.withAuth && !isRetry) {
    const newAccessToken = await doRefreshToken()

    if (!newAccessToken) {
      await handleUnauthorized(unauthorizedMode)
      return {
        success: false,
        status: 401,
        message: 'Unauthorized',
        data: null as T,
      }
    }

    const retryRes = await fetch(endpoint, {
      method,
      headers: {
        ...buildBaseHeaders(newAccessToken),
        ...extraHeaders,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache,
      signal,
    })

    if (!retryRes.ok) {
      let message = `Request failed with status ${retryRes.status}`
      let errors: Record<string, string[]> | undefined
      try {
        const errJson = await retryRes.json()
        if (errJson?.message) message = errJson.message
        if (errJson?.errors) errors = errJson.errors
      } catch {
        /* ignore */
      }

      return {
        success: false,
        status: retryRes.status,
        message,
        data: null as T,
        errors: errors ?? null,
      }
    }

    const retryJson = (await retryRes.json()) as ApiResponse<T>
    Logger.response(method, endpoint, retryRes.status, retryJson.data)
    return {
      success: true,
      status: retryJson.status ?? retryRes.status,
      message: retryJson.message ?? 'Berhasil',
      data: retryJson.data as T,
      meta: retryJson.meta,
    }
  }

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`
    let errors: Record<string, string[]> | undefined

    try {
      const errJson = await res.json()
      if (errJson?.message) message = errJson.message
      if (errJson?.errors) errors = errJson.errors
    } catch {
      /* ignore */
    }

    return {
      success: false,
      status: res.status,
      message,
      data: null as T,
      errors: errors ?? null,
    }
  }

  const json = (await res.json()) as ApiResponse<T>
  Logger.response(method, endpoint, res.status, json.data)
  return {
    success: true,
    status: json.status ?? res.status,
    message: json.message ?? 'Berhasil',
    data: json.data as T,
    meta: json.meta,
  }
}

export async function proxyGatewayRequest(
  pathWithQuery: string,
  config: RequestConfig = {},
): Promise<Response> {
  const {
    method = 'GET',
    body,
    query,
    headers: extraHeaders = {},
    cache = 'no-store',
    accessToken: explicitToken,
  } = config

  const accessToken = await getAccessToken(explicitToken)
  const endpoint = buildEndpointUrl(pathWithQuery, query)

  const execute = async (token?: string) =>
    fetch(endpoint, {
      method,
      headers: {
        ...buildBaseHeaders(token),
        ...extraHeaders,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache,
    })

  let res = await execute(accessToken)

  if (res.status === 401 && !accessToken) {
    return res
  }

  if (res.status === 401) {
    const newAccessToken = await doRefreshToken()

    if (!newAccessToken) {
      await clearTokens()
      return Response.json(
        {
          data: null,
          message: 'Sesi berakhir, silakan login kembali',
          success: false,
          status: 401,
        },
        { status: 401 },
      )
    }

    res = await execute(newAccessToken)
  }

  return res
}

export async function PublicRequest<T>(
  path: string,
  config?: RequestConfig,
): Promise<T> {
  return coreFetch<T>(path, config, { withAuth: false })
}

export async function Request<T>(
  path: string,
  config?: RequestConfig,
): Promise<T> {
  return coreFetch<T>(path, config, { withAuth: true })
}

export async function RequestResponse<T>(
  path: string,
  config?: RequestConfig,
): Promise<ApiSuccessResponse<T>> {
  return coreFetchResponse<T>(path, config, { withAuth: true })
}

export async function Get<T>(
  path: string,
  config?: Omit<RequestConfig, 'method' | 'body'>,
): Promise<T> {
  return Request<T>(path, { ...config, method: 'GET' })
}

export async function GetResponse<T>(
  path: string,
  config?: Omit<RequestConfig, 'method' | 'body'>,
): Promise<ApiSuccessResponse<T>> {
  return RequestResponse<T>(path, { ...config, method: 'GET' })
}

export async function Post<T>(
  path: string,
  data?: unknown,
  config?: Omit<RequestConfig, 'method' | 'body'>,
): Promise<T> {
  return Request<T>(path, { ...config, method: 'POST', body: data })
}

export async function PostResponse<T>(
  path: string,
  data?: unknown,
  config?: Omit<RequestConfig, 'method' | 'body'>,
): Promise<ApiSuccessResponse<T>> {
  return RequestResponse<T>(path, { ...config, method: 'POST', body: data })
}

export async function Put<T>(
  path: string,
  data?: unknown,
  config?: Omit<RequestConfig, 'method' | 'body'>,
): Promise<T> {
  return Request<T>(path, { ...config, method: 'PUT', body: data })
}

export async function PutResponse<T>(
  path: string,
  data?: unknown,
  config?: Omit<RequestConfig, 'method' | 'body'>,
): Promise<ApiSuccessResponse<T>> {
  return RequestResponse<T>(path, { ...config, method: 'PUT', body: data })
}

export async function Patch<T>(
  path: string,
  data?: unknown,
  config?: Omit<RequestConfig, 'method' | 'body'>,
): Promise<T> {
  return Request<T>(path, { ...config, method: 'PATCH', body: data })
}

export async function PatchResponse<T>(
  path: string,
  data?: unknown,
  config?: Omit<RequestConfig, 'method' | 'body'>,
): Promise<ApiSuccessResponse<T>> {
  return RequestResponse<T>(path, { ...config, method: 'PATCH', body: data })
}

export async function Del<T>(
  path: string,
  config?: Omit<RequestConfig, 'method' | 'body'>,
): Promise<T> {
  return Request<T>(path, { ...config, method: 'DELETE' })
}

export async function DelResponse<T>(
  path: string,
  config?: Omit<RequestConfig, 'method' | 'body'>,
): Promise<ApiSuccessResponse<T>> {
  return RequestResponse<T>(path, { ...config, method: 'DELETE' })
}

export async function PublicPost<T>(
  path: string,
  data?: unknown,
  config?: Omit<RequestConfig, 'method' | 'body'>,
): Promise<T> {
  return PublicRequest<T>(path, { ...config, method: 'POST', body: data })
}

export async function PublicPostResponse<T>(
  path: string,
  data?: unknown,
  config?: Omit<RequestConfig, 'method' | 'body'>,
): Promise<ApiSuccessResponse<T>> {
  return coreFetchResponse<T>(
    path,
    { ...config, method: 'POST', body: data },
    { withAuth: false },
  )
}

export async function PublicGet<T>(
  path: string,
  config?: Omit<RequestConfig, 'method' | 'body'>,
): Promise<T> {
  return PublicRequest<T>(path, { ...config, method: 'GET' })
}

export async function PublicGetResponse<T>(
  path: string,
  config?: Omit<RequestConfig, 'method' | 'body'>,
): Promise<ApiSuccessResponse<T>> {
  return coreFetchResponse<T>(
    path,
    { ...config, method: 'GET' },
    { withAuth: false },
  )
}
