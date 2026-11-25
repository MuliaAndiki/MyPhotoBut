/**
 * Entry method API (Client-Safe & Zero Server Leak).
 *
 * Arsitektur pemisahan di TanStack Start + Vite:
 * 1. `clientApi` (`#/lib/api/client-api` atau `const { client } = Api()`):
 *    100% bebas dari import `./server/server-fetch`, aman dipakai di hooks
 *    React Query (`useMutation`, `useQuery`) dan komponen browser.
 * 2. `serverApi` (`#/lib/api/server-api`):
 *    Dilindungi `import '@tanstack/react-start/server-only'` di baris pertama.
 *    Wajib diimpor langsung dari `#/lib/api/server-api` hanya di dalam
 *    `createServerFn()` atau Server Routes.
 * 3. `getIsomorphicApi` (`#/lib/api/isomorphic-api`):
 *    Menggunakan `createIsomorphicFn()` dari `@tanstack/react-start` yang
 *    cabang `.server()`-nya otomatis dihapus oleh compiler TanStack Start
 *    pada saat membuat client bundle.
 */
import {
  clientApi,
  setAuthErrorHandler,
  setBaseURLProvider,
  setTokenProvider,
  type ClientRequestConfig,
} from './client-api'

export function Api() {
  return {
    client: clientApi,
  }
}

export {
  clientApi,
  setAuthErrorHandler,
  setBaseURLProvider,
  setTokenProvider,
}
export type { ClientRequestConfig }

export { api, createApiClient } from './client'
export type { ApiClientConfig, RequestOptions } from './client'
export { ApiError, getErrorMessage, isApiError } from './errors'
