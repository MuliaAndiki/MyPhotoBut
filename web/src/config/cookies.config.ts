export const APP_SESSION_COOKIE_KEY = 'mpb_access_token'
export const APP_SESSION_COOKIE_REFRESH = 'mpb_refresh_token'
export const APP_SESSION_COOKIE_ROLE = 'mpb_user_role'

/** 15 minutes in seconds for access token cookie max-age */
export const APP_ACCESS_TOKEN_COOKIE_MAX_AGE = 60 * 15

/** 30 days in milliseconds for refresh token cookie expiration */
export const APP_REFRESH_TOKEN_COOKIE_EXPIRES_IN = 30 * 24 * 60 * 60 * 1000
