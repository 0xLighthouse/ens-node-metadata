import { gql } from 'graphql-request'

export const MUTATION_ADD_SPACE_MEMBER = gql`
  mutation AddSpaceMember($input: AddSpaceMemberInput!) {
    addSpaceMember(input: $input) {
      spaceId
      members {
        role
        account {
          accountId
          address
        }
        profile {
          profileId
          displayName
        }
      }
    }
  }
`
