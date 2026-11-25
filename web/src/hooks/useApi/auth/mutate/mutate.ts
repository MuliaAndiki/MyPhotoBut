import { useMutation } from '@tanstack/react-query'
import { useAppNameSpace } from '#/hooks/useAppNamespace'
import type { TResponse } from '#/pkg/api-wrapper.type.ts'
import { QueryKey } from '#/pkg/react-query/querykey'
import { useApiService } from '#/service/useApiService'
import type {
  PickGoogleCallback,
  PickLogin,
  PickLogout,
  PickMagicLink,
  PickRefreshToken,
  PickRegister,
  PickUpdateMe,
  PickVerifyMagicLink,
  RAuthTokens,
  RCreatorProfile,
  RLogin,
  RMagicLink,
  RRefreshToken,
  RRegister,
} from '#/types/api/auth'

/** POST /api/v1/auth/register */
export function useRegister() {
  return useMutation<TResponse<RRegister>, Error, PickRegister>({
    mutationFn: (payload: PickRegister) => useApiService.auth.Register(payload),
  })
}

/** POST /api/v1/auth/login */
export function useLogin() {
  const ns = useAppNameSpace()
  return useMutation<TResponse<RLogin>, Error, PickLogin>({
    mutationFn: (payload: PickLogin) => useApiService.auth.Login(payload),
    onSuccess: async () => {
      await ns.queryClient.invalidateQueries({ queryKey: QueryKey.authMe() })
    },
  })
}

/** POST /api/v1/auth/magic-link */
export function useSendMagicLink() {
  return useMutation<TResponse<RMagicLink>, Error, PickMagicLink>({
    mutationFn: (payload: PickMagicLink) =>
      useApiService.auth.SendMagicLink(payload),
  })
}

/** POST /api/v1/auth/magic-link/verify */
export function useVerifyMagicLink() {
  const ns = useAppNameSpace()
  return useMutation<TResponse<RAuthTokens>, Error, PickVerifyMagicLink>({
    mutationFn: (payload: PickVerifyMagicLink) =>
      useApiService.auth.VerifyMagicLink(payload),
    onSuccess: async () => {
      await ns.queryClient.invalidateQueries({ queryKey: QueryKey.authMe() })
    },
  })
}

/** GET /api/v1/auth/google/callback?code=...&state=... (as mutation trigger) */
export function useGoogleCallbackMutation() {
  const ns = useAppNameSpace()
  return useMutation<TResponse<RAuthTokens>, Error, PickGoogleCallback>({
    mutationFn: (params: PickGoogleCallback) =>
      useApiService.auth.GoogleCallback(params),
    onSuccess: async () => {
      await ns.queryClient.invalidateQueries({ queryKey: QueryKey.authMe() })
    },
  })
}

/** POST /api/v1/auth/refresh */
export function useRefreshToken() {
  return useMutation<TResponse<RRefreshToken>, Error, PickRefreshToken>({
    mutationFn: (payload: PickRefreshToken) =>
      useApiService.auth.RefreshToken(payload),
  })
}

/** POST /api/v1/auth/logout */
export function useLogout() {
  const ns = useAppNameSpace()
  return useMutation<TResponse<null>, Error, PickLogout>({
    mutationFn: (payload: PickLogout) => useApiService.auth.Logout(payload),
    onSuccess: async () => {
      ns.queryClient.removeQueries({ queryKey: QueryKey.authRoot() })
    },
  })
}

/** PATCH /api/v1/auth/me */
export function useUpdateMe() {
  const ns = useAppNameSpace()
  return useMutation<TResponse<RCreatorProfile>, Error, PickUpdateMe>({
    mutationFn: (payload: PickUpdateMe) => useApiService.auth.UpdateMe(payload),
    onSuccess: async () => {
      await ns.queryClient.invalidateQueries({ queryKey: QueryKey.authMe() })
    },
  })
}
