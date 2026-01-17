import { gql } from 'graphql-request'

export const QUERY_SPACE_TOKENS = gql`
  query SpaceTokens($spaceId: String!) {
    space(spaceId: $spaceId) {
      spaceId
      tokens {
        contract {
          contractId
          indexedAccountsCount
          name
          type
          symbol
          address
          chainId
          image
        }
        description
        isRequired
        minBalance
        lastIndexedAt
      }
    }
  }
`
