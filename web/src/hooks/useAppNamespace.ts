import { type QueryClient, useQueryClient } from '@tanstack/react-query'

export type AppNameSpace = {
  queryClient: QueryClient
}

export function useAppNameSpace(): AppNameSpace {
  const queryClient = useQueryClient()

  return {
    queryClient,
  }
}

export default useAppNameSpace
