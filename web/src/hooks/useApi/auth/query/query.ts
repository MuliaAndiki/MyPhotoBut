import { queryOptions, useQuery } from '@tanstack/react-query'
import type { TResponse } from '#/pkg/api-wrapper.type.ts'
import { QueryKey } from '#/pkg/react-query/querykey'
import { useApiService } from '#/service/useApiService'
import type {
  PickGoogleCallback,
  RAuthTokens,
  RCreatorProfile,
  RGoogleAuthURL,
} from '#/types/api/auth'

export const authMeQueryOptions = () =>
  queryOptions<TResponse<RCreatorProfile>, Error>({
    queryKey: QueryKey.authMe(),
    queryFn: ({ signal }) => useApiService.auth.GetMe(signal),
    staleTime: 60_000,
  })

/** GET /api/v1/auth/me */
export function useGetMe(options?: { enabled?: boolean }) {
  return useQuery({
    ...authMeQueryOptions(),
    enabled: options?.enabled ?? true,
  })
}

export const googleAuthUrlQueryOptions = () =>
  queryOptions<TResponse<RGoogleAuthURL>, Error>({
    queryKey: QueryKey.authGoogleUrl(),
    queryFn: ({ signal }) => useApiService.auth.GetGoogleAuthURL(signal),
    staleTime: 0,
  })

/** GET /api/v1/auth/google */
export function useGoogleAuthUrl(options?: { enabled?: boolean }) {
  return useQuery({
    ...googleAuthUrlQueryOptions(),
    enabled: options?.enabled ?? false,
  })
}

/** GET /api/v1/auth/google/callback?code=...&state=... */
export function useGoogleCallbackQuery(
  params: PickGoogleCallback,
  options?: { enabled?: boolean },
) {
  return useQuery<TResponse<RAuthTokens>, Error>({
    queryKey: QueryKey.authGoogleCallback(params.code, params.state),
    queryFn: ({ signal }) =>
      useApiService.auth.GoogleCallback(params, signal),
    enabled: (options?.enabled ?? true) && Boolean(params.code),
    retry: false,
  })
}
