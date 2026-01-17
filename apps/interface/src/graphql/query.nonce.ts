import { gql } from 'graphql-request'

export const QUERY_NONCE = gql`
  query nonce {
    nonce
  }
`
