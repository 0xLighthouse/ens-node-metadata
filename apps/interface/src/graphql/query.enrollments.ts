import { gql } from 'graphql-request'

export const QUERY_TEAMS = gql`
  query Teams {
    me {
      status
      createdAt
      accounts {
        accountId
        address
        teams {
          role
          space {
            ens
            tokens {
              contract {
                image
              }
            }
            spaceId
            title
            avatar
            description
            twitter
            website
            isDiscoverable
            isPrivate
            isTestnet
            isTokenGated
            isFoundingMember
            indexedAtHeight
            totalSubscribers
            audienceCount
          }
        }
      }
    }
  }
`
