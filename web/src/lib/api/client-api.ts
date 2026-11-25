/**
 * Client-Safe API Entry (`#/lib/api/client-api`).
 *
 * 100% bebas dari import `./server/*` sehingga aman dipanggil di dalam
 * React Query (`useMutation`, `useQuery`), komponen browser, dan event handlers.
 */
import {
  ClientDel,
  ClientDelResponse,
  ClientDownloadResponse,
  ClientGet,
  ClientGetResponse,
  ClientPatchResponse,
  ClientPost,
  ClientPostFormDataResponse,
  ClientPostResponse,
  ClientPublicGetResponse,
  ClientPublicPostResponse,
  ClientPutResponse,
  setAuthErrorHandler,
  setBaseURLProvider,
  setTokenProvider,
  type ClientRequestConfig,
} from './client/client-http'

export const clientApi = {
  GetResponse: ClientGetResponse,
  PostResponse: ClientPostResponse,
  PostFormDataResponse: ClientPostFormDataResponse,
  PatchResponse: ClientPatchResponse,
  PutResponse: ClientPutResponse,
  DeleteResponse: ClientDelResponse,
  PublicGetResponse: ClientPublicGetResponse,
  PublicPostResponse: ClientPublicPostResponse,
  DownloadResponse: ClientDownloadResponse,
  Get: ClientGet,
  Post: ClientPost,
  Delete: ClientDel,
} as const

export { setAuthErrorHandler, setBaseURLProvider, setTokenProvider }
export type { ClientRequestConfig }
export default clientApi
