/**
 * Server-Only API Entry (`#/lib/api/server-api`).
 *
 * Dijaga oleh `import '@tanstack/react-start/server-only'` agar Vite
 * menolak build jika file ini tidak sengaja diimpor oleh kode client browser.
 * Hanya gunakan di dalam `createServerFn()` atau Server Routes.
 */
import '@tanstack/react-start/server-only'

import {
  DelResponse,
  Get,
  GetResponse,
  Patch,
  PatchResponse,
  Post,
  PostResponse,
  PublicGet,
  PublicGetResponse,
  PublicPost,
  PublicPostResponse,
  Put,
  PutResponse,
  proxyGatewayRequest,
  setServerCookieAdapter,
  type RequestConfig as ServerRequestConfig,
  type ServerCookieAdapter,
} from './server/server-fetch'

export const serverApi = {
  GetResponse,
  PostResponse,
  PatchResponse,
  PutResponse,
  DeleteResponse: DelResponse,
  PublicGetResponse,
  PublicPostResponse,
  Get,
  Post,
  Patch,
  Put,
  Delete: DelResponse,
  PublicGet,
  PublicPost,
  proxyGatewayRequest,
} as const

export { setServerCookieAdapter }
export type { ServerCookieAdapter, ServerRequestConfig }
export default serverApi
