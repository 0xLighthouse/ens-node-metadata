import { gql } from 'graphql-request'

export const MUTATION_REMOVE_SPACE_TOKEN = gql`
  mutation RemoveSpaceToken($input: RemoveSpaceTokenInput!) {
    removeSpaceToken(input: $input)
  }
`
