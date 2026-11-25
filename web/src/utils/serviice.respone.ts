import type { ApiResponse, ApiStatus, TResponse } from '#/pkg/api-wrapper.type'

/**
 * Memetakan envelope mentah backend ({ success, status, title, message, data, meta, error })
 * menjadi `TResponse` standar frontend
 * ({ statusCode, code, status, title, message, data, meta, errors }).
 *
 * `status: 'success' | 'error'` dipakai `WrapApi` (fe/src/utils/wrapApi.ts)
 * untuk melempar Error ketika respons backend bukan sukses.
 */
export function toServiceResponse<T>(res: ApiResponse<T>): TResponse<T> {
  const isSuccess =
    typeof res?.success === 'boolean'
      ? res.success
      : typeof res?.status === 'number'
        ? res.status >= 200 && res.status < 300
        : true

  const status: ApiStatus = isSuccess ? 'success' : 'error'

  let errors: { field: string; message: string }[] | null = null
  if (res?.error && typeof res.error === 'object' && !Array.isArray(res.error)) {
    errors = Object.entries(res.error as Record<string, unknown>).map(
      ([field, msg]) => ({
        field,
        message: String(msg),
      }),
    )
  }

  return {
    statusCode: res?.status,
    code: res?.status,
    status,
    title: res?.title,
    message: res?.message ?? '',
    data: res?.data ?? null,
    meta: res?.meta ?? null,
    errors,
  }
}
