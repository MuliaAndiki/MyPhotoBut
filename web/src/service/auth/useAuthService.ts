import { Api } from '#/lib/api'
import type { TResponse } from '#/pkg/api-wrapper.type.ts'
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
  RGoogleAuthURL,
  RLogin,
  RMagicLink,
  RRefreshToken,
  RRegister,
} from '#/types/api/auth'
import { toServiceResponse } from '#/utils/serviice.respone'
import { AuthEndpoint } from './auth.endpoint'

class UseAuth {
  /** POST /auth/register (Public) */
  public async Register(payload: PickRegister): Promise<TResponse<RRegister>> {
    const { client } = Api()
    const res = await client.PublicPostResponse<RRegister>(
      AuthEndpoint.register,
      payload,
    )
    return toServiceResponse(res)
  }

  /** POST /auth/login (Public) */
  public async Login(payload: PickLogin): Promise<TResponse<RLogin>> {
    const { client } = Api()
    const res = await client.PublicPostResponse<RLogin>(
      AuthEndpoint.login,
      payload,
    )
    return toServiceResponse(res)
  }

  /** POST /auth/magic-link (Public) */
  public async SendMagicLink(
    payload: PickMagicLink,
  ): Promise<TResponse<RMagicLink>> {
    const { client } = Api()
    const res = await client.PublicPostResponse<RMagicLink>(
      AuthEndpoint.magicLink,
      payload,
    )
    return toServiceResponse(res)
  }

  /** POST /auth/magic-link/verify (Public) */
  public async VerifyMagicLink(
    payload: PickVerifyMagicLink,
  ): Promise<TResponse<RAuthTokens>> {
    const { client } = Api()
    const res = await client.PublicPostResponse<RAuthTokens>(
      AuthEndpoint.verifyMagicLink,
      payload,
    )
    return toServiceResponse(res)
  }

  /** GET /auth/google (Public) */
  public async GetGoogleAuthURL(
    signal?: AbortSignal,
  ): Promise<TResponse<RGoogleAuthURL>> {
    const { client } = Api()
    const res = await client.PublicGetResponse<RGoogleAuthURL>(
      AuthEndpoint.google,
      { signal },
    )
    return toServiceResponse(res)
  }

  /** GET /auth/google/callback?code=...&state=... (Public) */
  public async GoogleCallback(
    params: PickGoogleCallback,
    signal?: AbortSignal,
  ): Promise<TResponse<RAuthTokens>> {
    const { client } = Api()
    const res = await client.PublicGetResponse<RAuthTokens>(
      AuthEndpoint.googleCallback,
      {
        query: {
          code: params.code,
          state: params.state,
        },
        signal,
      },
    )
    return toServiceResponse(res)
  }

  /** POST /auth/refresh (Public) */
  public async RefreshToken(
    payload: PickRefreshToken,
  ): Promise<TResponse<RRefreshToken>> {
    const { client } = Api()
    const res = await client.PublicPostResponse<RRefreshToken>(
      AuthEndpoint.refresh,
      payload,
    )
    return toServiceResponse(res)
  }

  /** POST /auth/logout (Authenticated) */
  public async Logout(payload: PickLogout): Promise<TResponse<null>> {
    const { client } = Api()
    const res = await client.PostResponse<null>(AuthEndpoint.logout, payload)
    return toServiceResponse(res)
  }

  /** GET /auth/me (Authenticated) */
  public async GetMe(
    signal?: AbortSignal,
  ): Promise<TResponse<RCreatorProfile>> {
    const { client } = Api()
    const res = await client.GetResponse<RCreatorProfile>(AuthEndpoint.me, {
      signal,
    })
    return toServiceResponse(res)
  }

  /** PATCH /auth/me (Authenticated) */
  public async UpdateMe(
    payload: PickUpdateMe,
  ): Promise<TResponse<RCreatorProfile>> {
    const { client } = Api()
    const res = await client.PatchResponse<RCreatorProfile>(
      AuthEndpoint.me,
      payload,
    )
    return toServiceResponse(res)
  }
}

export default new UseAuth()
