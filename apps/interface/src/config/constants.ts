/**
 * The cookie name for the authentication token
 * Checks authentication on the server side
 */
export const AUTH_TOKEN_COOKIE = 'privy-token'

export const APP_NAME = 'ENSIP-XX Metadata Registrar'

export const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT as string

console.info('NEXT_PUBLIC_API_ENDPOINT', API_ENDPOINT)

if (!API_ENDPOINT) {
  throw new Error('Missing env variable NEXT_PUBLIC_API_ENDPOINT')
}
