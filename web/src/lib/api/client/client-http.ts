import { refreshAccessToken } from '#/lib/api/client/auth-refresh'
import { env } from '#/lib/env'
import {
  ApiError as ApiErrorClass,
  type ApiSuccessResponse,
} from '#/pkg/api-wrapper.type'
import { AuthEndpoint } from '#/service/auth/auth.endpoint'
import { clearSessionCookies, getAccessToken } from '#/utils/session-cookie'

export interface ClientRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  query?: Record<string, string | number | boolean | null | undefined>
  headers?: Record<string, string>
  cache?: RequestCache
  signal?: AbortSignal
}

type ClientFetchOptions = {
  withAuth: boolean
}

type TokenProvider = () => string | undefined | Promise<string | undefined>
type BaseURLProvider = () => string | undefined | Promise<string | undefined>
type AuthErrorHandler = (status: number) => void

let _tokenProvider: TokenProvider | null = null
let _baseURLProvider: BaseURLProvider | null = null
let _authErrorHandler: AuthErrorHandler | null = null

export const setTokenProvider = (provider: TokenProvider | null) => {
  _tokenProvider = provider
}

export const setBaseURLProvider = (provider: BaseURLProvider | null) => {
  _baseURLProvider = provider
}

/**
 * Override the default 401 handling (hard `window.location.href = "/login"`).
 * The handler is responsible for clearing the stale session and navigating.
 * Pass `null` to restore the default behavior.
 */
export const setAuthErrorHandler = (handler: AuthErrorHandler | null) => {
  _authErrorHandler = handler
}

async function resolveBaseUrl(): Promise<string> {
  let base = env.API_BASE_URL
  if (_baseURLProvider) {
    const customBase = await _baseURLProvider()
    if (customBase) base = customBase
  }
  return base.replace(/\/$/, '')
}

async function buildApiUrl(
  path: string,
  query?: ClientRequestConfig['query'],
): Promise<string> {
  let url: string
  if (path.startsWith('http://') || path.startsWith('https://')) {
    url = path
  } else {
    const normalizedBase = await resolveBaseUrl()
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    url = `${normalizedBase}${normalizedPath}`
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

function buildBaseHeaders(accessToken?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  return headers
}

function extractErrorMessage(resStatus: number, json: any): string {
  if (typeof json?.message === 'string' && json.message.trim() !== '') {
    return json.message
  }
  if (typeof json?.error === 'string' && json.error.trim() !== '') {
    return json.error
  }
  if (typeof json?.summary === 'string' && json.summary.trim() !== '') {
    return json.summary
  }
  if (Array.isArray(json?.errors) && json.errors[0]?.message) {
    return json.errors[0].message
  }
  if (resStatus === 503) {
    return 'Gagal terhubung ke database. Silakan coba beberapa saat lagi.'
  }
  if (resStatus === 401) {
    return 'Sesi Anda telah berakhir. Silakan login kembali.'
  }
  if (resStatus === 403) {
    return 'Akses ditolak. Anda tidak memiliki izin.'
  }
  if (resStatus === 404) {
    return 'Data atau layanan tidak ditemukan.'
  }
  return `Permintaan gagal dengan status ${resStatus}`
}

function handleClientUnauthorized(status: number) {
  if (typeof window === 'undefined') return
  clearSessionCookies()

  if (_authErrorHandler) {
    _authErrorHandler(status)
  } else {
    const currentPath = window.location.pathname
    if (!currentPath.startsWith('/login')) {
      window.location.href = '/login'
    }
  }
}

export async function clientCoreFetchResponse<T>(
  path: string,
  config: ClientRequestConfig = {},
  options: ClientFetchOptions = { withAuth: true },
): Promise<ApiSuccessResponse<T>> {
  const {
    method = 'GET',
    body,
    query,
    headers: extraHeaders = {},
    cache = 'no-store',
    signal,
  } = config

  let accessToken: string | undefined
  if (options.withAuth) {
    if (_tokenProvider) {
      accessToken = await _tokenProvider()
    } else {
      accessToken = getAccessToken()
    }
  }

  const endpoint = await buildApiUrl(path, query)
  const isAuthRefresh = path.includes(AuthEndpoint.refresh)

  let res = await fetch(endpoint, {
    method,
    headers: {
      ...buildBaseHeaders(accessToken),
      ...extraHeaders,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: 'include',
    cache,
    signal,
  })

  // 401 pada request ber-auth: tukar refresh token -> access token baru,
  // lalu ulangi request sekali. Bila gagal, cookie dibersihkan & dialihkan.
  if (res.status === 401 && options.withAuth && !isAuthRefresh) {
    const base = await resolveBaseUrl()
    const refreshed = await refreshAccessToken(base)

    if (refreshed) {
      const nextToken = _tokenProvider
        ? await _tokenProvider()
        : getAccessToken()
      res = await fetch(endpoint, {
        method,
        headers: {
          ...buildBaseHeaders(nextToken),
          ...extraHeaders,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        credentials: 'include',
        cache,
        signal,
      })
    }
  }

  let json: ApiSuccessResponse<T> | any
  try {
    json = await res.json()
  } catch {
    throw new ApiErrorClass(extractErrorMessage(res.status, null), res.status)
  }

  if (
    !res.ok ||
    json?.success === false ||
    (typeof json?.status === 'number' && json.status >= 400)
  ) {
    if (res.status === 401) {
      handleClientUnauthorized(res.status)
    }

    const errorMessage = extractErrorMessage(res.status, json)
    throw new ApiErrorClass(
      errorMessage,
      res.status,
      json?.title,
      json?.errors ?? json?.error ?? null,
    )
  }

  if (json && typeof json === 'object') {
    if (json.status === undefined) {
      json.status = res.status
    }
    if (json.success === undefined) {
      json.success = res.ok
    }
  }

  return json as ApiSuccessResponse<T>
}

export async function clientCoreFetch<T>(
  path: string,
  config?: ClientRequestConfig,
  options?: ClientFetchOptions,
): Promise<T> {
  const json = await clientCoreFetchResponse<T>(path, config, options)
  return json.data
}

export async function ClientGetResponse<T>(
  path: string,
  config?: Omit<ClientRequestConfig, 'method' | 'body'>,
): Promise<ApiSuccessResponse<T>> {
  return clientCoreFetchResponse<T>(path, { ...config, method: 'GET' })
}

export async function ClientPostResponse<T>(
  path: string,
  data?: unknown,
  config?: Omit<ClientRequestConfig, 'method' | 'body'>,
): Promise<ApiSuccessResponse<T>> {
  return clientCoreFetchResponse<T>(path, {
    ...config,
    method: 'POST',
    body: data,
  })
}

export async function ClientPatchResponse<T>(
  path: string,
  data?: unknown,
  config?: Omit<ClientRequestConfig, 'method' | 'body'>,
): Promise<ApiSuccessResponse<T>> {
  return clientCoreFetchResponse<T>(path, {
    ...config,
    method: 'PATCH',
    body: data,
  })
}

export async function ClientPutResponse<T>(
  path: string,
  data?: unknown,
  config?: Omit<ClientRequestConfig, 'method' | 'body'>,
): Promise<ApiSuccessResponse<T>> {
  return clientCoreFetchResponse<T>(path, {
    ...config,
    method: 'PUT',
    body: data,
  })
}

export async function ClientDelResponse<T>(
  path: string,
  config?: Omit<ClientRequestConfig, 'method' | 'body'>,
): Promise<ApiSuccessResponse<T>> {
  return clientCoreFetchResponse<T>(path, { ...config, method: 'DELETE' })
}

export async function ClientPublicGetResponse<T>(
  path: string,
  config?: Omit<ClientRequestConfig, 'method' | 'body'>,
): Promise<ApiSuccessResponse<T>> {
  return clientCoreFetchResponse<T>(
    path,
    { ...config, method: 'GET' },
    { withAuth: false },
  )
}

export async function ClientPublicPostResponse<T>(
  path: string,
  data?: unknown,
  config?: Omit<ClientRequestConfig, 'method' | 'body'>,
): Promise<ApiSuccessResponse<T>> {
  return clientCoreFetchResponse<T>(
    path,
    { ...config, method: 'POST', body: data },
    { withAuth: false },
  )
}

export async function ClientDel<T>(
  path: string,
  config?: Omit<ClientRequestConfig, 'method' | 'body'>,
): Promise<T> {
  return clientCoreFetch<T>(path, { ...config, method: 'DELETE' })
}

export async function ClientGet<T>(
  path: string,
  config?: Omit<ClientRequestConfig, 'method' | 'body'>,
): Promise<T> {
  return clientCoreFetch<T>(path, { ...config, method: 'GET' })
}

export async function ClientPost<T>(
  path: string,
  data?: unknown,
  config?: Omit<ClientRequestConfig, 'method' | 'body'>,
): Promise<T> {
  return clientCoreFetch<T>(path, { ...config, method: 'POST', body: data })
}

/**
 * POST multipart/form-data (upload file).
 *
 * Tidak menggunakan `clientCoreFetchResponse` karena body harus dikirim
 * sebagai `FormData` (bukan `JSON.stringify`), dan header `Content-Type`
 * harus dihilangkan agar browser meng-generate boundary secara otomatis.
 */
export async function ClientPostFormDataResponse<T>(
  path: string,
  formData: FormData,
  config?: Omit<ClientRequestConfig, 'method' | 'body'>,
): Promise<ApiSuccessResponse<T>> {
  let accessToken: string | undefined
  if (_tokenProvider) {
    accessToken = await _tokenProvider()
  } else {
    accessToken = getAccessToken()
  }

  const endpoint = await buildApiUrl(path, config?.query)
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...config?.headers,
  }

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: formData,
    credentials: 'include',
    cache: 'no-store',
    signal: config?.signal,
  })

  let json: ApiSuccessResponse<T> | any
  try {
    json = await res.json()
  } catch {
    throw new ApiErrorClass(extractErrorMessage(res.status, null), res.status)
  }

  if (
    !res.ok ||
    json?.success === false ||
    (typeof json?.status === 'number' && json.status >= 400)
  ) {
    if (res.status === 401) {
      handleClientUnauthorized(res.status)
    }

    const errorMessage = extractErrorMessage(res.status, json)
    throw new ApiErrorClass(
      errorMessage,
      res.status,
      json?.title,
      json?.errors ?? json?.error ?? null,
    )
  }

  if (json && typeof json === 'object') {
    if (json.status === undefined) {
      json.status = res.status
    }
    if (json.success === undefined) {
      json.success = res.ok
    }
  }

  return json as ApiSuccessResponse<T>
}

/**
 * GET binary download (file / photo strip / certificate).
 *
 * Mengembalikan `Response` mentah (bukan JSON) sehingga caller dapat
 * mengekstrak blob, header Content-Disposition, dsb.
 */
export async function ClientDownloadResponse(
  path: string,
  config?: Omit<ClientRequestConfig, 'method' | 'body'>,
): Promise<Response> {
  let accessToken: string | undefined
  if (_tokenProvider) {
    accessToken = await _tokenProvider()
  } else {
    accessToken = getAccessToken()
  }

  const endpoint = await buildApiUrl(path, config?.query)
  const headers: Record<string, string> = {
    ...config?.headers,
  }

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  const res = await fetch(endpoint, {
    method: 'GET',
    headers,
    credentials: 'include',
    cache: 'no-store',
    signal: config?.signal,
  })

  if (!res.ok) {
    if (res.status === 401) {
      handleClientUnauthorized(res.status)
    }
    throw new ApiErrorClass(
      `Download failed with status ${res.status}`,
      res.status,
    )
  }

  return res
}

export const GetResponse = ClientGetResponse
export const PostResponse = ClientPostResponse
export const PutResponse = ClientPutResponse
export const PatchResponse = ClientPatchResponse
export const DelResponse = ClientDelResponse
export const DeleteResponse = ClientDelResponse
export const PublicGetResponse = ClientPublicGetResponse
export const PublicPostResponse = ClientPublicPostResponse
export const PostFormDataResponse = ClientPostFormDataResponse
export const DownloadResponse = ClientDownloadResponse
