import { API_ENDPOINT } from '@/config/constants'
import { GraphQLClient } from 'graphql-request'

// API client for authentication requests
// Uses the public API endpoint without authentication
export const createApiClient = () => {
  const endpoint = API_ENDPOINT
  return new GraphQLClient(endpoint)
}

export const api = createApiClient()
