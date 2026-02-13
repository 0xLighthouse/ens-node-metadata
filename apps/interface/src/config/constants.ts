/**
 * The cookie name for the authentication token
 * Checks authentication on the server side
 */
export const AUTH_TOKEN_COOKIE = 'privy-token'

export const APP_NAME = 'ENSIP-XX Metadata Manager'

export const DOCS_NAV_URL =
  process.env.NEXT_PUBLIC_DOCS_URL ??
  'https://github.com/0xLighthouse/ens-org-registrar/tree/main/apps/docs'

export const SCHEMAS_NAV_URL =
  process.env.NEXT_PUBLIC_SCHEMAS_URL ??
  'https://github.com/0xLighthouse/ens-org-registrar/tree/main/packages/schemas'
