import { gql } from 'graphql-request'

export const MUTATION_UPDATE_SPACE = gql`
  mutation UpdateSpace($input: UpdateSpaceInput!) {
    updateSpace(input: $input) {
      spaceId
      title
      description
      ens
      avatar
      website
      twitter
      isFoundingMember
      isPrivate
      isDiscoverable
      requireTokensToReply
      requireTokensToSubscribe
      isTokenGated
      tags {
        title
      }
    }
  }
`
