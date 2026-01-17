import { gql } from 'graphql-request'

export const MUTATION_UPDATE_SPACE_TOKEN = gql`
  mutation UpdateSpaceToken($input: UpdateSpaceTokenInput!) {
    updateSpaceToken(input: $input)
  }
`
