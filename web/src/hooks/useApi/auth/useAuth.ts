import {
  useGoogleCallbackMutation,
  useLogin,
  useLogout,
  useRefreshToken,
  useRegister,
  useSendMagicLink,
  useUpdateMe,
  useVerifyMagicLink,
} from './mutate/mutate'
import {
  useGetMe,
  useGoogleAuthUrl,
  useGoogleCallbackQuery,
} from './query/query'

export const useAuth = () => {
  return {
    mutate: {
      register: useRegister,
      login: useLogin,
      magicLink: useSendMagicLink,
      verifyMagicLink: useVerifyMagicLink,
      googleCallback: useGoogleCallbackMutation,
      refresh: useRefreshToken,
      logout: useLogout,
      updateMe: useUpdateMe,
    },
    query: {
      me: useGetMe,
      googleUrl: useGoogleAuthUrl,
      googleCallback: useGoogleCallbackQuery,
    },
  }
}
