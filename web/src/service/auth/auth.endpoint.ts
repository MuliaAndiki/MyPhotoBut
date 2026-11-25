import { AuthMount } from '#/config/mount.config'

export const AuthEndpoint = {
  register: `${AuthMount}/register`,
  login: `${AuthMount}/login`,
  magicLink: `${AuthMount}/magic-link`,
  verifyMagicLink: `${AuthMount}/magic-link/verify`,
  google: `${AuthMount}/google`,
  googleCallback: `${AuthMount}/google/callback`,
  refresh: `${AuthMount}/refresh`,
  logout: `${AuthMount}/logout`,
  me: `${AuthMount}/me`,
} as const
