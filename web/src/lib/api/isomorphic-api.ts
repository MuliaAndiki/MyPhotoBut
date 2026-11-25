/**
 * Isomorphic API Entry (`#/lib/api/isomorphic-api`).
 *
 * Menggunakan `createIsomorphicFn()` dari `@tanstack/react-start` sehingga
 * compiler Vite TanStack Start otomatis memotong (strip) cabang `.server()`
 * dari bundle browser dan memotong cabang `.client()` dari bundle server.
 */
import { createIsomorphicFn } from '@tanstack/react-start'
import {
  ClientDelResponse,
  ClientGetResponse,
  ClientPatchResponse,
  ClientPostResponse,
  ClientPublicGetResponse,
  ClientPublicPostResponse,
  ClientPutResponse,
} from './client/client-http'
import {
  DelResponse,
  GetResponse,
  PatchResponse,
  PostResponse,
  PublicGetResponse,
  PublicPostResponse,
  PutResponse,
} from './server/server-fetch'

export const getIsomorphicApi = createIsomorphicFn()
  .server(() => ({
    GetResponse,
    PostResponse,
    PatchResponse,
    PutResponse,
    DeleteResponse: DelResponse,
    PublicGetResponse,
    PublicPostResponse,
  }))
  .client(() => ({
    GetResponse: ClientGetResponse,
    PostResponse: ClientPostResponse,
    PatchResponse: ClientPatchResponse,
    PutResponse: ClientPutResponse,
    DeleteResponse: ClientDelResponse,
    PublicGetResponse: ClientPublicGetResponse,
    PublicPostResponse: ClientPublicPostResponse,
  }))
