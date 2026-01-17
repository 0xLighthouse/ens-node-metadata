import { gql } from 'graphql-request'

export const QUERY_TEAMS = gql`
  query QueryTeams {
    me {
      status
      createdAt
      accounts {
        accountId
        address
        teams {
          role
          space {
            isFoundingMember
            avatar
            spaceId
            title
            ens
            indexedAtHeight
          }
        }
      }
    }
  }
`
