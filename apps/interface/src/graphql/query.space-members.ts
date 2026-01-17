import { gql } from 'graphql-request'

export const QUERY_SPACE_MEMBERS = gql`
  query SpaceMembers($spaceId: String!) {
    space(spaceId: $spaceId) {
      spaceId
      title
      description
      avatar
      members {
        role
        account {
          accountId
          address
        }
      }
    }
  }
`
