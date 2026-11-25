const IS_DEV =
  (typeof import.meta !== 'undefined' && import.meta.env?.DEV) ||
  (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development')

function sanitizeHeaders(
  headers: Record<string, string>,
): Record<string, string> {
  const copy: Record<string, string> = { ...headers }
  for (const key of Object.keys(copy)) {
    const lower = key.toLowerCase()
    if (
      lower === 'authorization' ||
      lower === 'x-api-secret' ||
      lower === 'x-internal-api-key'
    ) {
      copy[key] = '[REDACTED]'
    }
  }
  return copy
}

export const Logger = {
  request(
    method: string,
    endpoint: string,
    headers: Record<string, string>,
    payload?: unknown,
  ): void {
    if (!IS_DEV) return
    console.debug(`[API REQ] ${method} ${endpoint}`, {
      headers: sanitizeHeaders(headers),
      payload,
    })
  },

  response(
    method: string,
    endpoint: string,
    status: number,
    response: unknown,
  ): void {
    if (!IS_DEV) return
    console.debug(`[API RES] ${method} ${endpoint} -> ${status}`, response)
  },
}
