import { gql } from 'graphql-request'

export const QUERY_SPACE = gql`
  query QuerySpace($spaceId: String!) {
    space(spaceId: $spaceId) {
      spaceId
      ens
      avatar
      title
      indexedAtHeight
      isFoundingMember
      isTestnet
      audienceCount
      totalSubscribers
    }
  }
`
