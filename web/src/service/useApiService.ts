import useAuthService from './auth/useAuthService'
import { WrapApi } from '#/utils/wrapApi'

export const useApiService = {
  // register All service
  auth: WrapApi(useAuthService),
}
