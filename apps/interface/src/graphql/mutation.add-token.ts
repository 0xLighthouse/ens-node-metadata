import { gql } from 'graphql-request'

export const MUTATION_ADD_TOKEN = gql`
  mutation AddSpaceToken($input: AddSpaceTokenInput!) {
    addSpaceToken(input: $input) {
      contract {
        contractId
      }
    }
  }
`
