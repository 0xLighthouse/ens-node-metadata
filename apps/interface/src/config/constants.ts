export const TOKEN_COOKIE = 'lghths_auth-token'

export const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT as string

console.info('NEXT_PUBLIC_API_ENDPOINT', API_ENDPOINT)

if (!API_ENDPOINT) {
  throw new Error('Missing env variable NEXT_PUBLIC_API_ENDPOINT')
}
