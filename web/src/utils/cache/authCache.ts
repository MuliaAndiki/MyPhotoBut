import type { AppNameSpace } from '#/hooks/useAppNamespace'
import { QueryKey } from '#/pkg/react-query/querykey'
import type { AuthInterface } from '#/types/api/auth'

export type AuthCacheContext = {
  previousData?: AuthInterface | null
}

export function readAuthSnapshot(
  ns: AppNameSpace,
): AuthInterface | null | undefined {
  return ns.queryClient.getQueryData<AuthInterface | null>(QueryKey.authMe())
}
