export const QueryKey = {
  authRoot: () => ['auth'] as const,
  authMe: () => ['auth', 'me'] as const,
  authGoogleUrl: () => ['auth', 'google', 'url'] as const,
  authGoogleCallback: (code: string, state?: string) =>
    ['auth', 'google', 'callback', code, state ?? ''] as const,
}
