import { useAuth } from './auth/useAuth'

export function useApi() {
  return {
    // register All Api
    auth: useAuth(),
  }
}

export default useApi
